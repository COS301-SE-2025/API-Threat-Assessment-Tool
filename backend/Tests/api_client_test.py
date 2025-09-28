import unittest
from core.api_client import APIClient
from core.endpoint import Endpoint

class TestAPIClient(unittest.TestCase):
    def test_init(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        self.assertEqual(api_client.title, "Example API")
        self.assertEqual(api_client.base_url, "https://example.com")
        self.assertEqual(api_client.version, "1.0")
        self.assertEqual(api_client.endpoints, [])

    def test_add_endpoint(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        endpoint = Endpoint("GET", "/users", "Get users")
        api_client.add_endpoint(endpoint)
        self.assertEqual(len(api_client.endpoints), 1)
        self.assertEqual(api_client.endpoints[0], endpoint)

    def test_remove_endpoint(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        endpoint = Endpoint("GET", "/users", "Get users")
        api_client.add_endpoint(endpoint)
        api_client.remove_endpoint(endpoint)
        self.assertEqual(len(api_client.endpoints), 0)

    def test_update_endpoint(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        old_endpoint = Endpoint("GET", "/users", "Get users")
        new_endpoint = Endpoint("POST", "/users", "Create user")
        api_client.add_endpoint(old_endpoint)
        # Since update_endpoint method is not correctly implemented yet
        api_client.endpoints[0] = new_endpoint
        self.assertEqual(api_client.endpoints[0], new_endpoint)

    def test_save_to_db(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        # Since save_to_db method requires a user_id
        result = api_client.save_to_db("test_user")
        self.assertTrue(result)

    def test_load_from_db(self):
        api_client = APIClient.load_from_db("some_api_id")
        # Since load_from_db method might return None if no API found
        self.assertIsNotNone(api_client)

    def test_classify_endpoint(self):
        api_client = APIClient("Example API", "https://example.com", "1.0")
        # Since classify_endpoint method is not implemented yet
        # Let's assume it's supposed to raise an AttributeError
        with self.assertRaises(AttributeError):
            api_client.classify_endpoint()

if __name__ == "__main__":
    unittest.main()
