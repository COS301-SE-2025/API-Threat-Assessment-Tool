from core.db_manager import db_manager
from input.api_importer import APIImporter
from core.api_client import APIClient
from core.vulnerability_scanner import VulnerabilityScanner
from core.vulnerability_test import OWASP_FLAGS
from core.report_generator import ReportGenerator
from core.scan_manager import ScanManager, ScanProfiles
from utils.query import success, bad_request, not_found, server_error, connection_test, response, HTTPCode
from typing import Dict, Any, List
from datetime import datetime, timezone
from dateutil.parser import parse as parse_datetime
from collections import defaultdict 
from datetime import timedelta

import socket
import json
import os
import signal
import sys
import uuid

HOST = '127.0.0.1'
PORT = 9011

USER_STORE: Dict[str, Dict[str, Any]] = {}
# USER_STORE structure:
# {
#     "user_id_1": {
#         "apis": { "api_id_hash_1": APIClientObject, ... },
#         "scans": { "api_id_hash_1": ScanManagerObject, ... }
#     }, ...
# }

# === Logging Helper ===
def log_with_timestamp(message: str):
    """Prints a message with a timezone-aware UTC timestamp."""
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3] + "Z"
    print(f"[{timestamp}] {message}")


def _invalidate_api_list_cache(user_id: str):
    """Removes the cached API list for a specific user."""
    if USER_STORE.get(user_id) and "api_list_cache" in USER_STORE[user_id]:
        del USER_STORE[user_id]["api_list_cache"]
        log_with_timestamp(f"Invalidated API list cache for user {user_id}")

def _get_api_client(user_id: str, api_id: str) -> APIClient:
    """
    Robustly retrieves an APIClient instance, checking memory cache first,
    then loading from the database as a fallback.
    """
    # Ensure the basic cache structure exists to prevent KeyErrors
    USER_STORE.setdefault(user_id, {}).setdefault("apis", {})
    
    # 1. Check if the APIClient object is already in memory (fast path)
    api_client = USER_STORE[user_id]["apis"].get(api_id)
    
    if api_client:
        return api_client

    # 2. If not in memory, try to load it from the database
    log_with_timestamp(f"APIClient for {api_id} not in cache. Loading from DB...")
    api_client = APIClient.load_from_db(api_id)
    
    if not api_client:
        # If it's not in the DB either, then it's a true "not found"
        return None
    
    # 3. Add the loaded client back to the cache for future requests
    USER_STORE[user_id]["apis"][api_id] = api_client
    log_with_timestamp(f"Cached APIClient {api_id} for user {user_id} from DB.")
    
    return api_client

def _get_or_create_scan_manager(user_id: str, api_id: str) -> ScanManager:
    # Ensure the basic cache structure exists to prevent errors
    USER_STORE.setdefault(user_id, {}).setdefault("apis", {})
    USER_STORE[user_id].setdefault("scans", {})

    # 1. Use the new robust helper to get the API client
    api_client = _get_api_client(user_id, api_id)
    if not api_client:
        return None # API truly does not exist

    # 2. Now that we have the api_client, get or create its ScanManager
    USER_STORE[user_id].setdefault("scans", {})
    if api_id not in USER_STORE[user_id]["scans"]:
        USER_STORE[user_id]["scans"][api_id] = ScanManager(api_client)

    return USER_STORE[user_id]["scans"][api_id]

