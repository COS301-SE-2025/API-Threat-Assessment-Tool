# Define Request/Response interface a

# utils/query.py

from enum import IntEnum
import json

class HTTPCode(IntEnum):
    SUCCESS = 200
    BAD_REQUEST = 400
    NOT_FOUND = 404
    SERVER_ERROR = 500

# data is a json object 
def response(code: int, data: dict):
    return {
        "code": code,
        "data": data
    }

def success(data: dict):
    return response(HTTPCode.SUCCESS, data)

def bad_request(message: str):
    return response(HTTPCode.BAD_REQUEST, {"message": message})

def not_found(message: str):
    return response(HTTPCode.NOT_FOUND, {"message": message})

def server_error(message: str):
    return response(HTTPCode.SERVER_ERROR, {"message": message})

def connection_test():
    return response(HTTPCode.SUCCESS, {"message": "Connection Established"})

