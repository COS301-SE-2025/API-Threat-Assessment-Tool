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
        )
    ]

def test_create_technical_report(report_generator, scan_results):
    report_generator.create_technical_report(scan_results)
    assert report_generator.vuln_report.technical_report is not None

def test_create_executive_report(report_generator, scan_results):
    report_generator.create_executive_report(scan_results)
    assert report_generator.vuln_report.executive_report is not None

def test_generate_html_report(report_generator, scan_results):
    report_generator.generate_html_report("report.html", scan_results)
    assert os.path.exists("report.html")

def test_generate_json_report(report_generator, scan_results):
    report_generator.generate_json_report("report.json", scan_results)
    assert os.path.exists("report.json")

def test_generate_pdf_report(report_generator, scan_results):
    report_generator.generate_pdf_report("report.pdf", scan_results)
    assert os.path.exists("report.pdf")

