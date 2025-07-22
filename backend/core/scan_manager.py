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
        self.scan_profile = ScanProfiles.DEFAULT #force default for now
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
        for scanner in self.vulnScanners:
            if scanner.scanProfile is scan_profile:
                result = scanner.run_tests()
                id = self.resultManager.add_result(result)

        return id

    def get_all_scans(self):
        return self.resultManager.get_all_results()

    def get_scan(self, id):
        return self.resultManager.get_result(id)

    def removeScan(self):
        return self.resultManager.remove_result(id)
