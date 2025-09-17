from utils import config
from utils.db import DatabaseManager
from input.api_importer import APIImporter
from core.vulnerability_scanner import VulnerabilityScanner
from core.vulnerability_test import OWASP_FLAGS
from core.report_generator import ReportGenerator
from core.scan_manager import ScanManager, ScanProfiles
from core.result_manager import ResultManager
from utils.query import success, bad_request, not_found, server_error, connection_test, response, HTTPCode
from typing import Dict, Any, List
from datetime import datetime

import socket
import json
import os
import signal
import sys


HOST = '127.0.0.1'
PORT = 9011

scan_manager = ""
result_manager = ""
USER_STORE = {}
# USER_STORE[user_id][api_id] = API Client object
# USER_STORE[user_id][scan_id] = Scan manager object'


# === Dashboard ===
def dashboard_overview(request): 
    return server_error("Not yet implemented")

def dashboard_metrics(request): 
    return server_error("Not yet implemented")

def dashboard_alerts(request): 
    return server_error("Not yet implemented")

def import_file(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    file_name = request.get("data", {}).get("file")
    if not file_name:
        return bad_request("Missing 'file' field in request data")

    try:
        file_path = f"Files/{file_name}"
        with open(file_path, 'r') as f:
            content = f.read()

        importer = APIImporter()
        print("Importing new openAPI file")
        api_client = importer.import_openapi(file_path)

        client_id = str(id(api_client))
        
        if user_id not in USER_STORE:
            USER_STORE[user_id] = {"apis": {}, "scans": {}}
        
        USER_STORE[user_id]["apis"][client_id] = api_client

        return response(HTTPCode.SUCCESS, {"client_id": client_id})
    except Exception as e:
        return server_error(str(e))



def get_all_apis(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    if user_id not in USER_STORE or not USER_STORE[user_id]["apis"]:
        return not_found("No APIs found for user.")

    apis = []
    for client_id, api_client in USER_STORE[user_id]["apis"].items():
        apis.append({
            "client_id": client_id,
            "title": api_client.title,
            "version": api_client.version
        })

    return response(HTTPCode.SUCCESS, {"apis": apis})


def create_api(request): 
    return server_error("Not yet implemented")

def get_api_details(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    return response(HTTPCode.SUCCESS, {
        "title": client.title,
        "version": client.version,
        "base_url": client.base_url,
        "num_endpoints": len(client.endpoints)
    })

def update_api(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    updates = request.get("data", {}).get("updates", {})

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    for key in ["title", "version", "base_url"]:
        if key in updates:
            setattr(client, key, updates[key])

    return success({ "message": "API metadata updated." }) 


def delete_api(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API not found.")

    USER_STORE[user_id]["apis"].pop(client_id)
    return success({ "message": "API deleted." })


def import_url(request): 
    return server_error("Not yet implemented")

# === API endpoints ===
def get_api_endpoints(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API not found.")

    client = USER_STORE[user_id]["apis"][client_id]

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
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    endpoint_id = request.get("data", {}).get("id")
    if not endpoint_id:
        return bad_request("Missing 'id'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

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
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'tags'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = list(set(ep.tags + tags))
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")



def remove_tags(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'tags'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = [t for t in ep.tags if t not in tags]
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")



def replace_tags(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or tags is None:
        return bad_request("Missing 'path', 'method', or 'tags'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    for ep in client.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = tags
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")


def get_all_tags(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    all_tags = set()
    for ep in client.endpoints:
        all_tags.update(ep.tags)

    return response(HTTPCode.SUCCESS, {"tags": list(all_tags)})


#===================================
# flags

def add_flags(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    data = request.get("data", {})
    endpoint_id = data.get("endpoint_id")
    flag_str = data.get("flags")

    if not endpoint_id or not flag_str:
        return bad_request("Missing 'endpoint_id' or 'flags'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    try:
        flag_enum = OWASP_FLAGS[flag_str]
    except KeyError:
        valid_flags = [f.name for f in OWASP_FLAGS]
        return bad_request(f"Invalid flag: {flag_str}. Valid flags: {', '.join(valid_flags)}")

    for ep in client.endpoints:
        if ep.id == endpoint_id:
            ep.add_flag(flag_enum)
            
            return response(HTTPCode.SUCCESS, {
                "flags": [f.name for f in ep.flags]
            })

    return not_found("Endpoint not found")

def remove_flags(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    data = request.get("data", {})
    endpoint_id = data.get("endpoint_id")
    flag_str = data.get("flags")

    if not endpoint_id or not flag_str:
        return bad_request("Missing 'endpoint_id' or 'flags'")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    try:
        flag_enum = OWASP_FLAGS[flag_str]
    except KeyError:
        valid_flags = [f.name for f in OWASP_FLAGS]
        return bad_request(
            f"Invalid flag: '{flag_str}'. Valid flags are: {', '.join(valid_flags)}"
        )

    for ep in client.endpoints:
        if ep.id == endpoint_id:
            if flag_enum in ep.flags:
                ep.remove_flag(flag_enum)
                return response(HTTPCode.SUCCESS, {
                    "flags": [f.name for f in ep.flags],
                    "message": f"Flag '{flag_str}' removed successfully"
                })
            else:
                return response(HTTPCode.BAD_REQUEST, {
                    "flags": [f.name for f in ep.flags],
                    "error": f"Flag '{flag_str}' not set on endpoint"
                })

    return not_found(f"Endpoint with ID '{endpoint_id}' not found")


# === Scans ===
def create_scan(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    scan_profile = request.get("scan_profile", "OWASP_API_10")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]

    try:
        if user_id not in USER_STORE:
            USER_STORE[user_id] = {"apis": {}, "scans": {}}
        
        scan_manager = ScanManager(client)
        USER_STORE[user_id]["scans"][client_id] = scan_manager
        scan_manager.createScan(scan_profile)
        return response(HTTPCode.SUCCESS, {"message": "Success"})
    except Exception as e:
        return server_error(str(e))

def start_scan(request): 
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    scan_profile = request.get("data", {}).get("scan_profile", "OWASP_API_10")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["scans"]:
        return not_found("Scan manager not found for API.")

    scan_manager = USER_STORE[user_id]["scans"][client_id]

    try:
        scan_id = scan_manager.runScan(ScanProfiles.DEFAULT)
        return success({"scan_id": scan_id})
    except Exception as e:
        return server_error(str(e))

def scan_progress(request):
    scan_id = request.get("scan_id")

    if not scan_id:
        return not_found(f"{scan_id} not found")

    return success({"scan_id": scan_id, "endpoints_remaining": 0})
    

def stop_scan(request): 
    scan_id= request.get("scan_id")

    if not scan_id:
        return not_found(f"{scan_id} not found")

    return success({f"{scan_id} stopped"})

def get_scan_results(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    scan_id = request.get("data", {}).get("scan_id")
    if not scan_id:
        return not_found(f"{scan_id} missing")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["scans"]:
        return not_found("Scan manager not found for API.")

    scan_manager = USER_STORE[user_id]["scans"][client_id]

    try:
        scans = scan_manager.get_scan(scan_id)

        if not scans:
            return not_found(f"{scan_id} not found")

        scan_results = []
        for scan_group in scans:
            for scan in scan_group:
                scan_results.append({
                    "endpoint_id": scan.endpoint.id,
                    "vulnerability_name": scan.vulnerability_name,
                    "severity": scan.severity,
                    "cvss_score": float(scan.cvss_score),
                    "description": scan.description,
                    "recommendation": scan.recommendation,
                    "evidence": scan.evidence,
                    "test_name": scan.test_name,
                    "affected_params": scan.affected_params,
                    "timestamp": (
                        scan.timestamp.isoformat()
                        if isinstance(scan.timestamp, datetime)
                        else str(scan.timestamp)
                    ),
                })

        return success({"result": scan_results})

    except Exception as e:
        return server_error(str(e))

def get_all_scans(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    if user_id not in USER_STORE:
        return not_found("No scans found")

    result_map = {}

    for client_id, scan_manager in USER_STORE[user_id]["scans"].items():
        all_scans = scan_manager.get_all_scans()
        if not all_scans:
            continue

        scan_results = []
        for scan_id, scan_groups in all_scans.items():
            for scan_group in scan_groups:
                for scan in scan_group:
                    try:
                        scan_results.append({
                            "endpoint_id": scan.endpoint.id,
                            "vulnerability_name": scan.vulnerability_name,
                            "severity": scan.severity,
                            "cvss_score": float(scan.cvss_score),
                            "description": scan.description,
                            "recommendation": scan.recommendation,
                            "evidence": scan.evidence,
                            "test_name": scan.test_name,
                            "affected_params": scan.affected_params,
                            "timestamp": (
                                scan.timestamp.isoformat()
                                if hasattr(scan.timestamp, 'isoformat')
                                else str(scan.timestamp)
                            ),
                        })
                    except AttributeError as e:
                        print(f"Skipping malformed scan entry: {e}")
                        continue

        if scan_results:
            result_map[client_id] = scan_results

    if not result_map:
        return not_found("No valid scan results found")

    return success({"result": result_map})

def set_api_key(request):
    user_id = request.get("user_id")
    if not user_id:
        return bad_request("Missing 'user_id' field")

    client_id = request.get("data", {}).get("client_id")
    if not client_id:
        return bad_request("Missing 'client_id' field")

    apiKey = request.get("api_key")

    if user_id not in USER_STORE or client_id not in USER_STORE[user_id]["apis"]:
        return not_found("API client not found.")

    client = USER_STORE[user_id]["apis"][client_id]
    client.set_auth_token(apiKey)
    return response(HTTPCode.SUCCESS, {"message": "api key set"})


# === Repots ===
def get_all_reports(request): 
    return server_error("Not yet implemented")

def get_report_details(request): 
    return server_error("Not yet implemented")

# === Templates ===
def get_all_templates(request): 
    return server_error("Not yet implemented")

def get_template_details(request): 
    return server_error("Not yet implemented")

def use_template(request): 
    return server_error("Not yet implemented")

# === User Profile ===
def get_profile(request): 
    return server_error("Not yet implemented")

def update_profile(request): 
    return server_error("Not yet implemented")

def get_settings(request): 
    return server_error("Not yet implemented")

def update_settings(request): 
    return server_error("Not yet implemented")


# === handle_request ===
#turning this into a map might be more efficient hmmmmm
def handle_request(request: dict):
    command = request.get("command")

    if command == "connection.test":
        response = connection_test()
        return response

    if command == "auth.register":
        response = auth_register(request)
        return response

    if command == "auth.login":
        response = auth_login(request)
        return response

    elif command == "auth.google":
        response = auth_google(request)
        return response

    elif command == "auth.logout":
        response = auth_logout(request)
        return response

    elif command == "dashboard.overview":
        response = dashboard_overview(request)
        return response

    elif command == "dashboard.metrics":
        response = dashboard_metrics(request)
        return response

    elif command == "dashboard.alerts":
        response = dashboard_alerts(request)
        return response

    elif command == "apis.get_all":
        response = get_all_apis(request)
        return response

    elif command == "apis.create":
        response = create_api(request)
        return response

    elif command == "apis.details":
        response = get_api_details(request)
        return response

    elif command == "apis.update":
        response = update_api(request)
        return response

    elif command == "apis.delete":
        response = delete_api(request)
        return response

    elif command == "apis.import_file":
        response = import_file(request)
        return response

    elif command == "apis.import_url":
        response = import_url(request)
        return response

    elif command == "endpoints.list":
        response = get_api_endpoints(request)
        return response

    elif command == "endpoints.details":
        response = get_endpoint_details(request)
        return response

    elif command == "endpoints.tags.add":
        response = add_tags(request)
        return response

    elif command == "endpoints.tags.remove":
        response = remove_tags(request)
        return response

    elif command == "endpoints.tags.replace":
        response = replace_tags(request)
        return response

    elif command == "tags.list":
        response = get_all_tags(request)
        return response

    elif command == "endpoints.flags.add":
        response = add_flags(request)
        return response

    elif command == "endpoints.flags.remove":
        response = remove_flags(request)
        return response 

    elif command == "scan.create":
        response = create_scan(request)
        return response

    elif command == "scan.results":
        response = get_scan_results(request)
        return response

    elif command == "scan.start":
        response = start_scan(request)
        return response

    elif command == "scan.stop":
        response = stop_scan(request)
        return response

    elif command == "scan.list":
        response = get_all_scans(request)
        return response

    elif command == "templates.list":
        response = get_all_templates(request)
        return response

    elif command == "templates.details":
        response = get_template_details(request)
        return response

    elif command == "templates.use":
        response = use_template(request)
        return response

    elif command == "user.profile.get":
        response = get_profile(request)
        return response

    elif command == "user.profile.update":
        response = update_profile(request)
        return response

    elif command == "user.settings.get":
        response = get_settings(request)
        return response

    elif command == "user.settings.update":
        response = update_settings(request)
        return response

    elif command == "reports.list":
        response = get_all_reports(request)
        return response

    elif command == "reports.details":
        response = get_report_details(request)
        return response

    elif command == "reports.download":
        response = download_report(request)
        return response

    elif command == "apis.key.set":
        response = set_api_key(request)
        return response

    else:
        return bad_request(f"Unknown command '{command}'")

def run_server():
    print(f"[ATAT] Listening on {HOST}:{PORT}")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen(5)
        
        running = True
        
        def signal_handler(sig, frame):
            nonlocal running
            print("\n[ATAT] Shutting down server gracefully...")
            running = False
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as dummy:
                    dummy.connect((HOST, PORT))
            except:
                pass
        
        signal.signal(signal.SIGINT, signal_handler)
        
        while running:
            try:
                s.settimeout(1)
                conn, addr = s.accept()
                print(f"Connection from: {addr}")
                s.settimeout(None)
                with conn:
                    print("New connection")
                    data = b""
                    
                    # Remove timeout for client socket
                    # conn.settimeout(None)
                    
                    while True:
                        chunk = conn.recv(4096)
                        print(f'Received {len(chunk)} bytes')
                        if not chunk:
                            break
                        data += chunk
                        
                        try:
                            # Attempt to parse JSON
                            request = json.loads(data.decode())
                            print(f"[RECV] {request}")
                            
                            # Process request
                            response = handle_request(request)
                            response_bytes = json.dumps(response).encode()
                            conn.sendall(response_bytes)
                            print(f"[SEND] {response}")
                            break
                            
                        except json.JSONDecodeError:
                            # Incomplete JSON - continue reading
                            print("Incomplete JSON, waiting for more data")
                            continue
                        except Exception as e:
                            print(f"Error processing request: {e}")
                            response = server_error(str(e))
                            response_bytes = json.dumps(response).encode()
                            conn.sendall(response_bytes)
                            break
            except socket.timeout:
                continue
            except OSError as e:
                if running:
                    print(f"[ERROR] {e}")
                break
            except Exception as e:
                if running:
                    print(f"[UNEXPECTED ERROR] {e}")
    
    print("[ATAT] Server has shut down")


if __name__ == "__main__":
    run_server()