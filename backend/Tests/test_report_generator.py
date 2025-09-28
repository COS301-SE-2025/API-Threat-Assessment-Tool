import pytest
from core.report_generator import ReportGenerator
from core.scan_result import ScanResult
from core.endpoint import Endpoint
import os

@pytest.fixture
def report_generator():
    return ReportGenerator()

@pytest.fixture
def scan_results():
    endpoint = Endpoint(
        path="/api/v1/users",
        method="GET",
        summary="Get all users",
        parameters=[],
        request_body=None,
        responses=[{"status_code": 200, "description": "Users retrieved successfully"}],
        tags=["users"]
    )
    return [
        ScanResult(
            owasp_category="A01:2021",
            vulnerability_name="SQL Injection",
            endpoint=endpoint,
            severity="High",
            cvss_score=9.0,
            description="A SQL injection vulnerability was detected",
            recommendation="Use prepared statements",
            evidence="Example evidence",
            test_name="SQL Injection Test",
            affected_params=["username", "password"]
        ),
        ScanResult(
            owasp_category="A02:2021",
            vulnerability_name="Cross-Site Scripting",
            endpoint=endpoint,
            severity="Medium",
            cvss_score=6.0,
            description="A cross-site scripting vulnerability was detected",
            recommendation="Use input validation",
            evidence="Example evidence",
            test_name="Cross-Site Scripting Test",
            affected_params=["username"]
        ),
        ScanResult(
            owasp_category="A03:2021",
            vulnerability_name="Sensitive Data Exposure",
            endpoint=endpoint,
            severity="Low",
            cvss_score=3.0,
            description="Sensitive data exposure vulnerability was detected",
            recommendation="Use encryption",
            evidence="Example evidence",
            test_name="Sensitive Data Exposure Test",
            affected_params=["password"]
        ),
        ScanResult(
            owasp_category="A05:2021",
            vulnerability_name="Security Misconfiguration",
            endpoint=endpoint,
            severity="Critical",
            cvss_score=10.0,
            description="Security misconfiguration vulnerability was detected",
            recommendation="Use secure configuration",
            evidence="Example evidence",
            test_name="Security Misconfiguration Test",
            affected_params=["server"]
        ),
        ScanResult(
            owasp_category="A06:2021",
            vulnerability_name="Vulnerable and Outdated Components",
            endpoint=endpoint,
            severity="Medium",
            cvss_score=6.0,
            description="Vulnerable and outdated components vulnerability was detected",
            recommendation="Update components",
            evidence="Example evidence",
            test_name="Vulnerable and Outdated Components Test",
            affected_params=["library"]
        ),
        ScanResult(
            owasp_category="A07:2021",
            vulnerability_name="Identification and Authentication Failures",
            endpoint=endpoint,
            severity="High",
            cvss_score=8.0,
            description="Identification and authentication failures vulnerability was detected",
            recommendation="Use strong authentication",
            evidence="Example evidence",
            test_name="Identification and Authentication Failures Test",
            affected_params=["username", "password"]
        ),
        ScanResult(
            owasp_category="A08:2021",
            vulnerability_name="Software and Data Integrity Failures",
            endpoint=endpoint,
            severity="Medium",
            cvss_score=5.0,
            description="Software and data integrity failures vulnerability was detected",
            recommendation="Use integrity checks",
            evidence="Example evidence",
            test_name="Software and Data Integrity Failures Test",
            affected_params=["data"]
        ),
        ScanResult(
            owasp_category="A09:2021",
            vulnerability_name="Security Logging and Monitoring Failures",
            endpoint=endpoint,
            severity="Low",
            cvss_score=2.0,
            description="Security logging and monitoring failures vulnerability was detected",
            recommendation="Use logging and monitoring",
            evidence="Example evidence",
            test_name="Security Logging and Monitoring Failures Test",
            affected_params=["logs"]
        ),
        ScanResult(
            owasp_category="A10:2021",
            vulnerability_name="Server-Side Request Forgery",
            endpoint=endpoint,
            severity="High",
            cvss_score=8.0,
            description="Server-side request forgery vulnerability was detected",
            recommendation="Use input validation",
            evidence="Example evidence",
            test_name="Server-Side Request Forgery Test",
            affected_params=["url"]
        ),
        ScanResult(
            owasp_category="A01:2021",
            vulnerability_name="SQL Injection",
            endpoint=endpoint,
            severity="Critical",
            cvss_score=10.0,
            description="A SQL injection vulnerability was detected",
            recommendation="Use prepared statements",
            evidence="Example evidence",
            test_name="SQL Injection Test",
            affected_params=["username", "password"]
        )
    ]


def test_create_technical_report(report_generator, scan_results):
    report_generator.create_technical_report(scan_results)
    assert report_generator.vuln_report.technical_report is not None

def test_create_executive_report(report_generator, scan_results):
    report_generator.create_executive_report(scan_results)
    assert report_generator.vuln_report.executive_report is not None

def test_generate_report_technical_html(report_generator, scan_results):
    report_generator.generate_report("technical", "technical_report.html", scan_results, "html")
    assert os.path.exists("technical_report.html")

def test_generate_report_technical_json(report_generator, scan_results):
    report_generator.generate_report("technical", "technical_report.json", scan_results, "json")
    assert os.path.exists("technical_report.json")

def test_generate_report_invalid_report_type(report_generator, scan_results):
    with pytest.raises(ValueError):
        report_generator.generate_report("invalid", "report.html", scan_results, "html")

def test_generate_report_invalid_report_format(report_generator, scan_results):
    with pytest.raises(ValueError):
        report_generator.generate_report("technical", "report", scan_results, "txt")

def test_generate_report_executive_html(report_generator, scan_results):
    report_generator.generate_report("executive", "executive_report.html", scan_results, "html")
    assert os.path.exists("executive_report.html")

def test_generate_report_executive_json(report_generator, scan_results):
    report_generator.generate_report("executive", "executive_report.json", scan_results, "json")
    assert os.path.exists("executive_report.json")