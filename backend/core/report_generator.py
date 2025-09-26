# Used to generate a report from a ScanResult Array
# ScanResults stored in ScanManager
# Pass ScanResult to create_Report
# This creates a report in the format defined in vulnerability_report.py
# Convert this vulnerability_report to html/json/pdf using generate functions 

from models.vulnerability_report import VulnerabilityReport
from fpdf import FPDF
from datetime import datetime
import json
import matplotlib.pyplot as plt
class ReportGenerator:
    def __init__(self):
        self.vuln_report = VulnerabilityReport()

    def create_technical_report(self, scan_results):
        technical_report = "# Vulnerability Report\n\n"
        technical_report += f"## Total Vulnerabilities: {len(scan_results)}\n\n"
        for i, result in enumerate(scan_results, start=1):
            technical_report += f"### Vulnerability {i}\n"
            technical_report += f"**Vulnerability Name:** {result.vulnerability_name}\n"
            technical_report += f"**Description:** {result.description}\n"
            technical_report += f"**Risk Level:** {result.severity}\n"
            technical_report += f"**Category:** {result.owasp_category}\n"
            technical_report += f"**Endpoint:** {result.endpoint.path}\n"
            technical_report += f"**HTTP Method:** {result.endpoint.method}\n"
            technical_report += f"**Recommendation:** {result.recommendation}\n\n"
            technical_report += "---\n\n"
        self.vuln_report.technical_report = technical_report


    def create_executive_report(self, scan_results):
        executive_report = "Executive Summary:\n"
        executive_report += f"Total Vulnerabilities: {len(scan_results)}\n"
        critical_count = sum(1 for result in scan_results if result.severity == "Critical")
        high_count = sum(1 for result in scan_results if result.severity == "High")
        medium_count = sum(1 for result in scan_results if result.severity == "Medium")
        low_count = sum(1 for result in scan_results if result.severity == "Low")
        executive_report += f"Critical: {critical_count}, High: {high_count}, Medium: {medium_count}, Low: {low_count}\n"
        executive_report += "Vulnerability Summary:\n"
        for result in scan_results:
            executive_report += f"- {result.vulnerability_name} ({result.severity})\n"

        severities = ['Low', 'Medium', 'High', 'Critical']
        counts = [low_count, medium_count, high_count, critical_count]
        colors = ['#FFFF00', '#FFA500', '#FF0000', '#800080']  # yellow, orange, red, purple
        plt.bar(severities, counts, color=colors)
        plt.xlabel('Severity')
        plt.ylabel('Count')
        plt.title('Vulnerability Severity Distribution')
        plt.savefig('vulnerability_severity_distribution.png', bbox_inches='tight')
        plt.close()

        labels = severities
        sizes = counts
        colors = ['#FFFF00', '#FFA500', '#FF0000', '#800080']  # yellow, orange, red, purple
        plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%')
        plt.title('Vulnerability Severity Percentage')
        plt.savefig('vulnerability_severity_percentage.png', bbox_inches='tight')
        plt.close()

        vulnerability_types = {}
        for result in scan_results:
            if result.vulnerability_name in vulnerability_types:
                vulnerability_types[result.vulnerability_name] += 1
            else:
                vulnerability_types[result.vulnerability_name] = 1

        labels = list(vulnerability_types.keys())
        sizes = list(vulnerability_types.values())
        plt.pie(sizes, labels=labels, autopct='%1.1f%%')
        plt.title('Vulnerability Type Percentage')
        plt.savefig('vulnerability_type_percentage.png', bbox_inches='tight')
        plt.close()

        self.vuln_report.executive_report = executive_report

    def generate_report(self, report_type, filename, scan_results, report_format):
        if report_type == "technical":
            self.create_technical_report(scan_results)
            if report_format == "html":
                self.generate_technical_html_report(filename, self.vuln_report.technical_report, scan_results)
            elif report_format == "pdf":
                self.generate_technical_pdf_report(filename, self.vuln_report.technical_report, scan_results)
            elif report_format == "json":
                self.generate_technical_json_report(filename, scan_results)
            else:
                raise ValueError("Invalid report format")
        elif report_type == "executive":
            self.create_executive_report(scan_results)
            if report_format == "html":
                self.generate_executive_html_report(filename, self.vuln_report.executive_report, scan_results)
            elif report_format == "pdf":
                self.generate_executive_pdf_report(filename, self.vuln_report.executive_report, scan_results)
            elif report_format == "json":
                self.generate_executive_json_report(filename, scan_results)
            else:
                raise ValueError("Invalid report format")
        else:
            raise ValueError("Invalid report type")

    
    def generate_technical_html_report(self, filename, report_data, scan_results):
        score = self.calculate_api_score(scan_results)
        html_report = f""" 
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vulnerability Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; line-height: 1.6; }}
                .container {{ max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .logo {{ position: absolute; top: 10px; right: 10px; width: 250px; }}
                h1 {{ color: #333; }}
                h2 {{ margin-top: 40px; color: #444; }}
                p {{ margin-bottom: 10px; }}
                .vulnerability {{ margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ddd; }}
                .severity {{ padding: 5px; border-radius: 4px; color: white; }}
                .Critical {{ background-color: #800080; }}
                .High {{ background-color: #FF0000; }}
                .Medium {{ background-color: #FFA500; }}
                .Low {{ background-color: #FFFF00; color: black; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <img src='BlueVisionLogo.png' alt='Company Logo' class="logo">
                <div class="header">
                    <h1>Vulnerability Report</h1>
                    <p>Total Vulnerabilities: {len(scan_results)}</p>
                    <p>API Score: {score}</p>
                </div>
        """

        for i, result in enumerate(scan_results, start=1):
            html_report += f"""
                <div class="vulnerability">
                    <h2>Vulnerability {i}: {result.vulnerability_name}</h2>
                    <p><strong>Description:</strong> {result.description}</p>
                    <p><strong>Risk Level:</strong> <span class="severity {result.severity}">{result.severity}</span></p>
                    <p><strong>Category:</strong> {result.owasp_category}</p>
                    <p><strong>Endpoint:</strong> {result.endpoint.path}</p>
                    <p><strong>HTTP Method:</strong> {result.endpoint.method}</p>
                    <p><strong>Recommendation:</strong> {result.recommendation}</p>
                </div>
            """

        html_report += f"""
            <div class="footer">
                <p>Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            </div>
            </div>
        </body>
        </html>
        """

        with open(filename, "w") as f:
            f.write(html_report)



    def generate_technical_pdf_report(self, filename, report_data, scan_results):
        score = self.calculate_api_score(scan_results)
        pdf = FPDF()
        pdf.add_page()
        pdf.image('BlueVisionLogo.png', x=150, y=10, w=50)
        pdf.set_font("Arial", size=15)
        pdf.cell(200, 10, txt="Vulnerability Report", ln=True, align='C')
        pdf.cell(200, 10, txt=f"Total Vulnerabilities: {len(scan_results)}", ln=True, align='C')
        pdf.cell(200, 10, txt=f"API Score: {score}", ln=True, align='C')
        pdf.ln(10)
        pdf.set_font("Arial", size=12)
        for i, result in enumerate(scan_results, start=1):
            pdf.cell(0, 10, txt=f"Vulnerability {i}: {result.vulnerability_name}", ln=True, align='L')
            pdf.set_font("Arial", style='B', size=12)
            pdf.cell(0, 10, txt="Description:", ln=True, align='L')
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 10, txt=result.description)
            pdf.set_font("Arial", style='B', size=12)
            pdf.cell(0, 10, txt=f"Risk Level: {result.severity}", ln=True, align='L')
            pdf.cell(0, 10, txt=f"Category: {result.owasp_category}", ln=True, align='L')
            pdf.set_font("Arial", style='B', size=12)
            pdf.cell(0, 10, txt="Recommendation:", ln=True, align='L')
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 10, txt=result.recommendation)
            pdf.ln(10)
            pdf.set_line_width(0.5)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(10)
        pdf.output(filename)

    def generate_executive_html_report(self, filename, report_data, scan_results):
        score = self.calculate_api_score(scan_results)
        html_report = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Executive Summary Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; line-height: 1.6; }}
                .container {{ max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .logo {{ position: absolute; top: 10px; right: 10px; width: 250px; }}
                h1 {{ color: #333; }}
                h2 {{ margin-top: 40px; color: #444; }}
                pre {{ background-color: #f9f9f9; padding: 10px; border-radius: 4px; border: 1px solid #ddd; }}
                .chart {{ margin: 20px 0; text-align: center; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <img src='BlueVisionLogo.png' alt='Company Logo' class="logo">
                <div class="header">
                    <h1>Executive Summary Report</h1>
                    <p>API Score: {score}</p>
                </div>
                <h2>Vulnerability Summary:</h2>
                <pre>{report_data}</pre>
                <div class="chart">
                    <h2>Vulnerability Severity Distribution:</h2>
                    <img src='vulnerability_severity_distribution.png' alt='Vulnerability Severity Distribution'>
                </div>
                <div class="chart">
                    <h2>Vulnerability Severity Percentage:</h2>
                    <img src='vulnerability_severity_percentage.png' alt='Vulnerability Severity Percentage'>
                </div>
                <div class="chart">
                    <h2>Vulnerability Type Percentage:</h2>
                    <img src='vulnerability_type_percentage.png' alt='Vulnerability Type Percentage'>
                </div>
                <div class="footer">
                    <p>Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
            </div>
        </body>
        </html>
        """

        with open(filename, "w") as f:
            f.write(html_report)

    def generate_executive_pdf_report(self, filename, report_data, scan_results):
        score = self.calculate_api_score(scan_results)
        pdf = FPDF()
        pdf.add_page()
        pdf.image('BlueVisionLogo.png', x=150, y=10, w=50)
        pdf.set_font("Arial", size=15)
        pdf.cell(200, 10, txt="Executive Summary Report", ln=True, align='C')
        pdf.cell(200, 10, txt=f"API Score: {score}", ln=True, align='C')
        pdf.ln(10)
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 10, txt="Vulnerability Summary:", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        for line in report_data.split("\n"):
            pdf.cell(0, 10, txt=line, ln=True, align='L')
        pdf.add_page()
        pdf.set_font("Arial", style='B', size=12)
        pdf.cell(0, 10, txt="Vulnerability Severity Distribution:", ln=True, align='L')
        pdf.image('vulnerability_severity_distribution.png', x=50, y=50, w=100)
        pdf.add_page()
        pdf.cell(0, 10, txt="Vulnerability Severity Percentage:", ln=True, align='L')
        pdf.image('vulnerability_severity_percentage.png', x=50, y=50, w=100)
        pdf.add_page()
        pdf.cell(0, 10, txt="Vulnerability Type Percentage:", ln=True, align='L')
        pdf.image('vulnerability_type_percentage.png', x=25, y=50, w=150)
        pdf.output(filename)

   
    def generate_technical_json_report(self, filename, scan_results):
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
                "endpoint": result.endpoint.path,
                "http_method": result.endpoint.method,
                "recommendation": result.recommendation
            })
        with open(filename, "w") as f:
            json.dump(report_data, f, indent=4)


    def generate_executive_json_report(self, filename, scan_results):
        score = self.calculate_api_score(scan_results)
        critical_count = sum(1 for result in scan_results if result.severity == "Critical")
        high_count = sum(1 for result in scan_results if result.severity == "High")
        medium_count = sum(1 for result in scan_results if result.severity == "Medium")
        low_count = sum(1 for result in scan_results if result.severity == "Low")
        report_data = {
            "api_score": score,
            "total_vulnerabilities": len(scan_results),
            "severity_distribution": {
                "Critical": critical_count,
                "High": high_count,
                "Medium": medium_count,
                "Low": low_count
            },
            "vulnerability_summary": [],
            "severity_distribution_chart_path": "vulnerability_severity_distribution.png",
            "severity_percentage_chart_path": "vulnerability_severity_percentage.png",
            "vulnerability_type_chart_path": "vulnerability_type_percentage.png"
        }
        for result in scan_results:
            report_data["vulnerability_summary"].append({
                "vulnerability_name": result.vulnerability_name,
                "severity": result.severity
            })
        with open(filename, "w") as f:
            json.dump(report_data, f,   indent=4)


    def calculate_api_score(self, scan_results):
        score = 100
        critical_count = sum(1 for result in scan_results if result.severity == "Critical")
        high_count = sum(1 for result in scan_results if result.severity == "High")
        medium_count = sum(1 for result in scan_results if result.severity == "Medium")
        low_count = sum(1 for result in scan_results if result.severity == "Low")

        score -= critical_count * 20
        score -= high_count * 10
        score -= medium_count * 5
        score -= low_count * 2

        return max(score, 0)