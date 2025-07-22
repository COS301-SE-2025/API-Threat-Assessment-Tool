import pytest
import socket
import json

HOST = '127.0.0.1'
PORT = 9011

def send_request(request):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((HOST, PORT))
        s.sendall(json.dumps(request).encode())
        data = b""
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            data += chunk
        return json.loads(data.decode())

def test_import_file():
    request = {"command": "apis.import_file", "data": {"file": "example.yaml"}}
    response = send_request(request)
    assert response["status"] == "success"

def test_get_all_apis():
    request = {"command": "apis.get_all"}
    response = send_request(request)
    assert response["status"] == "success"

def test_create_scan():
    request = {"command": "scan.create", "client_id": "example_client_id"}
    response = send_request(request)
    assert response["status"] == "success"

def test_connection_test():
    request = {"command": "connection.test"}
    response = send_request(request)
    assert response["status"] == "success"