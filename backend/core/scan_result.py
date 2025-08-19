from core.endpoint import Endpoint
from datetime import datetime
import json

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
        evidence: str = "",         
        test_name: str = "",       
        affected_params: list = None,
        timestamp: datetime = None
    ):
        self.owasp_category = owasp_category
        self.vulnerability_name = vulnerability_name
        self.endpoint = endpoint
        self.severity = severity
        self.cvss_score = cvss_score
        self.description = description
        self.recommendation = recommendation
        self.evidence = evidence
        self.test_name = test_name
        self.affected_params = affected_params or []
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self):
        return {
            "owasp_category": self.owasp_category,
            "vulnerability_name": self.vulnerability_name,
            "endpoint": self.endpoint.to_dict() if hasattr(self.endpoint, "to_dict") else str(self.endpoint),
            "severity": self.severity,
            "cvss_score": self.cvss_score,
            "description": self.description,
            "recommendation": self.recommendation,
            "evidence": self.evidence,
            "test_name": self.test_name,
            "affected_params": self.affected_params,
            "timestamp": self.timestamp.isoformat()
        }

    def to_json(self):
        return json.dumps(self.to_dict(), indent=4)
