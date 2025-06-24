from utils import config
from utils.db import DatabaseManager
from input.api_importer import APIImporter
from core.vulnerability_scanner import VulnerabilityScanner
from core.report_generator import ReportGenerator
from utils.query import success, bad_request, not_found, server_error
import socket
import json


HOST = '127.0.0.1'
PORT = 9000

scan_manager = ScanManager()
result_manager = ResultManager()
CLIENT_STORE = {}

# === handle_request ===
#turning this into a map might be more efficient hmmmmm
def handle_request(request: dict):
    command = request.get("command")

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


# === Implemented ===
def import_file(request):
    spec_path = request.get("file_path")
    if not spec_path:
        return bad_request("file_path is required")

    try:
        with open(spec_path, 'r') as f:
            content = f.read()
        api_client = APIImporter.import_openAPI(content)
        client_id = str(id(api_client))
        CLIENT_STORE[client_id] = api_client
        return success({"client_id": client_id})
    except Exception as e:
        return server_error(str(e))

def create_scan(request):
    client_id = request.get("client_id")
    profile = request.get("scan_profile", "default")
    client = CLIENT_STORE.get(client_id)

    if not client:
        return not_found(f"No APIClient found for ID {client_id}")

    try:
        scanner = scan_manager.create_scanner(client, profile)
        results = scanner.run_tests()
        result_manager.store_results(profile, results)
        return success({"results_count": len(results)})
    except Exception as e:
        return server_error(str(e))

# === Skeletons ===
# Move skeletons to implemented once done


# === Auth ===
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
def get_all_apis(request): 
    return server_error("Not yet implemented")

def create_api(request): 
    return server_error("Not yet implemented")

def get_api_details(request): 
    return server_error("Not yet implemented")

def update_api(request): 
    return server_error("Not yet implemented")

def delete_api(request): 
    return server_error("Not yet implemented")

def import_url(request): 
    return server_error("Not yet implemented")

# === API endpoints ===
def get_api_endpoints(request): 
    return server_error("Not yet implemented")

def get_endpoint_details(request): 
    return server_error("Not yet implemented")

def add_tags(request): 
    return server_error("Not yet implemented")

def remove_tags(request): 
    return server_error("Not yet implemented")

def replace_tags(request): 
    return server_error("Not yet implemented")

def get_all_tags(request): 
    return server_error("Not yet implemented")

# === Scans ===
def get_scan_results(request): 
    return server_error("Not yet implemented")

def start_scan(request): 
    return server_error("Not yet implemented")

def stop_scan(request): 
    return server_error("Not yet implemented")

def get_all_scans(request): 
    return server_error("Not yet implemented")

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
