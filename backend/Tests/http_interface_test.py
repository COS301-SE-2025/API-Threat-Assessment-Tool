import unittest
from your_module import HTTPInterface

class TestHTTPInterface(unittest.TestCase):
    def test_init(self):
        http_interface = HTTPInterface("https://example.com", "/api")
        self.assertEqual(http_interface.host, "https://example.com")
        self.assertEqual(http_interface.base_path, "api")
        self.assertEqual(http_interface.base_url, "https://example.com/api")

    def test_init_with_trailing_slash(self):
        http_interface = HTTPInterface("https://example.com/", "/api/")
        self.assertEqual(http_interface.host, "https://example.com")
        self.assertEqual(http_interface.base_path, "api")
        self.assertEqual(http_interface.base_url, "https://example.com/api")

    def test_send_get(self):
        # This method is not implemented yet
        http_interface = HTTPInterface("https://example.com", "/api")
        with self.assertRaises(TypeError):
            http_interface.send_get()

    def test_send_post(self):
        # This method is not implemented yet
        http_interface = HTTPInterface("https://example.com", "/api")
        with self.assertRaises(TypeError):
            http_interface.send_post()

    def test_send_custom(self):
        # This method is not implemented yet
        http_interface = HTTPInterface("https://example.com", "/api")
        with self.assertRaises(TypeError):
            http_interface.send_custom()

    def test_add_header(self):
        # This method is not implemented yet
        http_interface = HTTPInterface("https://example.com", "/api")
        with self.assertRaises(TypeError):
            http_interface.add_header("key", "value")

    def test_update_body(self):
        # This method is not implemented yet
        http_interface = HTTPInterface("https://example.com", "/api")
        with self.assertRaises(TypeError):
            http_interface.update_body("body")

if __name__ == "__main__":
    unittest.main()
