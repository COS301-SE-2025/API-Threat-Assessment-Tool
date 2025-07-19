from utils import config
from utils.db import DatabaseManager
from input.api_importer import APIImporter
from core.vulnerability_scanner import VulnerabilityScanner
from core.report_generator import ReportGenerator
from core.scan_manager import ScanManager
from core.result_manager import ResultManager
from utils.query import success, bad_request, not_found, server_error, connection_test, response, HTTPCode
from typing import Dict, Any, List

import socket
import json
import os


HOST = '127.0.0.1'
PORT = 9011

scan_manager = ""
result_manager = ""
CLIENT_STORE = {}
API_METADATA = {}

# temporary
# All connected users will share access to the same api that was loaded
GLOBAL_API_CLIENT = None  
GLOBAL_CLIENT_ID = None
GLOBAL_SCAN_MANAGER = None



# === Auth ===
def auth_register(request): 
    return server_error("Not yet implemented")

def auth_login(request): 
    return server_error("Not yet implemented")

def auth_google(request): 
    return server_error("Not yet implemented")

def auth_logout(request): 
    return server_error("Not yet implemented")

# === Dashboard ===
def dashboard_overview(request): 
    return server_error("Not yet implemented")

def dashboard_metrics(request): 
    return server_error("Not yet implemented")

def dashboard_alerts(request): 
    return server_error("Not yet implemented")

# === User Api's ===
CLIENT_STORE = {}
GLOBAL_API_CLIENT = None
GLOBAL_CLIENT_ID = None

API_METADATA = {} 

def import_file(request):
    global GLOBAL_API_CLIENT, GLOBAL_CLIENT_ID

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
        CLIENT_STORE[client_id] = api_client
        API_METADATA[client_id] = {
            "title": api_client.title,
            "version": api_client.version,
            "base_url": api_client.base_url
        }

        GLOBAL_API_CLIENT = api_client
        GLOBAL_CLIENT_ID = client_id
        GLOBAL_SCAN_MANAGER = ScanManager(api_client)

        return response(HTTPCode.SUCCESS, {"client_id": client_id})
    except Exception as e:
        return server_error(str(e))



def get_all_apis(request):
    global GLOBAL_API_CLIENT, GLOBAL_CLIENT_ID

    if not GLOBAL_API_CLIENT:
        return not_found("No API has been imported yet.")

    return response(HTTPCode.SUCCESS, {
        "apis": [{
            "client_id": GLOBAL_CLIENT_ID,
            "title": GLOBAL_API_CLIENT.title,
            "version": GLOBAL_API_CLIENT.version
        }]
    })


def create_api(request): 
    return server_error("Not yet implemented")

def get_all_apis(request):
    global GLOBAL_API_CLIENT, GLOBAL_CLIENT_ID

    if not GLOBAL_API_CLIENT:
        return not_found("No API has been imported yet.")

    return response(HTTPCode.SUCCESS, {
        "apis": [{
            "client_id": GLOBAL_CLIENT_ID,
            "title": GLOBAL_API_CLIENT.title,
            "version": GLOBAL_API_CLIENT.version
        }]
    })

def get_api_details(request):
    global GLOBAL_API_CLIENT, GLOBAL_CLIENT_ID

    client_id = request.get("data", {}).get("client_id")
    client = CLIENT_STORE.get(client_id) if client_id else GLOBAL_API_CLIENT

    if not client:
        return not_found("API client not found.")

    return response(HTTPCode.SUCCESS, {
        "title": client.title,
        "version": client.version,
        "base_url": client.base_url,
        "num_endpoints": len(client.endpoints)
    })

def update_api(request):
    client_id = request.get("data", {}).get("client_id")
    updates = request.get("data", {}).get("updates", {})

    meta = API_METADATA.get(client_id)
    client = CLIENT_STORE.get(client_id)
    if not meta or not client:
        return not_found("API client not found.")

    for key in ["title", "version", "base_url"]:
        if key in updates:
            meta[key] = updates[key]
            setattr(client, key, updates[key])

    return success({ "message": "API metadata updated." }) 


