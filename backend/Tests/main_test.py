import unittest
from unittest.mock import patch, Mock
from main import handle_request, import_file, get_all_apis, create_scan
from utils.query import HTTPCode

class TestHandleRequest(unittest.TestCase):
    def test_handle_request_unknown_command(self):
        request = {"command": "unknown.command"}
        response = handle_request(request)
        self.assertEqual(response["code"], HTTPCode.BAD_REQUEST.value)
        self.assertIn("Unknown command", str(response))

class TestImportFile(unittest.TestCase):
    def test_import_file_missing_file(self):
        request = {"data": {}}
        response = import_file(request)
        self.assertEqual(response["code"], HTTPCode.BAD_REQUEST.value)
        self.assertIn("Missing 'file' field", str(response))

    def test_import_file_success(self):
        request = {"data": {"file": "example.yaml", "user_id": "123"}}
        with patch('main.APIImporter') as mock_api_importer:
            mock_api_importer.return_value.import_openapi.return_value = Mock()
            mock_api_importer.return_value.import_openapi.return_value.save_to_db.return_value = True
            response = import_file(request)
            self.assertEqual(response["code"], HTTPCode.SUCCESS.value)

class TestCreateScan(unittest.TestCase):
    def test_create_scan_no_client_id(self):
        request = {}
        response = create_scan(request)
        self.assertEqual(response["code"], HTTPCode.BAD_REQUEST.value)
        self.assertIn("Missing 'user_id' or 'api_id'", str(response))

    def test_create_scan_success(self):
        request = {"data": {"user_id": "123", "api_id": "456"}}
        with patch('main._get_or_create_scan_manager') as mock_get_or_create_scan_manager:
            mock_get_or_create_scan_manager.return_value = Mock()
            response = create_scan(request)
            self.assertEqual(response["code"], HTTPCode.SUCCESS.value)

if __name__ == "__main__":
    unittest.main()