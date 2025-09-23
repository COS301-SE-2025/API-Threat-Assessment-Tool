# ... existing code in endpoint.py ...
import uuid
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
        
        # Generate a unique and persistent hash ID for the endpoint
        self.id = uuid.uuid4().hex
        self.db_id = self.id # db_id is an alias for the persistent hash id

    def to_db_dict(self, api_id: str) -> Dict[str, Any]:
        """Returns the endpoint's data as a dictionary ready for database insertion."""
        endpoint_data = {
            "id": self.id,
            "api_id": api_id,
            "method": self.method,
            "url": self.path,
            "summary": self.summary,
            "description": self.description,
            "requires_auth": self.authorization,
            "tags": ",".join(self.tags) if self.tags else None,
            "category": self.tags[0] if self.tags else "general",
            "parameters": json.dumps(self.parameters) if self.parameters else None,
            "request_body": json.dumps(self.request_body) if self.request_body else None,
            "responses": json.dumps(self.responses) if self.responses else None,
            "flags": [f.value if isinstance(f, Enum) else str(f) for f in self.flags],
            "endpoint_id": self.id,
            "authorization": self.authorization
        }
        # Return a clean dictionary with no None values
        return {k: v for k, v in endpoint_data.items() if v is not None}

    def save_to_db(self, api_id: str) -> bool:
        """Save a single endpoint to the database."""
        try:
            endpoint_data = self.to_db_dict(api_id)
            result = db_manager.insert("endpoints", endpoint_data)
            return bool(result)
        except Exception as e:
            print(f"Error saving single endpoint {self.method} {self.path} to database: {e}")
            return False

    def update_in_db(self, update_data: Dict[str, Any]) -> bool:
        """Update the endpoint's data in the database."""
        if not self.id:
            print("Endpoint has no ID. Cannot update.")
            return False
        try:
            # Convert list of tags to a comma-separated string for the DB.
            if 'tags' in update_data and isinstance(update_data['tags'], list):
                update_data['tags'] = ",".join(update_data['tags'])

            result = db_manager.update("endpoints", update_data, {"id": self.id})
            if result:
                print(f"Updated endpoint {self.method} {self.path} in the database.")
                return True
            print(f"Failed to update endpoint {self.method} {self.path} in the database.")
            return False
        except Exception as e:
            print(f"Error updating endpoint in database: {e}")
            return False

    @classmethod
    def from_db_data(cls, endpoint_data: Dict[str, Any]) -> 'Endpoint':
        """Create an Endpoint instance from database data."""
        parameters = json.loads(endpoint_data["parameters"]) if endpoint_data.get("parameters") else {}
        request_body = json.loads(endpoint_data["request_body"]) if endpoint_data.get("request_body") else {}
        responses = json.loads(endpoint_data["responses"]) if endpoint_data.get("responses") else {}
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
        
        # Overwrite the generated ID with the persistent one from the database
        endpoint.id = endpoint_data["id"]
        endpoint.db_id = endpoint_data["id"]
        endpoint.authorization = endpoint_data.get("authorization", False)
        endpoint.flags = endpoint_data.get("flags", [])
        
        return endpoint

    def delete_from_db(self) -> bool:
        """Delete endpoint from database using its hash ID."""
        if not self.id:
            print("Endpoint has no ID.")
            return False
        
        try:
            result = db_manager.delete("endpoints", {"id": self.id})
            if result:
                return True
            return False
        except Exception as e:
            print(f"Error deleting endpoint from database: {e}")
            return False

    def set_value(self):
        print("do something")

    def get_value(self):
        print("do something")

    def add_tag(self, tag: str):
        if tag and tag not in self.tags:
            self.tags.append(tag)

    def get_tags(self) -> List[str]:
        return self.tags

    def add_flag(self, flag):
        if flag and flag not in self.flags:
            self.flags.append(flag)

    def remove_flag(self, flag):
        if flag and flag in self.flags:
            self.flags.remove(flag)

    def get_flags(self) -> list:
        return self.flags

    def enable_auth(self):
        self.authorization = True

    def disable_auth(self):
        self.authorization = False

    def check_auth(self) -> bool:
        return self.authorization


