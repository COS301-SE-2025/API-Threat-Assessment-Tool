import uuid
import json
from enum import Enum
from core.vulnerability_scanner import VulnerabilityScanner
from core.db_manager import db_manager
from datetime import datetime
from typing import Optional, List, Dict, Any

class ScanProfiles(Enum):
    DEFAULT = "OWASP API Top 10 Full Scan"

class ScanManager:
    def __init__(self, api_client):
        self.APIClient = api_client
        self.vulnScanners = [VulnerabilityScanner(api_client, ScanProfiles.DEFAULT)]
    
    def _start_scan_entry(self, api_id: str, user_id: str) -> Optional[str]:
        """Creates a record in the 'scans' table and returns the scan ID."""
        try:
            scan_id = uuid.uuid4().hex
            scan_data = {
                "id": scan_id,
                "api_id": api_id,
                "user_id": user_id,
                "status": "running",
                "started_at": datetime.now().isoformat()
            }
            
            result = db_manager.insert("scans", scan_data)
            if result:
                print(f"Created new scan entry with ID: {scan_id}")
                return scan_id
            
            print("Failed to create scan entry in database.")
            return None
                
        except Exception as e:
            print(f"Error creating scan entry: {e}")
            return None

    def _save_scan_results(self, scan_id: str, results: List[Dict[str, Any]]):
        """Bulk-inserts all scan findings into the 'scan_results' table."""
        if not results:
            print(f"No vulnerabilities found to save for scan {scan_id}.")
            return

        try:
            db_manager.insert("scan_results", results)
            print(f"Successfully saved {len(results)} findings for scan {scan_id}.")
        except Exception as e:
            print(f"Error bulk-saving scan results for scan {scan_id}: {e}")

    def _complete_scan_entry(self, scan_id: str):
        """Updates the scan record to 'completed' status."""
        try:
            update_data = {
                "status": "completed",
                "completed_at": datetime.now().isoformat()
            }
            db_manager.update("scans", update_data, {"id": scan_id})
            print(f"Scan {scan_id} marked as completed.")
        except Exception as e:
            print(f"Error completing scan entry {scan_id}: {e}")

    def _execute_scan_in_background(self, scan_id: str):
        """
        This method contains the long-running scan logic and is intended to be run
        in a separate thread. It does not return anything.
        """
        try:
            print(f"Background thread started for scan {scan_id}")
            # Run the actual vulnerability tests
            all_results_for_db = []
            for scanner in self.vulnScanners:
                print(f"Running tests for profile: {scanner.scanProfile.value}")
                list_of_scan_results_list = scanner.run_tests()
                
                # Flatten the list and prepare results for DB insertion
                for result_list in list_of_scan_results_list:
                    if result_list:
                        for scan_result_obj in result_list:
                             all_results_for_db.append(scan_result_obj.to_db_dict(scan_id))

            # Save the consolidated results and complete the scan
            self._save_scan_results(scan_id, all_results_for_db)
            self._complete_scan_entry(scan_id)
            print(f"Background thread finished successfully for scan {scan_id}")
            
        except Exception as e:
            print(f"An error occurred in background scan thread for {scan_id}: {e}")
            try:
                # Mark as failed if something goes wrong mid-scan
                db_manager.update("scans", {"status": "failed", "completed_at": datetime.now().isoformat()}, {"id": scan_id})
            except Exception as fail_e:
                print(f"Could not even mark scan {scan_id} as failed: {fail_e}")

    def get_scan_details(self, scan_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific scan and its associated results."""
        try:
            scan_data = db_manager.select("scans", filters={"id": scan_id})
            if not scan_data:
                return None
            
            results_data = db_manager.select("scan_results", filters={"scan_id": scan_id})
            
            # Parse JSONB fields before returning
            for result in results_data:
                if result.get("evidence") and isinstance(result["evidence"], str):
                    result["evidence"] = json.loads(result["evidence"])
                if result.get("affected_params") and isinstance(result["affected_params"], str):
                    result["affected_params"] = json.loads(result["affected_params"])

            return {
                "scan_info": scan_data[0],
                "results": results_data
            }
        except Exception as e:
            print(f"Error getting scan details: {e}")
            return None

    def get_all_api_scans(self, api_id: str) -> List[Dict[str, Any]]:
        """Get all scan records for a specific API."""
        try:
            return db_manager.select("scans", filters={"api_id": api_id})
        except Exception as e:
            print(f"Error retrieving scans: {e}")
            return []
