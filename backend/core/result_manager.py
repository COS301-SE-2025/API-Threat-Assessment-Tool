# Stores results created by the VulnerabilityScanner
from datetime import datetime
from uuid import uuid4
import hashlib
from typing import Any, Dict

class ResultManager:
    def __init__(self):
        self.apiName = ""
        self.scans: Dict[str, Any] = {}

    def add_result(self, results):
        if results is None:
            print("Error results not set")
            return

        result_id = uuid4().hex
        self.scans[result_id] = results
        print("New scan finished: ", result_id)
        return result_id

    def get_result(self, id):
        if id not in self.scans:
            raise KeyError(f"Result ID {id!r} not found")
        return self.scans[id]

    def remove_result(self, id):
        if id not in self.scans:
            raise KeyError(f"Result ID {id!r} not found")
        del self.scans[id]

    def get_all_results(self):
        return self.scans


