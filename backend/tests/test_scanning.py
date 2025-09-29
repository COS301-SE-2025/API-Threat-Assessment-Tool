
import os
import unittest
from input.api_importer import APIImporter
from core.vulnerability_test import (
    BOLA_Scan,
    BKEN_AUTH_Scan,
    BOPLA_Scan,
    URC_Scan,
    BFLA_Scan,
    UABF_Scan,
    SSRF_Scan,
    SEC_MISC_Scan,
    IIM_Scan,
    UCAPI_Scan,
    OWASP_FLAGS,
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
            ep.path for ep in self.api_client.endpoints if flag_enum in ep.flags
        ]
        return flagged

    # === Individual scanner tests ===

    def test_bola_flags(self):
        flagged = self._collect_flags(BOLA_Scan, OWASP_FLAGS.BOLA)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/BOLA/profile/{user_id}", flagged)

    def test_bopla_flags(self):
        flagged = self._collect_flags(BOPLA_Scan, OWASP_FLAGS.BOPLA)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/BOPLA/invoice/{invoice_id}/details", flagged)

    def test_bfla_flags(self):
        flagged = self._collect_flags(BFLA_Scan, OWASP_FLAGS.BFLA)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/BFLA/admin/users", flagged)

    def test_ssrf_flags(self):
        flagged = self._collect_flags(SSRF_Scan, OWASP_FLAGS.SSRF)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/SSRF/webhook", flagged)

    def test_iim_flags(self):
        flagged = self._collect_flags(IIM_Scan, OWASP_FLAGS.IIM)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/IIM/v1/users", flagged)

    def test_bken_auth_flags(self):
        flagged = self._collect_flags(BKEN_AUTH_Scan, OWASP_FLAGS.BKEN_AUTH)
        self.assertGreater(len(flagged), 0)

    def test_urc_flags(self):
        flagged = self._collect_flags(URC_Scan, OWASP_FLAGS.URC)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/URC/upload", flagged)

    def test_uabf_flags(self):
        flagged = self._collect_flags(UABF_Scan, OWASP_FLAGS.UABF)
        self.assertGreater(len(flagged), 0)

    def test_sec_misc_flags(self):
        flagged = self._collect_flags(SEC_MISC_Scan, OWASP_FLAGS.SEC_MISC)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/SEC_MISC/headers", flagged)

    def test_ucapi_flags(self):
        flagged = self._collect_flags(UCAPI_Scan, OWASP_FLAGS.UCAPI)
        self.assertGreater(len(flagged), 0)
        self.assertIn("/api/UCAPI/process-data", flagged)

    # === Scan Manager Test ===

    def test_scan_manager_results(self):
        scan_manager = ScanManager(self.api_client)
        scan_id = scan_manager.run_scan(self.api_client.db_id, "user_id")
        scans = scan_manager.get_scan_details(scan_id)
        self.assertGreater(len(scans), 0, "No results returned for the scan")

if __name__ == "__main__":
    unittest.main()