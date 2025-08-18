# Used to generate a report from a ScanResult Array
# ScanResults stored in ScanManager
# Pass ScanResult to create_Report
# This creates a report in the format defined in vulnerability_report.py
# Convert this vulnerability_report to html/json/pdf using generate functions 

# class ReportGenerator:
#     def __init__(self):
#         this.vulnReport = ""

#     def create_Technical_Report():
#         print("do something")

#     def create_Executive_Report():
#         print("do something")

#     def generate_HTMLReport():
#         print("do something")

#     def generate_JSONReport():
#         print("do something")

#     def generate_PDFReport():
#         print("do something")

from models.vulnerability_report import VulnerabilityReport
from fpdf import FPDF
import json

class ReportGenerator:
    def __init__(self):
        self.vuln_report = VulnerabilityReport()

    def create_technical_report(self, scan_results):
        technical_report = ""
        for result in scan_results:
            technical_report += f"Vulnerability: {result.vulnerability_name}\n"
            technical_report += f"Description: {result.description}\n"
            technical_report += f"Risk Level: {result.severity}\n"
            technical_report += f"Category: {result.owasp_category}\n"
            technical_report += f"Recommendation: {result.recommendation}\n\n"
        self.vuln_report.technical_report = technical_report

    def create_executive_report(self, scan_results):
        executive_report = ""
        executive_report += "Executive Summary:\n"
        executive_report += f"Total Vulnerabilities: {len(scan_results)}\n"
        executive_report += "Vulnerability Summary:\n"
        for result in scan_results:
            executive_report += f"- {result.vulnerability_name} ({result.severity})\n"
        self.vuln_report.executive_report = executive_report

    def generate_html_report(self, filename, scan_results):
        score = self.calculate_api_score(scan_results)
        html_report = "<html><body>"
        html_report += "<h1>Vulnerability Report</h1>"
        html_report += f"<p>API Score: {score}</p>"
        html_report += "<h2>Executive Summary:</h2>"
        html_report += f"<p>Total Vulnerabilities: {len(scan_results)}</p>"
        html_report += "<h2>Vulnerability Details:</h2>"
        for result in scan_results:
            html_report += f"<h3>{result.vulnerability_name}</h3>"
            html_report += f"<p>Description: {result.description}</p>"
            html_report += f"<p>Risk Level: {result.severity}</p>"
            html_report += f"<p>Category: {result.owasp_category}</p>"
            html_report += "</p>"
            html_report += f"<p>Recommendation: {result.recommendation}</p>"
        html_report += "</body></html>"
        with open(filename, "w") as f:
            f.write(html_report)

    def generate_json_report(self, filename, scan_results):
        score = self.calculate_api_score(scan_results)
        report_data = {
            "api_score": score,
            "vulnerabilities": []
        }
        for result in scan_results:
            report_data["vulnerabilities"].append({
                "vulnerability_name": result.vulnerability_name,
                "description": result.description,
                "severity": result.severity,
                "owasp_category": result.owasp_category,
                "recommendation": result.recommendation
            })
        with open(filename, "w") as f:
            json.dump(report_data, f, indent=4)

    def generate_pdf_report(self, filename, scan_results):
        score = self.calculate_api_score(scan_results)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=15)
        pdf.cell(200, 10, txt="Vulnerability Report", ln=True, align='C')
        pdf.cell(200, 10, txt=f"API Score: {score}", ln=True, align='C')
        pdf.ln(10)
        pdf.set_font("Arial", size=12)
        for result in scan_results:
            pdf.cell(0, 10, txt=f"Vulnerability: {result.vulnerability_name}", ln=True, align='L')
            pdf.cell(0, 10, txt=f"Description: {result.description}", ln=True, align='L')
            pdf.cell(0, 10, txt=f"Risk Level: {result.severity}", ln=True, align='L')
            pdf.cell(0, 10, txt=f"Category: {result.owasp_category}", ln=True, align='L')
            pdf.cell(0, 10, txt=f"Recommendation: {result.recommendation}", ln=True, align='L')
            pdf.ln(10)
        pdf.output(filename)

    def calculate_api_score(self, scan_results):
        score = 100
        for result in scan_results:
            if result.severity == "Critical":
                score -= 30
            elif result.severity == "High":
                score -= 20
            elif result.severity == "Medium":
                score -= 10
            elif result.severity == "Low":
                score -= 5
        return max(score, 0)
