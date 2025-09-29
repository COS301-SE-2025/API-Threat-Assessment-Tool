import unittest
from core.report_generator import ReportGenerator

class TestReportGenerator(unittest.TestCase):
    def test_init(self):
        report_generator = ReportGenerator()
        self.assertEqual(report_generator.vuln_report, "")

    def test_create_Technical_Report(self):
        # This method is not implemented yet
        report_generator = ReportGenerator()
        with self.assertRaises(TypeError):
            report_generator.create_technical_report()

    def test_create_Executive_Report(self):
        # This method is not implemented yet
        report_generator = ReportGenerator()
        with self.assertRaises(TypeError):
            report_generator.create_executive_report()

    def test_generate_HTMLReport(self):
        # This method is not implemented yet
        report_generator = ReportGenerator()
        with self.assertRaises(TypeError):
            report_generator.generate_report()

    def test_generate_JSONReport(self):
        # This method is not implemented yet
        report_generator = ReportGenerator()
        with self.assertRaises(TypeError):
            report_generator.generate_report()

if __name__ == "__main__":
    unittest.main()