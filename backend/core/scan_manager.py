# Manage your VulnerabilityScanner objects
# Store each VulnerabilityScanner in a dictionare, vulnScanners["profileName"] to access VulnerabilityScanner object
# scan_manager.py
from enum import Enum
from core.result_manager import ResultManager
from core.vulnerability_scanner import VulnerabilityScanner
from core.db_manager import db_manager
from datetime import datetime

class ScanProfiles(Enum):
    DEFAULT = "OWASP API Top 10 Full Scan"

class ScanManager:
    def __init__(self, api_client):
        self.vulnScanners = []
        self.resultManager = ResultManager()
        self.APIClient = api_client
        self.scan_profile = ScanProfiles.DEFAULT
        self.loaded_profiles = []
    
    def createScan(self, scan_profile_name: str, profile_description: str = "", user_id: str = None):
        """Create and save a scan profile to database"""
        try:
            # Check if profile already exists
            existing_profiles = db_manager.select(
                "scan_profiles",
                filters={"name": scan_profile_name}
            )
            
            if existing_profiles:
                print("Profile already exists in database")
                return existing_profiles[0]["id"]
            
            # Create new profile
            profile_data = {
                "name": scan_profile_name,
                "description": profile_description or f"{scan_profile_name} scan profile",
                "user_id": user_id
            }
            
            result = db_manager.insert("scan_profiles", profile_data)
            profile_id = result["id"] if result else None
            
            if profile_id:
                print(f"Scan profile created with ID: {profile_id}")
                return profile_id
            else:
                print("Failed to create scan profile")
                return None
                
        except Exception as e:
            print(f"Error creating scan profile: {e}")
            return None

    def startScan(self, api_id: int, profile_id: int, user_id: str):
        """Start a new scan and save to database"""
        try:
            scan_data = {
                "api_id": api_id,
                "profile_id": profile_id,
                "user_id": user_id,
                "status": "running",
                "started_at": datetime.now().isoformat()
            }
            
            result = db_manager.insert("scans", scan_data)
            scan_id = result["id"] if result else None
            
            if scan_id:
                print(f"Scan started with ID: {scan_id}")
                return scan_id
            else:
                print("Failed to start scan")
                return None
                
        except Exception as e:
            print(f"Error starting scan: {e}")
            return None

    def completeScan(self, scan_id: int, results: dict = None):
        """Mark scan as completed and save results"""
        try:
            # Update scan status
            update_data = {
                "status": "completed",
                "completed_at": datetime.now().isoformat()
            }
            
            db_manager.update("scans", update_data, {"id": scan_id})
            
            # Save results if provided
            if results:
                self.resultManager.add_result(results, scan_id)
            
            print(f"Scan {scan_id} completed successfully")
            return scan_id
            
        except Exception as e:
            print(f"Error completing scan: {e}")
            # Try to mark as failed
            try:
                db_manager.update("scans", {"status": "failed"}, {"id": scan_id})
            except:
                pass
            return None

    def runScan(self, api_id: int, profile_id: int, user_id: str):
        """Run a complete scan with database integration"""
        print("Starting new Scan")
        
        try:
            # Start the scan
            scan_id = self.startScan(api_id, profile_id, user_id)
            if not scan_id:
                return None
            
            # Run the actual tests
            results = {}
            for scanner in self.vulnScanners:
                print("Running API tests")
                scanner_results = scanner.run_tests()
                results.update(scanner_results)
            
            # Complete the scan and save results
            self.completeScan(scan_id, results)
            
            return scan_id
            
        except Exception as e:
            print(f"Error running scan: {e}")
            # Mark scan as failed
            try:
                db_manager.update("scans", {"status": "failed"}, {"id": scan_id})
            except:
                pass
            return None

    def get_scan_status(self, scan_id: int):
        """Get the status of a scan"""
        try:
            scan_data = db_manager.select("scans", filters={"id": scan_id})
            if scan_data:
                return scan_data[0]["status"]
            return None
        except Exception as e:
            print(f"Error getting scan status: {e}")
            return None

    def get_all_scans(self, api_id: int = None):
        """Get all scans, optionally filtered by API"""
        try:
            if api_id:
                scans = db_manager.select("scans", filters={"api_id": api_id})
            else:
                scans = db_manager.select("scans")
            return scans
        except Exception as e:
            print(f"Error retrieving scans: {e}")
            return []

    def get_scan(self, scan_id: int):
        """Get scan details and results"""
        try:
            # Get scan info
            scan_data = db_manager.select("scans", filters={"id": scan_id})
            if not scan_data:
                return None
            
            # Get results
            results = self.resultManager.get_result(scan_id)
            
            return {
                "scan_info": scan_data[0],
                "results": results
            }
        except Exception as e:
            print(f"Error retrieving scan: {e}")
            return None

    def removeScan(self, scan_id: int):
        """Remove a scan and its results"""
        try:
            # Remove results first
            self.resultManager.remove_result(scan_id)
            
            # Remove scan
            deleted = db_manager.delete("scans", {"id": scan_id})
            
            print(f"Removed scan ID: {scan_id}")
            return len(deleted) > 0
            
        except Exception as e:
            print(f"Error removing scan: {e}")
            return False

    def reset_all_flags(self):
        """Reset all endpoint flags"""
        try:
            # Update all endpoints to set authorization to false
            db_manager.update("endpoints", {"authorization": False}, {})
            print("All endpoint flags reset")
        except Exception as e:
            print(f"Error resetting flags: {e}")

    def reset_endpoint_flags(self, endpoint_id: int):
        """Reset flags for a specific endpoint"""
        try:
            db_manager.update("endpoints", {"authorization": False}, {"id": endpoint_id})
            print(f"Flags reset for endpoint ID: {endpoint_id}")
        except Exception as e:
            print(f"Error resetting endpoint flags: {e}")
