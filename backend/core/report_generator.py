import os
from datetime import datetime
from collections import defaultdict, Counter
from fpdf import FPDF
import matplotlib.pyplot as plt
import matplotlib

# Use a backend that doesn't require a GUI
matplotlib.use('Agg')

# --- Color Palette (from Home.css) ---
COLORS = {
    "primary": (107, 70, 193),      # #6b46c1
    "primary_light": (138, 99, 210), # #8a63d2
    "primary_dark": (85, 60, 154),   # #553c9a
    "text_primary": (31, 41, 55),    # #1f2937
    "text_secondary": (75, 85, 99),  # #4b5563
    "bg_primary": (248, 250, 252),  # #f8fafc
    "critical": (139, 0, 0),         # Dark Red
    "high": (220, 53, 69),           # Red
    "medium": (253, 126, 20),        # Orange
    "low": (255, 193, 7),            # Yellow
}

# --- OWASP Category Mapping ---
OWASP_MAP = {
    "API1:2023": "Broken Object Level Authorization",
    "API2:2023": "Broken Authentication",
    "API3:2023": "Broken Object Property Level Authorization",
    "API4:2023": "Unrestricted Resource Consumption",
    "API5:2023": "Broken Function Level Authorization",
    "API6:2023": "Unrestricted Access to Sensitive Business Flows",
    "API7:2023": "Server Side Request Forgery",
    "API8:2023": "Security Misconfiguration",
    "API9:2023": "Improper Inventory Management",
    "API10:2023": "Unsafe Consumption of APIs",
    "BOLA": "Broken Object Level Authorization", # Common Abbreviation
    "BFLA": "Broken Function Level Authorization", # Common Abbreviation
}


