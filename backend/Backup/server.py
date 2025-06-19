from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import random

app = FastAPI()

class ScanRequest(BaseModel):
    target_url: str

@app.get("/")
def health_check():
    return {"message": "Scanning engine is running."}

@app.post("/scan")
def start_scan(scan_request: ScanRequest):
    # Mock scan logic
    return {
        "status": "Scan initiated",
        "target": scan_request.target_url,
        "scan_id": "scan-" + str(random.randint(1000, 9999)),
        "started_at": datetime.now().isoformat()
    }

@app.get("/results/{scan_id}")
def get_results(scan_id: str):
    # Return mock vulnerabilities
    return {
        "scan_id": scan_id,
        "vulnerabilities": [
            {"type": "SQL Injection", "risk": "High", "endpoint": "/login"},
            {"type": "Broken Auth", "risk": "Medium", "endpoint": "/users/me"}
        ],
        "completed": True
    }

@app.get("/status/{scan_id}")
def get_status(scan_id: str):
    return {
        "scan_id": scan_id,
        "status": "In Progress",
        "progress": f"{random.randint(10, 90)}%"
    }
