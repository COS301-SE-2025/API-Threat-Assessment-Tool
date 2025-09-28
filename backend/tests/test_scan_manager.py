#cd backend
#venv/bin/python -m tests.test_scan_manager
import os

print("start test")
print("==========================\nVuln Testing\n==========================")
print("Custom Server Load")

from input.api_importer import APIImporter
from core.api_client import APIClient
from core.vulnerability_test import VulnerabilityTest, BOLA_Scan, BKEN_AUTH_Scan, BOPLA_Scan, URC_Scan, BFLA_Scan, UABF_Scan, SSRF_Scan, SEC_MISC_Scan, IIM_Scan, UCAPI_Scan, OWASP_FLAGS
from core.scan_manager import ScanManager, ScanProfiles

JWT = "weak_secret_123"

print("Import file")
path = os.path.join(os.path.dirname(__file__), "Files", "custom_server.json")
importer = APIImporter()
api_client = importer.import_openapi(path)
api_client.set_auth_token(JWT)

print("Test Auth Header")
print("Auth: ", api_client.authorization)
print("Auth Template:\n\t", api_client.authorization.value)
print("Auth Test:\n\t", api_client.get_auth_header())

print("Test Endpoint Imports")
for endpoint in api_client.endpoints:
    print("Path: ", endpoint.path)
    print("Auth Needed:\n\t", endpoint.check_auth())
    print("Description: ", endpoint.description)
    print("Method: ", endpoint.method)
    print("Params: ", endpoint.parameters)
    print("Req Body: ", endpoint.request_body)
    print("Resp: ", endpoint.responses)
    print("Tags: ", endpoint.tags)
    print("Flags: ", endpoint.flags)
    break

print("Get endpoints with auth all auth")
for endpoint in api_client.endpoints:
    if endpoint.check_auth():
        print("Path: ", endpoint.path)



print("=====================================================================")
print("==========================\nBOLA Testing\n==========================")
print("=====================================================================")

bola_scanner = BOLA_Scan()
print(bola_scanner.name.value)
print("setting flags")
bola_scanner._set_flag(api_client)

print("\nEndpoints with the BOLA flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.BOLA:
            print(endpoint.path)

print("=====================================================================")
print("==========================\nBOPLA Testing\n==========================")
print("=====================================================================")

bola_scanner = BOPLA_Scan()
print(bola_scanner.name.value)
print("setting flags")
bola_scanner._set_flag(api_client)

print("\nEndpoints with the BOPLA flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.BOPLA:
            print(endpoint.path)

print("=====================================================================")
print("==========================\nBFLA Testing\n==========================")
print("=====================================================================")

bfla_scanner = BFLA_Scan()
print(bfla_scanner.name.value)
print("setting flags")
bfla_scanner._set_flag(api_client)

print("\nEndpoints with the BFLA flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.BFLA:
            print(endpoint.path)

print("=====================================================================")
print("==========================\nSSRF Testing\n==========================")
print("=====================================================================")

ssrf_scanner = SSRF_Scan()
print(ssrf_scanner.name.value)
print("setting flags")
ssrf_scanner._set_flag(api_client)

print("\nEndpoints with the SSRF flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.SSRF:
            print(endpoint.path)

print("=====================================================================")
print("==========================\nIIM Testing\n==========================")
print("=====================================================================")

iim_scanner = IIM_Scan()
print(iim_scanner.name.value)
print("setting flags")
iim_scanner._set_flag(api_client)

print("\nEndpoints with the IIM flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.IIM:
            print(endpoint.path)

# ==============================================================================
# print("=====================================================================")
# print("==========================\nScan Testing\n==========================")
# print("=====================================================================")

# run_scans = True

# if(run_scans):
#     scan_manager = ScanManager(api_client)
#     scan_id = scan_manager.run_scan(api_id, user_id)

#     print(f"Scan complete with id: {scan_id}")
#     print("All scans:")
#     for scanID in scan_manager.get_all_scans():
#         print(f"Scan id: {scanID}")
#         scans = scan_manager.get_scan(scanID)
#         for scan in scans:
#             for scan_endpoint in scan:
#                 print(f"\tEndpoint Details:")
#                 print(f"\t\tEndpoint: {scan_endpoint.endpoint.path}")
#                 print(f"\t\tOWASP Category: {scan_endpoint.owasp_category}")
#                 print(f"\t\tDescription: {scan_endpoint.description}")
                # print(f"Evidence: \n------------------------------\n{scan_endpoint.evidence}\n------------------------------\n")

# ==============================================================================



print("=====================================================================")
print("==========================\nScan Testing\n==========================")
print("=====================================================================")
run_scans = True
if run_scans:
    scan_manager = ScanManager(api_client)
    api_id = "39e81211ec884ffcb0f4e9d476c8a01e"
    user_id = "818275c2-c7cc-4ea2-97f3-427f3ef5b591"
    scan_id = scan_manager.run_scan(api_id, user_id)
    print(f"Scan complete with id: {scan_id}")
    print("All scans:")
    scans = scan_manager.get_all_api_scans(api_id)
    for scan in scans:
        print(f"Scan id: {scan['id']}")
        scan_details = scan_manager.get_scan_details(scan['id'])
        for result in scan_details['results']:
            print(f"\tEndpoint Details:")
            print(f"\t\tEndpoint: {result.get('endpoint', 'N/A')}")
            print(f"\t\tOWASP Category: {result.get('owasp_category', 'N/A')}")
            print(f"\t\tDescription: {result.get('description', 'N/A')}")
