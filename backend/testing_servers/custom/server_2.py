# venv/bin/uvicorn main:app --reload 
# OpenAPI file auto generated at:
    # http://localhost:8000/openapi.json 
from fastapi import FastAPI, HTTPException, Request, Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from fastapi.responses import JSONResponse
import httpx
import asyncio
import time
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import hashlib
import os

app = FastAPI(title="OWASP API Top 10 Testing Server 2", version="1.0.0")

from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="OWASP API Top 10 Testing Server 2",
        version="1.0.0",
        description="A vulnerable API for automated testing of OWASP API Top 10 2023 issues.",
        contact = {"name": " ᗧ···ᗣ···ᗣ···ᗣ···ᗣ·· "},
        routes=app.routes,
    )

    # Merge servers
# In main.py, inside the custom_openapi() function

    # Merge servers
    openapi_schema["servers"] = [
        {
            "url": "http://apithreatassessment.co.za/owasp_test",
            "description": "OWASP Testing server"
        }
    ]

    # Merge into components
    components = openapi_schema.setdefault("components", {})

    # Merge securitySchemes
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }

    # Merge schemas without removing FastAPI's
    schemas = components.setdefault("schemas", {})
    schemas["Error"] = {
        "type": "object",
        "properties": {
            "error": {
                "type": "string"
            }
        }
    }

    openapi_schema["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Simple in-memory data store
users_db = {
    1: {"id": 1, "name": "Alice", "email": "alice@example.com", "role": "user", "ssn": "123-45-6789"},
    2: {"id": 2, "name": "Bob", "email": "bob@example.com", "role": "admin", "ssn": "987-65-4321"},
    3: {"id": 3, "name": "Charlie", "email": "charlie@example.com", "role": "user", "ssn": "555-12-3456"}
}

invoices_db = {
    1: {"id": 1, "user_id": 1, "amount": 100.50, "status": "paid"},
    2: {"id": 2, "user_id": 2, "amount": 250.75, "status": "pending"},
    3: {"id": 3, "user_id": 1, "amount": 75.25, "status": "paid"},
    4: {"id": 4, "user_id": 3, "amount": 150.00, "status": "pending"}
}

products_db = {
    1: {"id": 1, "name": "Laptop", "price": 999.99, "stock": 10},
    2: {"id": 2, "name": "Phone", "price": 599.99, "stock": 25},
    3: {"id": 3, "name": "Tablet", "price": 399.99, "stock": 15}
}

tickets_db = {
    1: {"id": 1, "user_id": 1, "subject": "Login Issue", "content": "Can't access account", "status": "open"},
    2: {"id": 2, "user_id": 2, "subject": "Billing Question", "content": "Wrong charge", "status": "closed"},
    3: {"id": 3, "user_id": 3, "subject": "Feature Request", "content": "Need dark mode", "status": "open"}
}

# Security scheme
security = HTTPBearer()

# Weak JWT secret (SEC_MISC vulnerability)
JWT_SECRET = "weak_secret_123"

# Rate limiting storage
rate_limits = {}

@app.get("/")
def read_root():
    return {"message": "Testing server online"}

# =============================================================================
# 1. BROKEN OBJECT LEVEL AUTHORIZATION (BOLA)
# =============================================================================

@app.get("/api/BOLA/profile/{user_id}", openapi_extra={"security": []})
def get_user_profile(user_id: int):
    """Vulnerable: Can access any user's profile"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.get("/api/BOLA/{user_id}/invoice/{invoice_id}", openapi_extra={"security": []})
def get_user_invoice(user_id: int, invoice_id: int):
    """Vulnerable: No check if invoice belongs to user"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoices_db[invoice_id]

@app.get("/api/BOLA/purchase", openapi_extra={"security": []})
def get_purchase(product: int, user: int):
    """Vulnerable: Any user can access any purchase"""
    if product not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"user_id": user, "product": products_db[product], "purchase_date": "2023-01-01"}

@app.get("/api/BOLA/ticket", openapi_extra={"security": []})
def get_ticket(id: int):
    """Vulnerable: Direct object reference without authorization"""
    if id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return tickets_db[id]

# =============================================================================
# 2. BROKEN AUTHENTICATION (BKEN_AUTH)
# =============================================================================

