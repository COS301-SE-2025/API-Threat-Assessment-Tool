from core.endpoint import Endpoint
from datetime import datetime
import json
import uuid

class ScanResult:
    def __init__(
        self,
        owasp_category: str,         
        vulnerability_name: str,     
        endpoint: Endpoint,
        severity: str,               
        cvss_score: float = None,    
        description: str = "",       
        recommendation: str = "",   
        evidence: dict = None,      # Changed to dict for JSONB
        test_name: str = "",       
        affected_params: dict = None, # Changed to dict for JSONB
        timestamp: datetime = None
    ):
        self.id = uuid.uuid4().hex
        self.owasp_category = owasp_category
        self.vulnerability_name = vulnerability_name
        self.endpoint = endpoint
        self.severity = severity
        self.cvss_score = cvss_score
        self.description = description
        self.recommendation = recommendation
        self.evidence = evidence or {}
        self.test_name = test_name
        self.affected_params = affected_params or {}
        self.timestamp = timestamp or datetime.now()
    
    def to_db_dict(self, scan_id: str) -> dict:
        """Prepares the result data for insertion into the database."""
        return {
            "id": self.id,
            "scan_id": scan_id,
            "endpoint_id": self.endpoint.db_id, # Use the persistent db_id
            "owasp_category": self.owasp_category,
            "vulnerability_name": self.vulnerability_name,
            "severity": self.severity,
            "cvss_score": self.cvss_score,
            "description": self.description,
            "recommendation": self.recommendation,
            "evidence": json.dumps(self.evidence) if self.evidence else None,
            "test_name": self.test_name,
            "affected_params": json.dumps(self.affected_params) if self.affected_params else None,
            "timestamp": self.timestamp.isoformat()
        }

    def to_json(self):
        """Returns a JSON string representation for logging or other uses."""
        data = self.to_db_dict("N/A") # scan_id is not relevant for this representation
        data["endpoint_path"] = self.endpoint.path
        del data["endpoint_id"]
        return json.dumps(data, indent=4)
