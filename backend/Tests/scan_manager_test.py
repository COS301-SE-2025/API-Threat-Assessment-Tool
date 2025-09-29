import unittest
from core.scan_manager import ScanManager
from core.api_client import APIClient

class TestScanManager(unittest.TestCase):
    def test_init(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        scan_manager = ScanManager(api_client)
        self.assertEqual(len(scan_manager.vulnScanners), 1)
        self.assertEqual(scan_manager.APIClient, api_client)

    def test_run_scan(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        scan_manager = ScanManager(api_client)
        scan_id = scan_manager.run_scan("api_id", "user_id")
        self.assertIsNotNone(scan_id)

    def test_get_scan_details(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        scan_manager = ScanManager(api_client)
        scan_id = scan_manager.run_scan("api_id", "user_id")
        scan_details = scan_manager.get_scan_details(scan_id)
        self.assertIsNotNone(scan_details)

    def test_get_all_api_scans(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        scan_manager = ScanManager(api_client)
        scan_manager.run_scan("api_id", "user_id")
        scans = scan_manager.get_all_api_scans("api_id")
        self.assertGreater(len(scans), 0)

if __name__ == "__main__":
    unittest.main()
