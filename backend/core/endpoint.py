# Individual Endpoint definitions of the api we're scanning  
# Probably need more variables, research api specification docs to get all common ones
import hashlib
import json
from typing import List, Dict, Any
from core.db_manager import db_manager

class Endpoint:
    def __init__(self, path, method, summary, parameters, request_body, responses, tags, description=""):
        self.path = path
        self.method = method
        self.summary = summary
        self.parameters = parameters
        self.request_body = request_body
        self.responses = responses
        self.tags = tags or []
        self.description = description
        self.flags = []
        self.authorization = False
        self.db_id = None

        # Generate unique ID
        unique_str = f"{method}:{path}"
        self.id = hashlib.md5(unique_str.encode()).hexdigest()

    def save_to_db(self, api_id):
        """Save endpoint to database"""
        try:
            
            
            endpoint_data = {
                "api_id": api_id,
                "method": self.method,
                "url": self.path,
                "requires_auth": self.authorization,
                "tags": ",".join(self.tags) if isinstance(self.tags, list) else self.tags,
                "category": self.tags[0] if self.tags else "general",  # Use first tag as category
                "summary": self.summary,
                "parameters": json.dumps(self.parameters) if self.parameters else None,
                "request_body": json.dumps(self.request_body) if self.request_body else None,
                "responses": json.dumps(self.responses) if self.responses else None,
                "flags": self.flags,
                "endpoint_id": self.id,
                "authorization": self.authorization
            }
            
            # Remove None values to avoid database errors
            endpoint_data = {k: v for k, v in endpoint_data.items() if v is not None}
            
            result = db_manager.insert("endpoints", endpoint_data)
            
            if result:
                self.db_id = result["id"]
                return True
            return False
            
        except Exception as e:
            print(f"Error saving endpoint {self.method} {self.path} to database: {e}")
            return False

    @classmethod
    def from_db_data(cls, endpoint_data):
        """Create an Endpoint instance from database data"""
        # Parse JSON fields
        parameters = json.loads(endpoint_data["parameters"]) if endpoint_data.get("parameters") else {}
        request_body = json.loads(endpoint_data["request_body"]) if endpoint_data.get("request_body") else {}
        responses = json.loads(endpoint_data["responses"]) if endpoint_data.get("responses") else {}
        
        # Parse tags (stored as comma-separated string in DB)
        tags = endpoint_data.get("tags", "").split(",") if endpoint_data.get("tags") else []
        
        endpoint = cls(
            path=endpoint_data["url"],
            method=endpoint_data["method"],
            summary=endpoint_data.get("summary", ""),
            parameters=parameters,
            request_body=request_body,
            responses=responses,
            tags=tags,
            description=endpoint_data.get("description", "")
        )
        
        endpoint.db_id = endpoint_data["id"]
        endpoint.authorization = endpoint_data.get("authorization", False)
        endpoint.flags = endpoint_data.get("flags", [])
        
        return endpoint

    def delete_from_db(self):
        """Delete endpoint from database"""
        if not self.db_id:
            print("Endpoint not saved to database yet")
            return False
        
        try:
            
            result = db_manager.delete("endpoints", {"id": self.db_id})
            if result:
                self.db_id = None
                return True
            return False
            
        except Exception as e:
            print(f"Error deleting endpoint from database: {e}")
            return False

    def set_value(self):
        print("do something")

    def get_value(self):
        print("do something")

    def add_tag(self, tag):
        if tag and tag not in self.tags:
            self.tags.append(tag)

    def get_tags(self):
        return self.tags

    def add_flag(self, flag):
        if flag and flag not in self.flags:
            self.flags.append(flag)

    def remove_flag(self, flag):
        if flag and flag in self.flags:
            self.flags.remove(flag)

    def get_flags(self):
        return self.flags

    def enable_auth(self):
        self.authorization = True

    def disable_auth(self):
        self.authorization = False

    def check_auth(self):
        return self.authorization