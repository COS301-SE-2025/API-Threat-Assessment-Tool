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
        self.timestamp = timestamp or datetime.utcnow()