@app.post("/api/BKEN_AUTH/login", openapi_extra={"security": []})
def login(username: str, password: str):
    """Vulnerable: Weak authentication, no rate limiting"""
    # Accept any username/password combination
    if len(username) > 0 and len(password) > 0:
        # Generate weak JWT token
        token = jwt.encode({"user": username, "exp": datetime.utcnow() + timedelta(hours=24)}, JWT_SECRET, algorithm="HS256")
        return {"token": token, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/BKEN_AUTH/reset-password", openapi_extra={"security": []})
def reset_password(email: str):
    """Vulnerable: No verification, accepts any email"""
    return {"message": f"Password reset link sent to {email}", "reset_token": "predictable_token_123"}

@app.post("/api/BKEN_AUTH/verify-token", openapi_extra={"security": []})
def verify_token(token: str):
    """Vulnerable: Accepts weak tokens"""
    if token == "predictable_token_123":
        return {"valid": True, "user_id": 1}
    return {"valid": False}

@app.get("/api/BKEN_AUTH/session/{session_id}", openapi_extra={"security": []})
def get_session(session_id: str):
    """Vulnerable: Predictable session IDs"""
    if session_id.isdigit():
        return {"session_id": session_id, "user_id": int(session_id), "active": True}
    return {"error": "Invalid session"}

app.get("/api/BKEN_AUTH/admin/info", openapi_extra={"security": []})
def get_admin_info():
    """Vulnerable endpoint - no authentication at all"""
    return {"message": "Sensitive admin information"}

# =============================================================================
# 3. BROKEN OBJECT PROPERTY LEVEL AUTHORIZATION (BOPLA)
# =============================================================================

@app.get("/api/BOPLA/user/{user_id}", openapi_extra={"security": []})
def get_user_details(user_id: int):
    """Vulnerable: Returns sensitive data like SSN"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]  # Returns SSN and other sensitive data

@app.patch("/api/BOPLA/user/{user_id}", openapi_extra={"security": []})
def update_user(user_id: int, data: Dict[str, Any]):
    """Vulnerable: Allows updating any property including role"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update any field provided, including sensitive ones
    for key, value in data.items():
        users_db[user_id][key] = value
    
    return users_db[user_id]

@app.get("/api/BOPLA/invoice/{invoice_id}/details", openapi_extra={"security": []})
def get_invoice_details(invoice_id: int):
    """Vulnerable: Returns internal fields"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice = invoices_db[invoice_id].copy()
    invoice["internal_notes"] = "Customer complained about service"
    invoice["profit_margin"] = 0.65
    return invoice

# =============================================================================
# 4. UNRESTRICTED RESOURCE CONSUMPTION (URC)
# =============================================================================

@app.get("/api/URC/search")
def search_products(query: str = Query(..., max_length=None)):
    """Vulnerable: No limits on query length or results"""
    # Simulate expensive operation
    time.sleep(0.1)  # Simulate database query
    results = []
    for i in range(1000):  # Return large dataset
        results.append({"id": i, "name": f"Product {i}", "description": query * 100})
    return results

@app.post("/api/URC/upload")
def upload_file(file_size: int):
    """Vulnerable: No file size limits"""
    # Simulate file processing
    data = "x" * min(file_size, 1000000)  # Limit for demo purposes
    return {"message": f"File of size {file_size} uploaded", "processed": len(data)}

@app.get("/api/URC/export/{format}")
def export_data(format: str, limit: int = Query(None)):
    """Vulnerable: No limits on export size"""
    if limit is None:
        limit = 10000  # Default large export
    
    data = []
    for i in range(limit):
        data.append({"id": i, "data": f"Record {i}" * 10})
    
    return {"format": format, "records": data, "total": len(data)}

# =============================================================================
# 5. BROKEN FUNCTION LEVEL AUTHORIZATION (BFLA)
# =============================================================================

@app.get("/api/BFLA/admin/users")
def get_all_users():
    """Vulnerable: No admin check"""
    return list(users_db.values())

@app.delete("/api/BFLA/admin/user/{user_id}")
def delete_user(user_id: int):
    """Vulnerable: Anyone can delete users"""
    if user_id in users_db:
        del users_db[user_id]
        return {"message": f"User {user_id} deleted"}
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/api/BFLA/admin/promote/{user_id}")
def promote_user(user_id: int):
    """Vulnerable: No authorization check for promotion"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    users_db[user_id]["role"] = "admin"
    return {"message": f"User {user_id} promoted to admin"}

@app.get("/api/BFLA/internal/config")
def get_internal_config():
    """Vulnerable: Internal endpoint accessible to all"""
    return {
        "database_url": "postgresql://user:pass@internal-db:5432/prod",
        "api_keys": ["secret_key_123", "another_secret_456"],
        "debug_mode": True
    }

# =============================================================================
# 6. UNRESTRICTED ACCESS TO SENSITIVE BUSINESS FLOWS (UABF)
# =============================================================================

@app.post("/api/UABF/purchase/{product_id}")
def purchase_product(product_id: int, user_id: int):
    """Vulnerable: No rate limiting or captcha on purchases"""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # No checks for rapid purchases
    return {
        "purchase_id": f"{user_id}_{product_id}_{int(time.time())}",
        "product": products_db[product_id],
        "user_id": user_id,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/UABF/transfer")
def transfer_funds(from_user: int, to_user: int, amount: float):
    """Vulnerable: No rate limiting on transfers"""
    return {
        "transfer_id": f"txn_{int(time.time())}",
        "from_user": from_user,
        "to_user": to_user,
        "amount": amount,
        "status": "completed"
    }

@app.post("/api/UABF/review/{product_id}")
def submit_review(product_id: int, user_id: int, rating: int, comment: str):
    """Vulnerable: No rate limiting on reviews"""
    return {
        "review_id": f"rev_{user_id}_{product_id}_{int(time.time())}",
        "product_id": product_id,
        "user_id": user_id,
        "rating": rating,
        "comment": comment
    }

# =============================================================================
# 7. SERVER SIDE REQUEST FORGERY (SSRF)
# =============================================================================

@app.get("/api/SSRF/fetch")
async def fetch_url(url: str):
    """Vulnerable: No URL validation"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            return {"url": url, "status": response.status_code, "content": response.text[:500]}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/SSRF/webhook")
async def webhook_callback(callback_url: str, data: Dict[str, Any]):
    """Vulnerable: Accepts any callback URL"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(callback_url, json=data, timeout=5.0)
            return {"callback_url": callback_url, "status": response.status_code}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/SSRF/proxy/{path:path}")
async def proxy_request(path: str):
    """Vulnerable: Acts as an open proxy"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://internal-service/{path}", timeout=5.0)
            return {"path": path, "response": response.text[:500]}
    except Exception as e:
        return {"error": str(e)}

# =============================================================================
# 8. SECURITY MISCONFIGURATION (SEC_MISC)
# =============================================================================

@app.get("/api/SEC_MISC/debug")
def debug_info():
    """Vulnerable: Exposes debug information"""
    return {
        "environment": "production",
        "debug_mode": True,
        "database_url": "postgresql://user:password@localhost/prod",
        "secret_key": JWT_SECRET,
        "version": "1.0.0-beta",
        "server_info": os.uname()._asdict() if hasattr(os, 'uname') else "unknown"
    }

@app.get("/api/SEC_MISC/config")
def get_config():
    """Vulnerable: Exposes configuration"""
    return {
        "cors_origins": ["*"],
        "allowed_hosts": ["*"],
        "csrf_protection": False,
        "ssl_verify": False,
        "log_level": "DEBUG"
    }

@app.get("/api/SEC_MISC/logs")
def get_logs():
    """Vulnerable: Exposes application logs"""
    return {
        "logs": [
            "2023-01-01 10:00:00 - User alice logged in from 192.168.1.100",
            "2023-01-01 10:05:00 - Database query: SELECT * FROM users WHERE password='plaintext123'",
            "2023-01-01 10:10:00 - API key used: sk-1234567890abcdef",
            "2023-01-01 10:15:00 - Error: Database connection failed - password incorrect"
        ]
    }

@app.get("/api/SEC_MISC/headers")
def test_headers(request: Request):
    """Vulnerable: No security headers"""
    return {"headers": dict(request.headers)}

# =============================================================================
# 9. IMPROPER INVENTORY MANAGEMENT (IIM)
# =============================================================================

@app.get("/api/IIM/v1/users")
def get_users_v1():
    """Vulnerable: Old API version still accessible"""
    return {"version": "1.0", "users": [{"id": 1, "name": "Alice", "password": "plaintext123"}]}

@app.get("/api/IIM/v2/users")
def get_users_v2():
    """Current API version"""
    return {"version": "2.0", "users": [{"id": 1, "name": "Alice"}]}

@app.get("/api/IIM/beta/experimental")
def experimental_endpoint():
    """Vulnerable: Beta endpoint in production"""
    return {
        "status": "experimental",
        "data": {"secret": "this_should_not_be_in_prod"},
        "warning": "This endpoint is for testing only"
    }

@app.get("/api/IIM/deprecated/auth")
def deprecated_auth():
    """Vulnerable: Deprecated but still functional"""
    return {"message": "This endpoint is deprecated but still works", "auth_bypass": True}

# =============================================================================
# 10. UNSAFE CONSUMPTION OF APIs (UCAPI)
# =============================================================================

@app.post("/api/UCAPI/process-data")
def process_external_data(external_api_url: str):
    """Vulnerable: Processes external API data without validation"""
    try:
        # Simulate fetching from external API
        fake_external_data = {
            "user_id": "'; DROP TABLE users; --",
            "amount": 99999999,
            "metadata": {"xss": "<script>alert('xss')</script>"}
        }
        
        # Process without validation
        processed_data = {
            "external_source": external_api_url,
            "processed_at": datetime.now().isoformat(),
            "data": fake_external_data
        }
        
        return processed_data
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/UCAPI/integrate/{service}")
def integrate_service(service: str, api_response: Dict[str, Any]):
    """Vulnerable: Trusts external service responses"""
    # Directly process external API response without validation
    if "user_data" in api_response:
        # Simulate storing user data from external service
        user_data = api_response["user_data"]
        return {
            "service": service,
            "integration_status": "success",
            "processed_user": user_data,
            "message": f"User {user_data.get('name', 'unknown')} integrated from {service}"
        }
    
    return {"error": "Invalid response format"}

@app.get("/api/UCAPI/aggregate/{source}")
def aggregate_data(source: str, timeout: int = 30):
    """Vulnerable: No timeout limits on external calls"""
    # Simulate long-running external API call
    time.sleep(min(timeout, 5))  # Limit for demo
    return {
        "source": source,
        "aggregated_data": [{"id": i, "value": f"data_{i}"} for i in range(100)],
        "timeout_used": timeout
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9002)
