import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Scanning engine is running."

def test_start_scan():
    response = client.post("/scan", json={"target_url": "http://example.com"})
    assert response.status_code == 200
    json = response.json()
    assert json["status"] == "Scan initiated"
    assert json["target"] == "http://example.com"
    assert "scan_id" in json

def test_get_results():
    response = client.get("/results/mock-scan-id")
    assert response.status_code == 200
    json = response.json()
    assert json["scan_id"] == "mock-scan-id"
    assert "vulnerabilities" in json
    assert isinstance(json["vulnerabilities"], list)

def test_get_status():
    response = client.get("/status/mock-scan-id")
    assert response.status_code == 200
    json = response.json()
    assert json["scan_id"] == "mock-scan-id"
    assert "status" in json
    assert "progress" in json
