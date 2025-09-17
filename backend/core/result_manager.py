# Stores results created by the VulnerabilityScanner
from datetime import datetime
from uuid import uuid4
import hashlib
from typing import Any, Dict, List
import json
from core.db_manager import db_manager

class ResultManager:
    def __init__(self):
        self.apiName = ""
        self.scans: Dict[str, Any] = {}

    def add_result(self, results, scan_id: int):
        """Save scan results to database"""
        if results is None:
            print("Error results not set")
            return

        try:
            # Save each vulnerability result
            for endpoint_path, endpoint_results in results.items():
                for result in endpoint_results:
                    # Get endpoint ID from database
                    endpoint_data = db_manager.select(
                        "endpoints", 
                        filters={"url": endpoint_path}
                    )
                    
                    if not endpoint_data:
                        print(f"Endpoint {endpoint_path} not found in database")
                        continue
                    
                    endpoint_id = endpoint_data[0]["id"]
                    
                    # Prepare scan result data
                    result_data = {
                        "scan_id": scan_id,
                        "endpoint_id": endpoint_id,
                        "test_name": result.get("test_name", ""),
                        "severity": result.get("severity", ""),
                        "cvss_score": result.get("cvss_score"),
                        "description": result.get("description", ""),
                        "recommendation": result.get("recommendation", ""),
                        "evidence": result.get("evidence", ""),
                        "response_code": result.get("response_code"),
                        "owasp_category": result.get("owasp_category", ""),
                        "vulnerability_name": result.get("vulnerability_name", ""),
                        "affected_params": json.dumps(result.get("affected_params", {}))
                    }
                    
                    # Insert into database
                    db_manager.insert("scan_results", result_data)
            
            print(f"Results saved to database for scan ID: {scan_id}")
            return scan_id
            
        except Exception as e:
            print(f"Error saving results to database: {e}")
            return None

    def get_result(self, scan_id: int):
        """Get scan results from database"""
        try:
            results = db_manager.select(
                "scan_results", 
                filters={"scan_id": scan_id}
            )
            return results
        except Exception as e:
            print(f"Error retrieving results from database: {e}")
            return None

    def remove_result(self, scan_id: int):
        """Remove scan results from database"""
        try:
            deleted = db_manager.delete(
                "scan_results",
                filters={"scan_id": scan_id}
            )
            print(f"Removed {len(deleted)} results for scan ID: {scan_id}")
            return len(deleted)
        except Exception as e:
            print(f"Error removing results from database: {e}")
            return 0

    def get_all_results(self):
        """Get all scan results from database"""
        try:
            return db_manager.select("scan_results")
        except Exception as e:
            print(f"Error retrieving all results from database: {e}")
            return []

