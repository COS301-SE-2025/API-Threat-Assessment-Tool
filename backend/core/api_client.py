# Manages a specific api
# Contains an array of Endpoint Objects  
# store api info 
# save and load info from file/db

from enum import Enum
from core.db_manager import db_manager
from core.endpoint import Endpoint
import json
from typing import List, Dict, Any

class Authorization(Enum):
    NONE = "No Authorization Detected."
    SESSION_COOKIE = "Cookie: session={}"
    JWT = "Authorization: Bearer {}"
    OAUTH = "Authorization: Bearer {}"
    BASIC = "Authorization: Basic {}"  # base64(username:password)
    API_AUTH = "Authorization: Token {}"
    API_KEY = "{ApiHeaderName}: {}"
    CUSTOM = "Custom Authorization Scheme"

class APIClient:
    def __init__(self, title, base_url, version):
        self.title = title
        self.base_url = base_url
        self.version = version
        self.endpoints: List[Endpoint] = []
        self.authorization = ""
        self.auth_token = ""
        self.db_id = None  # To store the database ID after saving

    def save_to_db(self, user_id):
        """Save the API and its endpoints to the database"""
        try:
            

            # First, save the API itself
            api_data = {
                "name": self.title,
                "base_url": self.base_url,
                "user_id": user_id,
                "version": self.version,
                "authorization": self.authorization
            }
            
            result = db_manager.insert("apis", api_data)
            
            if not result:
                raise Exception("Failed to save API to database")
            
            self.db_id = result["id"]
            print(f"Saved API with ID: {self.db_id}")
            
            # Now save all endpoints
            endpoint_count = 0
            for endpoint in self.endpoints:
                if endpoint.save_to_db(self.db_id):
                    endpoint_count += 1
            
            print(f"Saved {endpoint_count} endpoints for API {self.title}")
            return True
            
        except Exception as e:
            print(f"Error saving API to database: {e}")
            return False

    @classmethod
    def load_from_db(cls, api_id):
        """Load an API and its endpoints from the database"""
        try:
            
            # Load API data
            api_result = db_manager.select("apis", filters={"id": api_id})
            if not api_result:
                return None
            
            api_data = api_result[0]
            api = cls(api_data["name"], api_data["base_url"], api_data.get("version", ""))
            api.db_id = api_data["id"]
            api.authorization = api_data.get("authorization", "")
            
            # Load endpoints
            endpoints_result = db_manager.select("endpoints", filters={"api_id": api_id})
            for endpoint_data in endpoints_result:
                endpoint = Endpoint.from_db_data(endpoint_data)
                api.endpoints.append(endpoint)
            
            return api
            
        except Exception as e:
            print(f"Error loading API from database: {e}")
            return None

    def delete_from_db(self):
        """Delete the API and its endpoints from the database"""
        if not self.db_id:
            print("API not saved to database yet")
            return False
        
        try:
            
            # Delete endpoints first (due to foreign key constraints)
            db_manager.delete("endpoints", {"api_id": self.db_id})
            
            # Delete the API
            result = db_manager.delete("apis", {"id": self.db_id})
            
            if result:
                print(f"Deleted API {self.title} and its endpoints")
                self.db_id = None
                return True
            return False
            
        except Exception as e:
            print(f"Error deleting API from database: {e}")
            return False
        

    def set_auth_token(self, token):
        self.auth_token = token

    def clear_auth_token(self, token):
        self.auth_token = ""

    def get_auth_header_with_token(self, token):
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
