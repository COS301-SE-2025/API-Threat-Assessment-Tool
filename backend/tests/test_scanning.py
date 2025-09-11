import os
import unittest

from input.api_importer import APIImporter
from core.vulnerability_test import (
    BOLA_Scan, BKEN_AUTH_Scan, BOPLA_Scan, URC_Scan,
    BFLA_Scan, UABF_Scan, SSRF_Scan, SEC_MISC_Scan,
    IIM_Scan, UCAPI_Scan, OWASP_FLAGS
)
from core.scan_manager import ScanManager, ScanProfiles

JWT = "weak_secret_123"


class TestScanFlags(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Load API spec once
        path = os.path.join(os.path.dirname(__file__), "Files", "custom_server.json")
        importer = APIImporter()
        cls.api_client = importer.import_openapi(path)
        cls.api_client.set_auth_token(JWT)

    def _collect_flags(self, scanner_cls, flag_enum):
        scanner = scanner_cls()
        scanner._set_flag(self.api_client)
        flagged = [
            ep.path
            for ep in self.api_client.endpoints
            if flag_enum in ep.flags
        ]
        return flagged

    # === Individual scanner tests (unchanged from before) ===
    def test_bola_flags(self):
        flagged = self._collect_flags(BOLA_Scan, OWASP_FLAGS.BOLA)
        self.assertEqual(len(flagged), 5)
        self.assertIn("/api/BOLA/profile/{user_id}", flagged)

    def test_bopla_flags(self):
        flagged = self._collect_flags(BOPLA_Scan, OWASP_FLAGS.BOPLA)
        self.assertGreaterEqual(len(flagged), 8)
        self.assertIn("/api/BOPLA/invoice/{invoice_id}/details", flagged)

    def test_bfla_flags(self):
        flagged = self._collect_flags(BFLA_Scan, OWASP_FLAGS.BFLA)
        self.assertIn("/api/BFLA/admin/users", flagged)
        self.assertIn("/api/BFLA/internal/config", flagged)

    def test_ssrf_flags(self):
        flagged = self._collect_flags(SSRF_Scan, OWASP_FLAGS.SSRF)
        self.assertIn("/api/SSRF/webhook", flagged)
        self.assertIn("/api/SSRF/proxy/{path}", flagged)

    def test_iim_flags(self):
        flagged = self._collect_flags(IIM_Scan, OWASP_FLAGS.IIM)
        self.assertIn("/api/IIM/v1/users", flagged)
        self.assertIn("/api/IIM/deprecated/auth", flagged)

    def test_bken_auth_flags(self):
        flagged = self._collect_flags(BKEN_AUTH_Scan, OWASP_FLAGS.BKEN_AUTH)
        self.assertIn("/api/BOLA/ticket", flagged)

    def test_urc_flags(self):
        flagged = self._collect_flags(URC_Scan, OWASP_FLAGS.URC)
        self.assertIn("/api/URC/upload", flagged)

    def test_uabf_flags(self):
        flagged = self._collect_flags(UABF_Scan, OWASP_FLAGS.UABF)
        self.assertIn("/api/UABF/purchase/{product_id}", flagged)

    def test_sec_misc_flags(self):
        flagged = self._collect_flags(SEC_MISC_Scan, OWASP_FLAGS.SEC_MISC)
        self.assertIn("/api/SEC_MISC/headers", flagged)

    def test_ucapi_flags(self):
        flagged = self._collect_flags(UCAPI_Scan, OWASP_FLAGS.UCAPI)
        self.assertIn("/api/UCAPI/process-data", flagged)

    # === Scan Manager Test (new assertions) ===
    def test_scan_manager_results(self):
        scan_manager = ScanManager(self.api_client)
        scan_manager.createScan(ScanProfiles.DEFAULT)
        scan_id = scan_manager.runScan(ScanProfiles.DEFAULT)

        all_scans = scan_manager.get_all_scans()
        self.assertGreater(len(all_scans), 0, "ScanManager did not record any scans")

        scans = scan_manager.get_scan(scan_id)
        self.assertGreater(len(scans), 0, "No results returned for the scan")

        # Flatten scan endpoints
        scan_endpoints = [s for scan in scans for s in scan]
        self.assertGreater(len(scan_endpoints), 10, "Unexpectedly low number of flagged endpoints")

        # Example endpoint-category assertions
        endpoint_paths = [se.endpoint.path for se in scan_endpoints]

        # Check BOLA example
        self.assertIn("/api/BOLA/profile/{user_id}", endpoint_paths)
        self.assertTrue(
            any(se.owasp_category == 1 for se in scan_endpoints if se.endpoint.path == "/api/BOLA/profile/{user_id}"),
            "Expected /api/BOLA/profile/{user_id} to be flagged as BOLA"
        )

        # Check SSRF example
        self.assertIn("/api/SSRF/webhook", endpoint_paths)
        self.assertTrue(
            any(se.owasp_category == 7 for se in scan_endpoints if se.endpoint.path == "/api/SSRF/webhook"),
            "Expected /api/SSRF/webhook to be flagged as SSRF"
        )


if __name__ == "__main__":
    unittest.main()
