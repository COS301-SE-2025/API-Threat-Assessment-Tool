# Manage your VulnerabilityScanner objects
# Store each VulnerabilityScanner in a dictionare, vulnScanners["profileName"] to access VulnerabilityScanner object
from enum import Enum
from core.result_manager import ResultManager
from core.vulnerability_scanner import VulnerabilityScanner

class ScanProfiles(Enum):
    DEFAULT = "OWASP API Top 10 Full Scan"

class ScanManager:
    def __init__(self, api_client):
        self.vulnScanners = []
        self.resultManager = ResultManager()
        self.APIClient = api_client
        self.scan_profile = ScanProfiles.DEFAULT #force to default 
        self.loaded_profiles = []
    
    def createScan(self, scan_profile):
        for profile in self.loaded_profiles:
            if profile is scan_profile:
                print("Profile already loaded")
                return

        self.loaded_profiles.append(scan_profile)        
        scanner = VulnerabilityScanner(self.APIClient, scan_profile)
        self.vulnScanners.append(scanner)

    def runScan(self, scan_profile):
        id = 0
        print("Starting new Scan")
        try:
            for scanner in self.vulnScanners:
                print("Running api test")
                result = scanner.run_tests()
                id = self.resultManager.add_result(result)
        except Exception as e:
            return str(e)

        return id

    def get_all_scans(self):
        return self.resultManager.get_all_results()

    def get_scan(self, id):
        try:
            return self.resultManager.get_result(id)
        except KeyError:
            return -1

    def reset_all_flags(self):
        print("reset all flags")

    def reset_endpoint_flags(self, endpoint_id):
        print("reset flags for a particular endpoint")

    def removeScan(self):
        return self.resultManager.remove_result(id)
