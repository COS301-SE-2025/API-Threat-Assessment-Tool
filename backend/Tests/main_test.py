
import unittest
from unittest.mock import patch, Mock
from main import handle_request, import_file, get_all_apis, create_scan

class TestHandleRequest(unittest.TestCase):
    def test_handle_request_unknown_command(self):
        request = {"command": "unknown.command"}
        response = handle_request(request)
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["message"], "Unknown command 'unknown.command'")

    def test_handle_request_import_file(self):
        request = {"command": "apis.import_file", "data": {"file": "example.yaml"}}
        with patch("your_module.import_file") as mock_import_file:
            mock_import_file.return_value = {"status": "success"}
            response = handle_request(request)
            self.assertEqual(response["status"], "success")

class TestImportFile(unittest.TestCase):
    def test_import_file_missing_file(self):
        request = {"data": {}}
        response = import_file(request)
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["message"], "Missing 'file' field in request data")

    def test_import_file_success(self):
        request = {"data": {"file": "example.yaml"}}
        with patch("your_module.APIImporter") as mock_api_importer:
            mock_api_importer.return_value.import_openapi.return_value = Mock()
            response = import_file(request)
            self.assertEqual(response["status"], "success")

class TestGetAllApis(unittest.TestCase):
    def test_get_all_apis_no_apis(self):
        response = get_all_apis({})
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["message"], "No API has been imported yet.")

    def test_get_all_apis_success(self):
        with patch("your_module.GLOBAL_API_CLIENT") as mock_global_api_client:
            mock_global_api_client.title = "Example API"
            mock_global_api_client.version = "1.0"
            response = get_all_apis({})
            self.assertEqual(response["status"], "success")
            self.assertEqual(response["data"]["apis"][0]["title"], "Example API")

class TestCreateScan(unittest.TestCase):
    def test_create_scan_no_client_id(self):
        request = {}
        response = create_scan(request)
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["message"], "No APIClient found for ID None")

    def test_create_scan_success(self):
        request = {"client_id": "example_client_id"}
        with patch("your_module.scan_manager") as mock_scan_manager:
            mock_scan_manager.create_scanner.return_value.run_tests.return_value = []
            response = create_scan(request)
            self.assertEqual(response["status"], "success")

if __name__ == "__main__":
    unittest.main()
