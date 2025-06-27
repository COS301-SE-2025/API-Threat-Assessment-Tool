import unittest
from core.scan_result import ScanResult, Endpoint
from datetime import datetime

class TestScanResult(unittest.TestCase):
    def test_init(self):
        endpoint = Endpoint("/users", "GET", "Get users", [], {}, {}, ["users"])
        scan_result = ScanResult(
            owasp_category="A1: Injection",
            vulnerability_name="SQL Injection",
            endpoint=endpoint,
            severity="High",
            cvss_score=9.0,
            description="SQL injection vulnerability",
            recommendation="Use prepared statements",
            evidence="Example evidence",
            test_name="SQL injection test",
            affected_params=["username"],
            timestamp=datetime(2022, 1, 1, 12, 0, 0)
        )
        self.assertEqual(scan_result.owasp_category, "A1: Injection")
        self.assertEqual(scan_result.vulnerability_name, "SQL Injection")
        self.assertEqual(scan_result.endpoint, endpoint)
        self.assertEqual(scan_result.severity, "High")
        self.assertEqual(scan_result.cvss_score, 9.0)
        self.assertEqual(scan_result.description, "SQL injection vulnerability")
        self.assertEqual(scan_result.recommendation, "Use prepared statements")
        self.assertEqual(scan_result.evidence, "Example evidence")
        self.assertEqual(scan_result.test_name, "SQL injection test")
        self.assertEqual(scan_result.affected_params, ["username"])
        self.assertEqual(scan_result.timestamp, datetime(2022, 1, 1, 12, 0, 0))

    def test_init_with_defaults(self):
        endpoint = Endpoint("/users", "GET", "Get users", [], {}, {}, ["users"])
        scan_result = ScanResult(
            owasp_category="A1: Injection",
            vulnerability_name="SQL Injection",
            endpoint=endpoint,
            severity="High"
        )
        self.assertIsNotNone(scan_result.timestamp)
        self.assertEqual(scan_result.affected_params, [])

if __name__ == "__main__":
    unittest.main()