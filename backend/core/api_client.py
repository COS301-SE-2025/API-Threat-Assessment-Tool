# Manages a specific api
# Contains an array of Endpoint Objects  
# store api info 
# save and load info from file/db

from enum import Enum

class Authorization(Enum):
    NONE = "No Authorization Detected."
    SESSION_COOKIE = "Cookie: session={}"
    JWT = "Authorization: Bearer {}"
    OAUTH = "Authorization: Bearer {}"
    BASIC = "Authorization: Basic {}" # base64(username:password)
    API_AUTH = "Authorization: Token {}"
    API_KEY = "{ApiHeaderName}: {}"
    CUSTOM = "Custom Authorization Scheme"
    

class APIClient:
    def __init__(self, title, base_url, version):
        self.title = title
        self.base_url = base_url 
        self.version = version
        self.endpoints = []
        self.authorization = ""
        self.auth_token = ""

    def set_auth_token(self, token):
        self.auth_token = token

    def clear_auth_token(self, token):
        self.auth_token = ""

    def get_auth_header(self, token):
        return self.authorization.value.format(token)

    def get_auth_header(self):
        return self.authorization.value.format(self.auth_token)

    def add_endpoint(self, endpoint):
        self.endpoints.append(endpoint)

    def get_url(self):
        return self.base_url

    def get_endpoints(self):
        return self.endpoints

    def remove_endpoint():
        print("do something")

    def update_endpoint():
        print("do something")

    def save_api():
        print("do something")

    def load_api():
        print("do something")

    #might remove this later
    def classify_endpoint():
        print("do something")