def delete_api(request):
    client_id = request.get("data", {}).get("client_id")

    if client_id not in CLIENT_STORE:
        return not_found("API not found.")

    CLIENT_STORE.pop(client_id)
    API_METADATA.pop(client_id, None)

    # Optional cleanup
    global GLOBAL_CLIENT_ID, GLOBAL_API_CLIENT
    if client_id == GLOBAL_CLIENT_ID:
        GLOBAL_CLIENT_ID = None
        GLOBAL_API_CLIENT = None

    return success({ "message": "API deleted." })  #Fix: return data


def import_url(request): 
    return server_error("Not yet implemented")

# === API endpoints ===
def get_api_endpoints(request):
    global GLOBAL_API_CLIENT

    client_id = request.get("data", {}).get("client_id")
    client = CLIENT_STORE.get(client_id) if client_id else GLOBAL_API_CLIENT

    if not client:
        return not_found("API not found.")

    endpoints = [{
        "id": ep.id,
        "path": ep.path,
        "method": ep.method,
        "summary": ep.summary,
        "tags": ep.tags
    } for ep in client.endpoints]

    return response(HTTPCode.SUCCESS, {"endpoints": endpoints})



def get_endpoint_details(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")

    if not path or not method:
        return bad_request("Missing 'path' or 'method'")

    endpoint_id = request.get("data", {}).get("id")
    if not endpoint_id:
        return bad_request("Missing 'id'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.id == endpoint_id:
            return response(HTTPCode.SUCCESS, {
                "id": ep.id,
                "path": ep.path,
                "method": ep.method,
                "summary": ep.summary,
                "description": ep.description,
                "tags": ep.tags
            })

    return not_found("Endpoint not found")



def add_tags(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'tags'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = list(set(ep.tags + tags))
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")



def remove_tags(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'tags'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = [t for t in ep.tags if t not in tags]
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")



def replace_tags(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    tags = request.get("data", {}).get("tags")

    if not path or not method or tags is None:
        return bad_request("Missing 'path', 'method', or 'tags'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.path == path and ep.method == method:
            ep.tags = tags
            return response(HTTPCode.SUCCESS, {"tags": ep.tags})

    return not_found("Endpoint not found")


def get_all_tags(request):
    global GLOBAL_API_CLIENT

    if not GLOBAL_API_CLIENT:
        return not_found("No API has been imported yet.")

    all_tags = set()
    for ep in GLOBAL_API_CLIENT.endpoints:
        all_tags.update(ep.tags)

    return response(HTTPCode.SUCCESS, {"tags": list(all_tags)})

def add_flags(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    flag = request.get("data", {}).get("flag")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'flags'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.path == path and ep.method == method:
            ep.add_flag(flag)
            return response(HTTPCode.SUCCESS, {"flags": ep.flags})

    return not_found("Endpoint not found")

def remove_flags(request):
    global GLOBAL_API_CLIENT

    path = request.get("data", {}).get("path")
    method = request.get("data", {}).get("method")
    flag = request.get("data", {}).get("flag")

    if not path or not method or not tags:
        return bad_request("Missing 'path', 'method', or 'flags'")

    for ep in GLOBAL_API_CLIENT.endpoints:
        if ep.path == path and ep.method == method:
            ep.remove_flag(flag)
            return response(HTTPCode.SUCCESS, {"flags": ep.flags})

    return not_found("Endpoint not found")

# === Scans ===
def create_scan(request):
    client_id = request.get("client_id")
    scan_profile = request.get("scan_profile", "OWASP_API_10")
    # client = CLIENT_STORE.get(client_id)
    client = GLOBAL_CLIENT_ID # temp

    if not client:
        return not_found(f"{client_id} not found")

    try:
        scanner = GLOBAL_SCAN_MANAGER.createScan(scan_profile)
        return success({"New Scan create"})
    except Exception as e:
        return server_error(str(e))

def start_scan(request): 
    api_name= request.get("api_name")
    scan_profile = request.get("scan_profile", "OWASP_API_10")

    if not api_name:
        return not_found(f"{api_name} not found")

    try:
        scan_id = GLOBAL_SCAN_MANAGER.runScan(scan_profile)
        return success({"scan_id": scan_id})
    except Exception as e:
        return server_error(str(e))

def scan_progress(request):
    scan_id= request.get("scan_id")

    if not scan_id:
        return not_found(f"{scan_id} not found")

    return success({"scan_id": scan_id, "endpoints_remaining": 0})
    

def stop_scan(request): 
    scan_id= request.get("scan_id")

    if not scan_id:
        return not_found(f"{scan_id} not found")

    return success({f"{scan_id} stopped"})

def get_scan_result(request):
    scan_id= request.get("scan_id")

    if not scan_id:
        return not_found(f"{scan_id} missing")

    try:
        scans = GLOBAL_SCAN_MANAGER.get_scan(scan_id)

        if not scans:
            return not_found(f"{scan_id} not found")

        scan_results = [{
        "endpoint_id": scan.endpoint.id,
        "vulnerability_name": scan.vulnerability_name,
        "severity": scan.severity,
        "cvss_score": float(scan.cvss_score),
        "description": scan.description,
        "recommendation": scan.recommendation,
        "evidence": scan.evidence,
        "test_name": scan.test_name,
        "affected_params": scan.affected_params,
        "timestamp": scan.timestamp,
        } for scan in scans]
        

        return success({"result": scan_results})

    except Exception as e:
        return server_error(str(e))

def get_all_scans(request):
    scan_id = request.get("scan_id")

    if not scan_id:
        return not_found("scan_id missing")

    try:
        all_scans = GLOBAL_SCAN_MANAGER.get_all_scans()

        if not all_scans:
            return not_found("no scans found")

        result_map = {}

        for sid, scans in all_scans.items():
            if not scans:
                continue

            scan_results = []
            for scan in scans:
                scan_results.append({
                    "endpoint_id":        scan.endpoint.id,
                    "vulnerability_name": scan.vulnerability_name,
                    "severity":           scan.severity,
                    "cvss_score":         float(scan.cvss_score),
                    "description":        scan.description,
                    "recommendation":     scan.recommendation,
                    "evidence":           scan.evidence,
                    "test_name":          scan.test_name,
                    "affected_params":    scan.affected_params,
                    "timestamp": (
                        scan.timestamp.isoformat()
                        if isinstance(scan.timestamp, datetime)
                        else str(scan.timestamp)
                    ),
                })

            result_map[sid] = scan_results

        if not result_map:
            return not_found("no populated scan results")

        return success({"result": result_map})

    except Exception as exc:
        return server_error(str(exc))

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
        response = add_tags(request)
        return response

    elif command == "endpoints.flags.remove":
        response = remove_tags(request)

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

    elif command == "connection.test":
        response = connection_test()
        return response

    else:
        return bad_request(f"Unknown command '{command}'")

def run_server():
    print(f"[ATAT] Listening on {HOST}:{PORT}")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen()
        while True:
            conn, addr = s.accept()
            with conn:
                print("New connection")
                data = b""
                while True:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    data += chunk

                try:
                    request = json.loads(data.decode())
                    print(f"[RECV] {request}")
                    response = handle_request(request)
                except json.JSONDecodeError:
                    response = bad_request("Invalid JSON")
                except Exception as e:
                    response = server_error(str(e))

                response_bytes = json.dumps(response).encode()
                conn.sendall(response_bytes)
                print(f"[SEND] {response}")

if __name__ == "__main__":
    run_server()


