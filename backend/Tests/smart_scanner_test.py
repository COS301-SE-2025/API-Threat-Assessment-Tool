# from backend.core.api_client import APIClient


# def test_smart_scanner_api_type_detection(self):
#     # Test that the scanner correctly identifies the type of API
#     api = APIClient("https://example.com/api", "REST")
#     scanner = SmartScanner(api)
#     self.assertEqual(scanner.api_type, "REST")

# def test_smart_scanner_context_aware_scanning(self):
#     # Test that the scanner understands the context of the API
#     api = APIClient("https://example.com/api", "REST")
#     scanner = SmartScanner(api)
#     # Simulate a request to the API
#     request = Request("GET", "/users")
#     response = api.send_request(request)
#     # Test that the scanner identifies potential vulnerabilities based on the context
#     vulnerabilities = scanner.scan(response)
#     self.assertGreater(len(vulnerabilities), 0)

# def test_smart_scanner_machine_learning_based_detection(self):
#     # Test that the scanner uses machine learning models to identify potential vulnerabilities
#     api = APIClient("https://example.com/api", "REST")
#     scanner = SmartScanner(api)
#     # Simulate a request to the API
#     request = Request("GET", "/users")
#     response = api.send_request(request)
#     # Test that the scanner identifies potential vulnerabilities using machine learning
#     vulnerabilities = scanner.scan(response)
#     self.assertGreater(len(vulnerabilities), 0)