# === Dashboard ===
def dashboard_overview(request):
    """
    Gathers and returns a comprehensive, optimized overview of the user's security posture.
    """
    user_id = request.get("data", {}).get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    try:
        # STEP 1: Get all of the user's APIs in a single query.
        user_apis = db_manager.select("apis", columns="id, name", filters={"user_id": user_id})
        if not user_apis:
            return success({
                "total_apis": 0, "total_scans": 0, "total_vulnerabilities": 0,
                "critical_vulnerabilities": 0, "vulnerabilities_by_severity": {},
                "recent_scans": [], "scan_activity_weekly": [], "top_vuln_types": []
            })

        api_ids = [api['id'] for api in user_apis]
        api_name_map = {api['id']: api['name'] for api in user_apis}

        # STEP 2: Get all scans for those APIs.
        all_scans = db_manager.select("scans", columns="id, api_id, status, completed_at", filters={"api_id": api_ids})
        completed_scans = [s for s in all_scans if s['status'] == 'completed' and s.get('completed_at')]
        scan_ids = [scan['id'] for scan in completed_scans]
        
        # Initialize metrics
        vulnerabilities_by_severity = defaultdict(int)
        top_vuln_types = defaultdict(int)
        vuln_count_by_scan_id = defaultdict(int)
        total_vulnerabilities = 0

        if scan_ids:
            # STEP 3: BATCH FETCH all results for ALL completed scans in a single query.
            all_results = db_manager.select(
                "scan_results",
                columns="scan_id, severity, vulnerability_name", # Added scan_id
                filters={"scan_id": scan_ids}
            )
            
            # STEP 4: Process all results in memory ONCE to build our lookup maps.
            total_vulnerabilities = len(all_results)
            for res in all_results:
                severity = res.get("severity", "UNKNOWN").upper()
                vuln_name = res.get("vulnerability_name", "Unknown Vulnerability")
                
                vulnerabilities_by_severity[severity] += 1
                if vuln_name:
                    top_vuln_types[vuln_name] += 1
                vuln_count_by_scan_id[res['scan_id']] += 1
        
        # STEP 5: Prepare recent scans using the in-memory map (NO NEW DB CALLS).
        completed_scans.sort(key=lambda s: parse_datetime(s["completed_at"]), reverse=True)
        recent_scans = []
        for scan in completed_scans[:5]:
            recent_scans.append({
                "id": scan['id'],
                "apiName": api_name_map.get(scan['api_id'], "Unknown API"),
                "date": parse_datetime(scan['completed_at']).isoformat(),
                "status": scan['status'],
                "vulnerabilities": vuln_count_by_scan_id.get(scan['id'], 0) # Efficient lookup
            })

        # STEP 6: Prepare weekly activity using the in-memory map (NO NEW DB CALLS).
        weekly_chart_data_map = {day: {'scans': 0, 'vulnerabilities': 0} for day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
        today = datetime.now(timezone.utc).date()
        
        for scan in completed_scans:
            completed_date = parse_datetime(scan['completed_at']).date()
            if completed_date > (today - timedelta(days=7)):
                day_name = completed_date.strftime('%a')
                weekly_chart_data_map[day_name]['scans'] += 1
                weekly_chart_data_map[day_name]['vulnerabilities'] += vuln_count_by_scan_id.get(scan['id'], 0) # Efficient lookup
        
        weekly_chart_data = [{'day': day, **data} for day, data in weekly_chart_data_map.items()]

        # Prepare final payload
        sorted_top_vulns = sorted(top_vuln_types.items(), key=lambda item: item[1], reverse=True)[:4]
        overview_data = {
            "total_apis": len(user_apis),
            "total_scans": len(all_scans),
            "total_vulnerabilities": total_vulnerabilities,
            "critical_vulnerabilities": vulnerabilities_by_severity.get("CRITICAL", 0),
            "vulnerabilities_by_severity": dict(vulnerabilities_by_severity),
            "recent_scans": recent_scans,
            "scan_activity_weekly": weekly_chart_data,
            "top_vuln_types": [{"type": v[0], "count": v[1]} for v in sorted_top_vulns]
        }

        return success(overview_data)

    except Exception as e:
        log_with_timestamp(f"Error in dashboard_overview: {e}")
        return server_error(str(e))


def dashboard_metrics(request): 
    # This endpoint is not used by the new dashboard, as 'dashboard_overview' provides all necessary data.
    # It is kept here as a placeholder.
    log_with_timestamp("dashboard.metrics call received, but is deprecated. Use dashboard.overview instead.")
    return server_error("This endpoint is deprecated. Please use 'dashboard.overview'.")

def dashboard_alerts(request): 
    # This endpoint is not used by the new dashboard.
    log_with_timestamp("dashboard.alerts call received, but is deprecated. Use dashboard.overview instead.")
    return server_error("This endpoint is deprecated. Please use 'dashboard.overview'.")


# In main.py

def import_file(request):
    user_id = request.get("data", {}).get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    file_name = request.get("data", {}).get("file")
    if not file_name:
        return bad_request("Missing 'file' field in request data")

    try:
        file_path = f"Files/{file_name}"
        importer = APIImporter()
        log_with_timestamp(f"Importing new openAPI file: {file_path}")
        api_client = importer.import_openapi(file_path)

        if not api_client.save_to_db(user_id):
            return server_error("Failed to save the imported API to the database.")
        
        api_id = api_client.db_id

        # FIX: Robustly ensure the cache structure exists before use
        # This prevents the KeyError: 'apis'
        USER_STORE.setdefault(user_id, {}).setdefault("apis", {})
        
        # Now it is safe to add the new API to the in-memory cache
        USER_STORE[user_id]["apis"][api_id] = api_client

        # Invalidate the cached list of APIs so the new one appears on next fetch
        _invalidate_api_list_cache(user_id)

        return response(HTTPCode.SUCCESS, {"api_id": api_id, "filename": file_name})

    except FileNotFoundError:
        return not_found(f"File '{file_name}' not found on server.")
    except Exception as e:
        log_with_timestamp(f"Error in import_file: {e}")
        return server_error(str(e))

# In main.py, replace the entire get_all_apis function with this new version.

def get_all_apis(request):
    user_id = request.get("data", {}).get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    # The API list is now dynamic, so we should not cache it this way.
    # The cache will be invalidated on share/revoke actions if needed, but for now, let's remove it for simplicity.
    log_with_timestamp(f"Fetching all accessible APIs for user {user_id}.")
    
    try:
        # STEP 1: Get APIs OWNED BY the user.
        owned_apis_data = db_manager.select("apis", columns="id, name, version, imported_on, user_id", filters={"user_id": user_id})
        for api in owned_apis_data:
            api['permission'] = 'owner' # Mark as owner

        # STEP 2: Get APIs SHARED WITH the user.
        shared_access_records = db_manager.select("api_access", columns="api_id, permission", filters={"user_id": user_id})
        shared_api_ids = [rec['api_id'] for rec in shared_access_records]
        
        shared_apis_data = []
        if shared_api_ids:
            # Get the details for the shared APIs
            shared_apis_details = db_manager.select("apis", columns="id, name, version, imported_on, user_id", filters={"id": shared_api_ids})
            
            # Create maps for efficient lookups
            permission_map = {rec['api_id']: rec['permission'] for rec in shared_access_records}
            owner_ids = {api['user_id'] for api in shared_apis_details}
            owners = db_manager.select("users", columns="id, first_name, last_name", filters={"id": list(owner_ids)})
            owner_map = {owner['id']: f"{owner['first_name']} {owner['last_name']}".strip() for owner in owners}
            
            for api in shared_apis_details:
                api['permission'] = permission_map.get(api['id'], 'read')
                api['owner_name'] = owner_map.get(api['user_id'], 'Unknown Owner')
                shared_apis_data.append(api)

        # STEP 3: Combine lists and prepare for fetching scan data.
        all_user_apis = owned_apis_data + shared_apis_data
        if not all_user_apis:
            return response(HTTPCode.SUCCESS, {"apis": []})

        all_api_ids = [api['id'] for api in all_user_apis]

        # STEP 4: Batch fetch all scan and result data for ALL accessible APIs.
        all_completed_scans = db_manager.select(
            "scans",
            columns="id, api_id, completed_at",
            filters={"api_id": all_api_ids, "status": "completed"}
        )
        
        scans_by_api_id = defaultdict(list)
        for scan in all_completed_scans:
            scans_by_api_id[scan['api_id']].append(scan)
        
        scan_ids_to_check = [scan['id'] for scan in all_completed_scans]
        results_count_by_scan_id = defaultdict(int)

        if scan_ids_to_check:
            all_scan_results = db_manager.select("scan_results", columns="scan_id", filters={"scan_id": scan_ids_to_check})
            for result in all_scan_results:
                results_count_by_scan_id[result['scan_id']] += 1

        # STEP 5: Build the final response list.
        api_list_for_frontend = []
        for api in all_user_apis:
            api_id = api['id']
            vulnerabilities_found = 0
            last_scanned = "Never"
            scan_status = "Ready"

            if api_id in scans_by_api_id:
                api_scans = scans_by_api_id[api_id]
                api_scans.sort(key=lambda s: parse_datetime(s["completed_at"]), reverse=True)
                latest_scan = api_scans[0]
                
                scan_status = "Completed"
                last_scanned = parse_datetime(latest_scan.get("completed_at")).isoformat().split('T')[0]
                vulnerabilities_found = results_count_by_scan_id.get(latest_scan['id'], 0)

            dt_obj = parse_datetime(api.get("imported_on"))
            created_at_iso = dt_obj.isoformat()

            api_list_for_frontend.append({
                "id": api_id,
                "api_id": api_id,
                "name": api.get("name"),
                "version": api.get("version"),
                "created_at": created_at_iso,
                "vulnerabilitiesFound": vulnerabilities_found,
                "lastScanned": last_scanned,
                "scanStatus": scan_status,
                "permission": api['permission'], # Pass permission to frontend
                "owner_name": api.get('owner_name') # Pass owner name if it exists
            })
        
        return response(HTTPCode.SUCCESS, {"apis": api_list_for_frontend})

    except Exception as e:
        log_with_timestamp(f"Error in get_all_apis: {e}")
        return server_error(str(e))
        

def create_api(request): 
    return server_error("Not yet implemented")

def get_api_details(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id' field")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found in memory or database.")

    return response(HTTPCode.SUCCESS, {
        "title": client.title,
        "version": client.version,
        "base_url": client.base_url,
        "num_endpoints": len(client.endpoints)
    })

def update_api(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    updates = request.get("data", {}).get("updates", {})
    if not all([user_id, api_id]):
        return bad_request("Missing 'user_id' or 'api_id'")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    db_updates = {}
    for key in ["title", "version", "base_url"]:
        # only apply if the key exists and is not None
        if key in updates and updates[key] is not None:
            setattr(client, key, updates[key])
            db_key = "name" if key == "title" else key
            db_updates[db_key] = updates[key]

    if db_updates:
        if not client.update_in_db(db_updates):
            return server_error("Failed to persist API updates to the database.")

    return success({"message": "API metadata updated successfully."})


def delete_api(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id' field")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API not found, cannot delete.")

    if client.delete_from_db():
        # Clean up from cache if it exists
        if user_id in USER_STORE and "apis" in USER_STORE[user_id]:
            USER_STORE[user_id]["apis"].pop(api_id, None)
        if user_id in USER_STORE and "scans" in USER_STORE[user_id]:
            USER_STORE[user_id]["scans"].pop(api_id, None)
        
        _invalidate_api_list_cache(user_id)

        return success({"message": "API deleted successfully."})
    else:
        return server_error("Failed to delete API from the database.")



def import_url(request): 
    return server_error("Not yet implemented")

# === API endpoints ===
def get_api_endpoints(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id' field")

    # CORRECT IMPLEMENTATION: Rely solely on the helper function
    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found({"message": "API not found."})

    endpoints = [{
        "id": ep.id,
        "path": ep.path,
        "method": ep.method,
        "summary": ep.summary,
        "tags": ep.tags,
        "flags": [flag.name for flag in ep.flags]
    } for ep in client.endpoints]

    return response(HTTPCode.SUCCESS, {"endpoints": endpoints})



def get_endpoint_details(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    endpoint_id = request.get("data", {}).get("endpoint_id")
    if not all([user_id, api_id, endpoint_id]):
        return bad_request("Missing 'user_id', 'api_id', or endpoint 'id'")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    for ep in client.endpoints:
        if ep.id == endpoint_id:
            return response(HTTPCode.SUCCESS, {
                "id": ep.id,
                "path": ep.path,
                "method": ep.method,
                "summary": ep.summary,
                "description": ep.description,
                "tags": ep.tags,
                "flags": [flag.name for flag in ep.flags]
            })

    return not_found("Endpoint not found")



def add_tags(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")
    if not all([user_id, api_id, path, method, tags]):
        return bad_request("Missing required fields")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = list(set(ep.tags + tags))
            if not ep.update_in_db({"tags": ep.tags}):
                return server_error("Failed to update tags in the database.")
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})
    return not_found("Endpoint not found")



def remove_tags(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")
    if not all([user_id, api_id, path, method, tags]):
        return bad_request("Missing required fields")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")
        
    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = [t for t in ep.tags if t not in tags]
            if not ep.update_in_db({"tags": ep.tags}):
                return server_error("Failed to update tags in the database.")
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})
    return not_found("Endpoint not found")



def replace_tags(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")
    if not all([user_id, api_id, path, method]) or tags is None:
        return bad_request("Missing required fields")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = tags
            if not ep.update_in_db({"tags": ep.tags}):
                return server_error("Failed to update tags in the database.")
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})
    return not_found("Endpoint not found")


def get_all_tags(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id'")
    
    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    all_tags = set()
    for ep in client.endpoints:
        all_tags.update(ep.tags)
    return response(HTTPCode.SUCCESS, {"tags": list(all_tags)})


#===================================
# flags

def add_flags(request):
    user_id, api_id, endpoint_id, flag_str = (
        request.get("data", {}).get(k) for k in ["user_id", "api_id", "endpoint_id", "flags"]
    )
    if not all([user_id, api_id, endpoint_id, flag_str]):
        return bad_request("Missing required fields")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    try:
        flag_enum = OWASP_FLAGS[flag_str]
    except KeyError:
        return bad_request(f"Invalid flag. Valid flags: {[f.name for f in OWASP_FLAGS]}")

    for ep in client.endpoints:
        if ep.id == endpoint_id:
            ep.add_flag(flag_enum)
            
            flags_for_db = [f.name for f in ep.flags]
            if not ep.update_in_db({"flags": flags_for_db}):
                return server_error("Failed to persist flag changes to the database.")

            return response(HTTPCode.SUCCESS, {
                "flags": [f.name for f in ep.flags]
            })
    return not_found("Endpoint not found")

def remove_flags(request):
    user_id, api_id, endpoint_id, flag_str = (
        request.get("data", {}).get(k) for k in ["user_id", "api_id", "endpoint_id", "flags"]
    )
    if not all([user_id, api_id, endpoint_id, flag_str]):
        return bad_request("Missing required fields")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    try:
        flag_enum = OWASP_FLAGS[flag_str]
    except KeyError:
        return bad_request(f"Invalid flag. Valid flags: {[f.name for f in OWASP_FLAGS]}")
    
    for ep in client.endpoints:
        if ep.id == endpoint_id:
            if flag_enum in ep.flags:
                ep.remove_flag(flag_enum)

                flags_for_db = [f.name for f in ep.flags]
                if not ep.update_in_db({"flags": flags_for_db}):
                    return server_error("Failed to persist flag changes to the database.")

                return response(HTTPCode.SUCCESS, {
                    "flags": [f.name for f in ep.flags],
                    "message": f"Flag '{flag_str}' removed successfully"
                })
            else:
                return bad_request(f"Flag '{flag_str}' not set on endpoint")
    return not_found(f"Endpoint with ID '{endpoint_id}' not found")


# === Scheduled Scans (NEW FUNCTIONS) ===

def get_schedule(request):
    """Retrieves the schedule for a given API."""
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing user_id or api_id")

    schedule_data = db_manager.select("scheduled_scans", filters={"api_id": api_id, "user_id": user_id})
    if not schedule_data:
        return response(HTTPCode.SUCCESS, {"schedule": None}) # Return success with no schedule
    
    return response(HTTPCode.SUCCESS, {"schedule": schedule_data[0]})

def create_or_update_schedule(request):
    """Creates a new scan schedule or updates an existing one."""
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    frequency = request.get("data", {}).get("frequency")
    is_enabled = request.get("data", {}).get("is_enabled", True)

    if not all([user_id, api_id, frequency]):
        return bad_request("Missing user_id, api_id, or frequency")
    if frequency not in ['daily', 'weekly', 'monthly']:
        return bad_request("Invalid frequency. Must be 'daily', 'weekly', or 'monthly'.")

    now = datetime.now(timezone.utc)
    if frequency == 'daily':
        next_run_at = now + timedelta(days=1)
    elif frequency == 'weekly':
        next_run_at = now + timedelta(weeks=1)
    else: # monthly
        next_run_at = now + timedelta(days=30)

    schedule_data = {
        "user_id": user_id,
        "api_id": api_id,
        "frequency": frequency,
        "is_enabled": is_enabled,
        "next_run_at": next_run_at.isoformat(),
        "updated_at": now.isoformat()
    }

    # Use an "upsert" to either create or update the schedule based on the unique api_id
    result = db_manager.upsert("scheduled_scans", schedule_data, on_conflict="api_id")

    if not result:
        return server_error("Failed to save schedule to the database.")

    _invalidate_api_list_cache(user_id)
    return response(HTTPCode.SUCCESS, {"schedule": result[0]})

def delete_schedule(request):
    """Deletes a scan schedule."""
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing user_id or api_id")

    deleted = db_manager.delete("scheduled_scans", filters={"api_id": api_id, "user_id": user_id})
    if not deleted:
        return not_found("No schedule found for this API to delete.")
    
    _invalidate_api_list_cache(user_id)
    return success({"message": "Schedule deleted successfully."})

# NOTE: This function is for the cron job runner.
# It should be called by a separate, scheduled script.
def check_and_run_scheduled_scans():
    """
    This function should be run periodically by a scheduler (e.g., a cron job).
    It finds and starts scans that are due to run.
    """
    log_with_timestamp("Checking for scheduled scans to run...")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Find schedules that are enabled and past their due time
    due_scans = db_manager.select_with_filter("scheduled_scans", filters=[
        ("is_enabled", "eq", True),
        ("next_run_at", "lte", now_iso)
    ])

    if not due_scans:
        log_with_timestamp("No scans are due.")
        return

    for schedule in due_scans:
        log_with_timestamp(f"Running scheduled scan for API {schedule['api_id']}")
        try:
            scan_manager = _get_or_create_scan_manager(schedule['user_id'], schedule['api_id'])
            if not scan_manager:
                log_with_timestamp(f"Could not find API Client for {schedule['api_id']}. Skipping.")
                continue

            # Start the scan
            scan_manager.run_scan(schedule['api_id'], schedule['user_id'])
            
            # Calculate the next run time and update the schedule
            now = datetime.now(timezone.utc)
            if schedule['frequency'] == 'daily':
                next_run_at = now + timedelta(days=1)
            elif schedule['frequency'] == 'weekly':
                next_run_at = now + timedelta(weeks=1)
            else: # monthly
                next_run_at = now + timedelta(days=30)
            
            db_manager.update("scheduled_scans", 
                data={"next_run_at": next_run_at.isoformat(), "updated_at": now.isoformat()},
                filters={"id": schedule['id']}
            )
            log_with_timestamp(f"Successfully started scan for API {schedule['api_id']}. Next run at {next_run_at.isoformat()}")

        except Exception as e:
            log_with_timestamp(f"Error processing scheduled scan for API {schedule['api_id']}: {e}")

# === Scans ===
def create_scan(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id' field")

    scan_manager = _get_or_create_scan_manager(user_id, api_id)
    
    if not scan_manager:
        return not_found("API client not found, cannot create scan.")

    return success({"message": "Scan session created. Ready to start."})

def start_scan(request): 
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing 'user_id' or 'api_id' field")

    scan_manager = _get_or_create_scan_manager(user_id, api_id)
    if not scan_manager:
        return not_found("API client not found, cannot start scan.")

    try:
        scan_id = scan_manager.run_scan(api_id, user_id)
        if scan_id:
            return success({"scan_id": scan_id})
        else:
            return server_error("Failed to start scan or retrieve scan ID.")
    except Exception as e:
        log_with_timestamp(f"Error during start_scan: {e}")
        return server_error(str(e))

# main.py

def get_scan_status(request):
    """Checks the status of a scan and returns results if completed."""
    scan_id = request.get("data", {}).get("scan_id")
    if not scan_id:
        return bad_request("Missing 'scan_id' field")

    try:
        # Query the database directly for the scan's status
        scan_data = db_manager.select("scans", filters={"id": scan_id})
        if not scan_data:
            return not_found(f"Scan with ID {scan_id} not found.")

        scan_info = scan_data[0]
        status = scan_info.get("status")

        if status == 'completed':
            # FIX: Load the APIClient associated with this scan before creating the ScanManager
            api_id = scan_info.get("api_id")
            if not api_id:
                return server_error(f"Scan {scan_id} is missing an api_id.")

            # Load the full APIClient object from the database
            api_client = APIClient.load_from_db(api_id)
            if not api_client:
                return not_found(f"Could not load APIClient for api_id {api_id}. It may have been deleted.")

            # Now, initialize ScanManager with the fully loaded api_client
            scan_manager = ScanManager(api_client) 
            
            # This call will now succeed because the manager has a valid client
            scan_details = scan_manager.get_scan_details(scan_id)
            
            return success({
                "status": "completed",
                "results": scan_details
            })
        else:
            # If running, pending, or failed, just return the status
            return success({"status": status})

    except Exception as e:
        log_with_timestamp(f"Error in get_scan_status: {e}")
        return server_error(str(e))


def get_scan_results(request):
    """
    Checks the status of a scan. If 'completed', it returns the full details 
    including the scan info and all associated vulnerability results.
    """
    scan_id = request.get("data", {}).get("scan_id")
    if not scan_id:
        return bad_request("Missing 'scan_id' field")

    try:
        # First, get the main scan record to check its status
        scan_data = db_manager.select("scans", filters={"id": scan_id})
        if not scan_data:
            return not_found(f"Scan with ID {scan_id} not found.")

        scan_info = scan_data[0]
        status = scan_info.get("status")

        # If the scan is complete, fetch its detailed results
        if status == 'completed':
            # We can reuse the ScanManager's logic to fetch and parse results
            scan_manager = ScanManager(None) # No APIClient needed, just for utility
            scan_details = scan_manager.get_scan_details(scan_id)
            return success(scan_details)
        
        # If the scan is running, failed, or pending, just return that status
        else:
            return success({"status": status, "scan_info": scan_info, "results": []})

    except Exception as e:
        log_with_timestamp(f"Error in get_scan_results: {e}")
        return server_error(str(e))

def get_all_scans(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    try:
        filters = {"user_id": user_id}
        if api_id:
            filters["api_id"] = api_id
        
        all_scans = db_manager.select("scans", filters=filters)
        
        return success({"scans": all_scans})
    except Exception as e:
        log_with_timestamp(f"Error in get_all_scans: {e}")
        return server_error(str(e))

def scan_progress(request):
    report_id = request.get("report_id")
    if not report_id:
        return bad_request("Missing 'report_id'")
    return success({"report_id": report_id, "status": "running", "progress": "50%"})
    

def stop_scan(request): 
    report_id= request.get("report_id")
    if not report_id:
        return bad_request("Missing 'report_id'")
    return success({f"Stop request received for report {report_id}"})

def share_api(request):
    """Shares an API with another user by their email address."""
    owner_user_id = request.get("data", {}).get("owner_user_id")
    api_id = request.get("data", {}).get("api_id")
    share_with_email = request.get("data", {}).get("email")
    permission = request.get("data", {}).get("permission", "read")

    if not all([owner_user_id, api_id, share_with_email]):
        return bad_request("Missing owner_user_id, api_id, or email.")

    # 1. Verify ownership
    api_owner = db_manager.select("apis", columns="user_id", filters={"id": api_id, "user_id": owner_user_id})
    if not api_owner:
        return response(HTTPCode.FORBIDDEN, {"message": "You do not own this API or it does not exist."})

    # 2. Find the user to share with
    target_user = db_manager.select("users", columns="id", filters={"email": share_with_email})
    if not target_user:
        return not_found(f"User with email '{share_with_email}' not found.")
    
    target_user_id = target_user[0]['id']

    if target_user_id == owner_user_id:
        return bad_request("You cannot share an API with yourself.")

    # 3. Check for existing share to either update or insert
    share_data = {"api_id": api_id, "user_id": target_user_id, "permission": permission}
    existing_share = db_manager.select("api_access", filters={"api_id": api_id, "user_id": target_user_id})
    
    if existing_share:
        result = db_manager.update("api_access", data={"permission": permission}, filters={"api_id": api_id, "user_id": target_user_id})
        message = "API share permission updated successfully."
    else:
        result = db_manager.insert("api_access", data=share_data)
        message = "API shared successfully."

    if not result:
        return server_error("Failed to save API share information.")
        
    return success({"message": message})


def get_api_shares(request):
    """Retrieves a list of users an API is shared with."""
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")

    if not all([user_id, api_id]):
        return bad_request("Missing user_id or api_id.")
        
    # Verify ownership
    api_owner = db_manager.select("apis", columns="user_id", filters={"id": api_id, "user_id": user_id})
    if not api_owner:
        return response(HTTPCode.FORBIDDEN, {"message": "You do not have permission to view shares for this API."})
        
    access_records = db_manager.select("api_access", columns="user_id, permission", filters={"api_id": api_id})
    if not access_records:
        return success({"shares": []})
        
    user_ids = [rec['user_id'] for rec in access_records]
    users_info = db_manager.select("users", columns="id, email, first_name, last_name", filters={"id": user_ids})
    
    user_map = {user['id']: user for user in users_info}
    
    shares = []
    for rec in access_records:
        user_info = user_map.get(rec['user_id'])
        if user_info:
            shares.append({
                "user_id": user_info['id'],
                "email": user_info['email'],
                "name": f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip(),
                "permission": rec['permission']
            })
            
    return success({"shares": shares})

def revoke_api_access(request):
    """Revokes a user's access to a specific API."""
    owner_user_id = request.get("data", {}).get("owner_user_id")
    api_id = request.get("data", {}).get("api_id")
    revoke_user_id = request.get("data", {}).get("revoke_user_id")

    if not all([owner_user_id, api_id, revoke_user_id]):
        return bad_request("Missing owner_user_id, api_id, or revoke_user_id.")

    # Verify ownership
    api_owner = db_manager.select("apis", columns="user_id", filters={"id": api_id, "user_id": owner_user_id})
    if not api_owner:
        return response(HTTPCode.FORBIDDEN, {"message": "You do not own this API."})
        
    deleted = db_manager.delete("api_access", filters={"api_id": api_id, "user_id": revoke_user_id})
    
    if not deleted:
        return not_found("Access record not found for this user and API.")
        
    return success({"message": "API access revoked successfully."})

# Add this new function to main.py
def leave_api_share(request):
    """Allows a user to remove their own access from a shared API."""
    user_id = request.get("data", {}).get("user_id") # The user who is leaving
    api_id = request.get("data", {}).get("api_id")
    if not user_id or not api_id:
        return bad_request("Missing user_id or api_id")

    deleted = db_manager.delete("api_access", filters={"api_id": api_id, "user_id": user_id})
    if not deleted:
        return not_found("API access record not found for this user. Nothing to remove.")
    
    return success({"message": "You have successfully left the API share."})

def set_api_key(request):
    user_id = request.get("data", {}).get("user_id")
    api_id = request.get("data", {}).get("api_id")
    api_key = request.get("data", {}).get("api_key")
    if not all([user_id, api_id, api_key]):
        return bad_request("Missing 'user_id', 'api_id', or 'api_key'")

    client = _get_api_client(user_id, api_id)
    if not client:
        return not_found("API client not found.")

    client.set_auth_token(api_key)
    return response(HTTPCode.SUCCESS, {"message": "api key set"})


# === Repots ===
def get_all_reports(request): return server_error("Not yet implemented")
def get_report_details(request): return server_error("Not yet implemented")
def download_report(request): return server_error("Not yet implemented")

# === Templates ===
def get_all_templates(request): return server_error("Not yet implemented")
def get_template_details(request): return server_error("Not yet implemented")
def use_template(request): return server_error("Not yet implemented")

# === User Profile ===
def get_profile(request): return server_error("Not yet implemented")
def update_profile(request): return server_error("Not yet implemented")
def get_settings(request): return server_error("Not yet implemented")
def update_settings(request): return server_error("Not yet implemented")

# === Auth Stubs ===
def auth_register(request): return server_error("Not yet implemented")
def auth_login(request): return server_error("Not yet implemented")
def auth_google(request): return server_error("Not yet implemented")
def auth_logout(request): return server_error("Not yet implemented")

# === handle_request ===
def handle_request(request: dict):
    command = request.get("command")

    routes = {
        "connection.test": connection_test,
        "auth.register": auth_register,
        "auth.login": auth_login,
        "auth.google": auth_google,
        "auth.logout": auth_logout,
        "dashboard.overview": dashboard_overview,
        "dashboard.metrics": dashboard_metrics,
        "dashboard.alerts": dashboard_alerts,
        "apis.get_all": get_all_apis,
        "apis.create": create_api,
        "apis.details": get_api_details,
        "apis.update": update_api,
        "apis.delete": delete_api,
        "apis.import_file": import_file,
        "apis.import_url": import_url,
        "endpoints.list": get_api_endpoints,
        "endpoints.details": get_endpoint_details,
        "endpoints.tags.add": add_tags,
        "endpoints.tags.remove": remove_tags,
        "endpoints.tags.replace": replace_tags,
        "tags.list": get_all_tags,
        "endpoints.flags.add": add_flags,
        "endpoints.flags.remove": remove_flags,
        "scan.create": create_scan,
        "scan.results": get_scan_results,
        "scan.start": start_scan,
        "scan.status": get_scan_status,
        "scan.stop": stop_scan,
        "scan.list": get_all_scans,
        "scans.schedule.get": get_schedule,
        "scans.schedule.create_or_update": create_or_update_schedule,
        "scans.schedule.delete": delete_schedule,
        "apis.share": share_api,
        "apis.shares.list": get_api_shares,
        "apis.shares.revoke": revoke_api_access,
        "apis.shares.leave": leave_api_share, 
        "templates.list": get_all_templates,
        "templates.details": get_template_details,
        "templates.use": use_template,
        "user.profile.get": get_profile,
        "user.profile.update": update_profile,
        "user.settings.get": get_settings,
        "user.settings.update": update_settings,
        "reports.list": get_all_reports,
        "reports.details": get_report_details,
        "reports.download": download_report,
        "apis.key.set": set_api_key,
    }

    handler = routes.get(command)
    if handler:
        return handler(request)
    else:
        return bad_request(f"Unknown command '{command}'")

# === Server Execution Logic ===
def run_server():
    log_with_timestamp(f"[ATAT] Listening on {HOST}:{PORT}")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen(5)
        
        running = True
        def signal_handler(sig, frame):
            nonlocal running
            log_with_timestamp("\n[ATAT] Shutting down server gracefully...")
            running = False
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as dummy_socket:
                    dummy_socket.settimeout(1.0)
                    dummy_socket.connect((HOST, PORT))
            except (ConnectionRefusedError, socket.timeout):
                pass
        
        signal.signal(signal.SIGINT, signal_handler)
        
        while running:
            try:
                s.settimeout(1.0)
                conn, addr = s.accept()
                with conn:
                    log_with_timestamp(f"[CONNECTION] Accepted from: {addr}")
                    conn.settimeout(2.0)
                    
                    data = b""
                    try:
                        while True:
                            chunk = conn.recv(4096)
                            if not chunk: break
                            data += chunk
                    except socket.timeout:
                        log_with_timestamp(f"[INFO] Socket timeout for {addr}. Assuming end of message.")
                        pass

                    if data:
                        try:
                            request = json.loads(data.decode())
                            log_with_timestamp(f"[RECV] From {addr}: {request}")
                            response_data = handle_request(request)
                        except json.JSONDecodeError:
                            log_with_timestamp(f"[ERROR] Malformed JSON from {addr}")
                            response_data = bad_request("Malformed JSON received.")
                        except Exception as e:
                            log_with_timestamp(f"[ERROR] Unhandled exception from {addr}: {e}")
                            response_data = server_error(str(e))
                        
                        # FIX: Ensure the enum value is used for JSON serialization
                        if 'code' in response_data and isinstance(response_data['code'], HTTPCode):
                            response_data['code'] = response_data['code'].value

                        response_bytes = json.dumps(response_data).encode()
                        conn.sendall(response_bytes)
                        log_with_timestamp(f"[SEND] To {addr}: {response_data}")
            except socket.timeout:
                continue
            except Exception as e:
                if running:
                    log_with_timestamp(f"[ERROR] Server loop error: {e}")
        
    log_with_timestamp("[ATAT] Server has shut down.")

if __name__ == "__main__":
    run_server()

