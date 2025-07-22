#venv/bin/python -m tests.temp-tests  
import os

print("start test")
print("==========================\nVuln Testing\n==========================")
print("Custom Server Load")

from input.api_importer import APIImporter
from core.api_client import APIClient
from core.vulnerability_test import VulnerabilityTest, BOLA_Scan, OWASP_FLAGS
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


bola_scanner = BOLA_Scan()
print(bola_scanner.name.value)

print("set flags")
bola_scanner._set_flag(api_client)

print("\nEndpoints with the BOLA flag:")
for endpoint in api_client.endpoints:
    for flag in endpoint.flags:
        if flag == OWASP_FLAGS.BOLA:
            print(endpoint.path)

# print("Test identified endpoints for BOLA")
# result = bola_scanner.run_test(api_client)
# print(result.to_json())

# ==============================================================================
print("Scan Management Testing")
scan_manager = ScanManager(api_client)
scan_manager.createScan(ScanProfiles.DEFAULT)
scan_id = scan_manager.runScan(ScanProfiles.DEFAULT)

#run 10x
# for i in range(10):
#     scan_manager.runScan(ScanProfiles.DEFAULT)

print(f"Scan complete with id: {scan_id}")
print("All scans:")
for scanID in scan_manager.get_all_scans():
    print(f"Scan id: {scanID}")
    scans = scan_manager.get_scan(scanID)
    for scan in scans:
        print(f"\tEndpoint Details:")
        print(f"\t\tEndpoint: {scan.endpoint.path}")
        print(f"\t\tCategory: {scan.owasp_category}")
        print(f"\t\tDescription: {scan.description}")