class PDF(FPDF):
    """Custom PDF class with styled Header and Footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_name = "API Scan Report"

    def set_api_name(self, name):
        self.api_name = name if name else "API Scan Report"

    def header(self):
        if self.page_no() == 1:
            return  # Skip header on the title page
        self.set_y(10)
        if os.path.exists('BlueVisionLogo.png'):
            self.image('BlueVisionLogo.png', x=10, y=8, w=30)
        
        self.set_font('Arial', 'B', 12)
        self.set_text_color(*COLORS["text_primary"])
        self.cell(0, 10, self.api_name, 0, 0, 'C')
        self.ln(20)

    def footer(self):
        if self.page_no() == 1:
            return # Skip footer on the title page
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')


class ReportGenerator:
    def _safe_text(self, text):
        """Encodes text to latin-1 for FPDF compatibility, replacing unknown characters."""
        if text is None:
            return ''
        return str(text).encode('latin-1', 'replace').decode('latin-1')

    def calculate_api_score(self, scan_results):
        score = 100
        weights = {"Critical": 20, "High": 10, "Medium": 5, "Low": 2}
        for result in scan_results:
            score -= weights.get(result.severity, 0)
        return max(score, 0)

    def _cleanup_charts(self):
        """Removes generated chart images after use."""
        for filename in ["severity_bar_chart.png", "owasp_pie_chart.png"]:
            if os.path.exists(filename):
                os.remove(filename)

    def generate_report(self, report_type, scan_results, api_name="Untitled API", return_bytes=False):
        """Main dispatcher to generate the specified report."""
        if not return_bytes:
            raise ValueError("This generator is designed to return bytes for API transmission.")

        api_name = self._safe_text(api_name)

        if report_type == "executive":
            return self.generate_executive_pdf_report(scan_results, api_name)
        elif report_type == "technical":
            return self.generate_technical_pdf_report(scan_results, api_name)
        else:
            raise ValueError(f"Invalid report type: {report_type}")

    def generate_executive_pdf_report(self, scan_results, api_name):
        """Generates a high-level, styled executive summary PDF."""
        pdf = PDF()
        pdf.set_api_name(f"Executive Summary | {api_name}")
        pdf.add_page()
        
        # --- Title Page ---
        pdf.set_fill_color(*COLORS["primary"])
        pdf.rect(0, 0, 210, 80, 'F')
        if os.path.exists('BlueVisionLogo.png'):
            pdf.image('BlueVisionLogo.png', x=pdf.w / 2 - 25, y=20, w=50)
        pdf.set_y(100)
        pdf.set_font('Arial', 'B', 28)
        pdf.set_text_color(*COLORS["text_primary"])
        pdf.cell(0, 15, "Executive Security Summary", 0, 1, 'C')
        pdf.set_font('Arial', '', 18)
        pdf.cell(0, 10, api_name, 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', '', 12)
        pdf.set_text_color(*COLORS["text_secondary"])
        pdf.cell(0, 8, f"Report Generated: {datetime.now().strftime('%B %d, %Y')}", 0, 1, 'C')

        # --- Summary Page ---
        pdf.add_page()
        severities = defaultdict(int)
        owasp_categories = []
        for res in scan_results:
            severities[res.severity] += 1
            owasp_categories.append(res.owasp_category)
        
        # Key Findings
        pdf.set_text_color(*COLORS["text_primary"])
        pdf.set_font('Arial', 'B', 20)
        pdf.cell(0, 10, "Key Findings", 0, 1, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(0, 6, 
            "This report provides a high-level overview of the security vulnerabilities "
            "identified in the recent scan, categorized by severity and type.")
        pdf.ln(5)
        
        # Severity Cards
        card_y = pdf.get_y()
        severities_to_display = ["High", "Medium", "Low"] # "Critical" removed
        colors_map = {"High": COLORS["high"], "Medium": COLORS["medium"], "Low": COLORS["low"]}
        
        # Centered layout logic for 3 cards
        card_width = 60
        gap = 5
        start_x = (210 - (card_width * len(severities_to_display) + gap * (len(severities_to_display) - 1))) / 2

        for i, severity in enumerate(severities_to_display):
            pdf.set_xy(start_x + (i * (card_width + gap)), card_y)
            pdf.set_fill_color(*colors_map[severity])
            pdf.cell(card_width, 10, "", 0, 1, 'C', True)
            
            pdf.set_xy(start_x + (i * (card_width + gap)), card_y + 10)
            pdf.set_fill_color(*COLORS["bg_primary"])
            pdf.set_font('Arial', 'B', 20)
            pdf.cell(card_width, 15, str(severities.get(severity, 0)), 1, 0, 'C', True)
            
            pdf.set_xy(start_x + (i * (card_width + gap)), card_y + 25)
            pdf.set_font('Arial', '', 12)
            pdf.cell(card_width, 10, severity, 1, 1, 'C', True)
        pdf.ln(15)

        # Generate and add charts
        self._generate_severity_bar_chart(severities)
        self._generate_owasp_pie_chart(owasp_categories)

        if os.path.exists("severity_bar_chart.png"):
            pdf.image("severity_bar_chart.png", x=10, w=190)
            pdf.ln(5)

        if os.path.exists("owasp_pie_chart.png"):
            pdf.image("owasp_pie_chart.png", x=10, w=190)
            pdf.ln(5)

        # --- Recommendations & Metrics Page ---
        pdf.add_page()
        pdf.set_font('Arial', 'B', 20)
        pdf.cell(0, 10, "Recommendations", 0, 1, 'L')
        pdf.set_font('Arial', '', 12)
        if severities.get("Critical", 0) > 0 or severities.get("High", 0) > 0:
            pdf.multi_cell(0, 6,
                "IMMEDIATE ACTION REQUIRED: Critical and/or High severity vulnerabilities pose a significant "
                "threat and should be addressed by the development team as a top priority. Focus on access control, "
                "input validation, and proper authentication mechanisms.")
        else:
            pdf.multi_cell(0, 6,
                "PROACTIVE MEASURES: While no critical or high-risk issues were found, it is recommended to review all "
                "Medium and Low severity findings to enhance the API's security posture and prevent future escalations. "
                "Continue with regular security scans and developer training.")
        
        pdf.ln(10)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(10)
        
        # Metrics Section
        score = self.calculate_api_score(scan_results)
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, "Scan Metrics", 0, 1, 'L')
        pdf.set_font('Arial', '', 11)
        pdf.set_text_color(*COLORS["text_secondary"])
        pdf.multi_cell(0, 6, "The API Security Score is a weighted metric based on the number and severity of vulnerabilities found. It is intended to be a consistent benchmark for tracking security posture improvements over time.")
        pdf.ln(5)

        pdf.set_font('Arial', 'B', 18)
        pdf.set_text_color(*COLORS["primary"])
        pdf.cell(40, 10, f"Score: {score}/100", 0, 0, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.set_text_color(*COLORS["text_secondary"])
        pdf.cell(0, 10, f"Total Vulnerabilities: {len(scan_results)}", 0, 1, 'L')
        
        self._cleanup_charts()
        return pdf.output(dest='S').encode('latin-1')

    def _generate_severity_bar_chart(self, severities):
        """Generates a styled horizontal bar chart for the executive summary."""
        plt.style.use('seaborn-v0_8-whitegrid')
        fig, ax = plt.subplots(figsize=(10, 2.5))
        
        labels = ["Low", "Medium", "High", "Critical"]
        counts = [severities.get(s, 0) for s in labels]
        bar_colors = [tuple(c/255 for c in COLORS["low"]), tuple(c/255 for c in COLORS["medium"]), 
                      tuple(c/255 for c in COLORS["high"]), tuple(c/255 for c in COLORS["critical"])]

        bars = ax.barh(labels, counts, color=bar_colors, height=0.6)
        
        ax.set_title('Vulnerability Count by Severity', fontsize=16, weight='bold', color=tuple(c/255 for c in COLORS["text_primary"]))
        ax.tick_params(axis='x', colors=tuple(c/255 for c in COLORS["text_secondary"]))
        ax.tick_params(axis='y', colors=tuple(c/255 for c in COLORS["text_primary"]))
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#DDDDDD')
        ax.spines['bottom'].set_color('#DDDDDD')
        ax.get_xaxis().set_major_locator(plt.MaxNLocator(integer=True))
        
        plt.tight_layout()
        plt.savefig("severity_bar_chart.png", dpi=150, transparent=True)
        plt.close(fig)

    def _generate_owasp_pie_chart(self, categories):
        """Generates a styled pie chart for OWASP categories."""
        if not categories:
            return

        counts = Counter(categories)
        # Group small slices into 'Other'
        total = len(categories)
        top_categories = {}
        other_count = 0
        for cat, count in counts.most_common():
            if count / total < 0.05 and len(top_categories) >= 5: # Group slices smaller than 5% if we have enough big slices
                other_count += count
            else:
                top_categories[cat] = count
        if other_count > 0:
            top_categories['Other'] = other_count

        labels = [OWASP_MAP.get(cat, cat) for cat in top_categories.keys()]
        sizes = list(top_categories.values())

        plt.style.use('seaborn-v0_8-whitegrid')
        fig, ax = plt.subplots(figsize=(10, 4))
        
        # Create a color map to ensure consistency
        pie_colors = [tuple(c/255 for c in v) for v in [COLORS['primary'], COLORS['primary_light'], COLORS['medium'], (150,150,150), (180,180,180), (210,210,210)]]

        wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct='%1.1f%%',
                                          startangle=90, colors=pie_colors[:len(labels)],
                                          pctdistance=0.85, textprops={'color': "black"})
        
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_weight('bold')

        ax.set_title('Vulnerability Distribution by OWASP Category', fontsize=16, weight='bold', color=tuple(c/255 for c in COLORS["text_primary"]))
        ax.axis('equal')
        
        plt.tight_layout()
        plt.savefig("owasp_pie_chart.png", dpi=150, transparent=True)
        plt.close(fig)

    def generate_technical_pdf_report(self, scan_results, api_name):
        """Generates a detailed technical PDF, grouping vulnerabilities by endpoint."""
        pdf = PDF()
        pdf.set_api_name(f"Technical Report | {api_name}")
        
        # --- Group vulnerabilities by endpoint ---
        endpoints = defaultdict(list)
        for res in scan_results:
            endpoint_key = f"{res.endpoint.method.upper()} {res.endpoint.path}"
            endpoints[endpoint_key].append(res)
        
        # --- Title Page ---
        pdf.add_page()
        pdf.set_fill_color(*COLORS["primary_dark"])
        pdf.rect(0, 0, 210, 80, 'F')
        if os.path.exists('BlueVisionLogo.png'):
            pdf.image('BlueVisionLogo.png', x=pdf.w / 2 - 25, y=20, w=50)
        pdf.set_y(100)
        pdf.set_font('Arial', 'B', 28)
        pdf.set_text_color(*COLORS["text_primary"])
        pdf.cell(0, 15, "Technical Vulnerability Report", 0, 1, 'C')
        pdf.set_font('Arial', '', 18)
        pdf.cell(0, 10, api_name, 0, 1, 'C')
        pdf.ln(10)
        pdf.set_font('Arial', '', 12)
        pdf.set_text_color(*COLORS["text_secondary"])
        pdf.cell(0, 8, f"Scan Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, 'C')
        pdf.cell(0, 8, f"Total Vulnerabilities Found: {len(scan_results)}", 0, 1, 'C')
        pdf.cell(0, 8, f"Endpoints Scanned: {len(endpoints)}", 0, 1, 'C')

        # --- Vulnerabilities Section ---
        pdf.add_page()
        for endpoint, vulnerabilities in sorted(endpoints.items()):
            pdf.set_font('Arial', 'B', 14)
            pdf.set_fill_color(*COLORS["bg_primary"])
            pdf.set_text_color(*COLORS["text_primary"])
            pdf.cell(0, 10, self._safe_text(endpoint), 1, 1, 'L', True)
            pdf.ln(5)

            for vuln in sorted(vulnerabilities, key=lambda v: ["Critical", "High", "Medium", "Low"].index(v.severity)):
                # Severity Badge
                severity_color = COLORS.get(vuln.severity.lower(), (0,0,0))
                pdf.set_fill_color(*severity_color)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font('Arial', 'B', 10)
                pdf.cell(25, 6, self._safe_text(vuln.severity), 0, 0, 'C', True)
                
                # Vulnerability Name
                pdf.set_text_color(*COLORS["text_primary"])
                pdf.set_font('Arial', 'B', 12)
                pdf.cell(0, 6, f"  {self._safe_text(vuln.vulnerability_name)}", 0, 1)
                pdf.ln(2)

                # Details
                pdf.set_font('Arial', 'B', 10)
                pdf.cell(0, 6, "Description:", 0, 1)
                pdf.set_font('Arial', '', 10)
                pdf.set_text_color(*COLORS["text_secondary"])
                pdf.multi_cell(0, 5, self._safe_text(vuln.description))
                pdf.ln(2)

                pdf.set_font('Arial', 'B', 10)
                pdf.set_text_color(*COLORS["text_primary"])
                pdf.cell(0, 6, "Recommendation:", 0, 1)
                pdf.set_font('Arial', '', 10)
                pdf.set_text_color(*COLORS["text_secondary"])
                pdf.multi_cell(0, 5, self._safe_text(vuln.recommendation))
                
                if vuln != vulnerabilities[-1]:
                    pdf.ln(5)
                    pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
                    pdf.ln(5)
                else:
                    pdf.ln(5)
            pdf.ln(5)

        return pdf.output(dest='S').encode('latin-1')

