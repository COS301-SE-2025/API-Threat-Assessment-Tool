# core/owasp_flags.py
from enum import Enum

class OWASP_FLAGS(Enum):
    BOLA = "1. Broken Object Level Authorization"
    BKEN_AUTH = "2. Broken Authentication"
    BOPLA = "3. Broken Object Property Level Authorization"
    URC = "4. Unrestricted Resource Consumption"
    BFLA = "5. Broken Function Level Authorization"
    UABF = "6. Unrestricted Access to Sensitive Business Flows"
    SSRF = "7. Server Side Request Forgery"
    SEC_MISC = "8. Security Misconfiguration"
    IIM = "9. Improper Inventory Management"
    UCAPI = "10. Unsafe Consumption of APIs"
    SKIP = "Don't test this endpoint"

class ENDPOINT_FLAGS(Enum):
    SUCCESS = "Flag Set"
    FAILED = "Failed to set flags for endpoints"