import unittest
from core.result_manager import ResultManager

class TestResultManager(unittest.TestCase):
    def test_init(self):
        result_manager = ResultManager()
        self.assertEqual(result_manager.apiName, "")
        self.assertEqual(result_manager.scans, "")

    def test_add_result(self):
        # This method is not implemented yet
        result_manager = ResultManager()
        with self.assertRaises(TypeError):
            result_manager.add_result()

    def test_get_result(self):
        # This method is not implemented yet
        result_manager = ResultManager()
        with self.assertRaises(TypeError):
            result_manager.get_result()

    def test_remove_result(self):
        # This method is not implemented yet
        result_manager = ResultManager()
        with self.assertRaises(TypeError):
            result_manager.remove_result()

if __name__ == "__main__":
    unittest.main()
