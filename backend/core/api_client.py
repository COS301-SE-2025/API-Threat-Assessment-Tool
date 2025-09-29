# Manages a specific api
# Contains an array of Endpoint Objects  
# store api info 
# save and load info from file/db

import uuid
from enum import Enum
from core.db_manager import db_manager
from core.endpoint import Endpoint
import json
from typing import List, Dict, Any, Optional

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
        self.authorization: Optional[Authorization] = None 
        self.auth_token = ""
        self.secondary_auth_token = "" # ADD THIS LINE
        self.db_id: Optional[str] = None  # To store the database ID (hash) after saving

    def save_to_db(self, user_id: str) -> bool:
        """Save the API and its endpoints to the database using a hash ID and bulk inserts."""
        try:
            if not self.db_id:
                self.db_id = uuid.uuid4().hex

            # Step 1: Save the parent API record first.
            api_data = {
                "id": self.db_id,
                "name": self.title,
                "base_url": self.base_url,
                "user_id": user_id,
                "version": self.version,
                "authorization": self.authorization.value if self.authorization else None
            }
            
            api_result = db_manager.insert("apis", api_data)
            if not api_result:
                raise Exception("Failed to save API to database")
            
            print(f"Saved API with ID: {self.db_id}")

            # Step 2: Prepare a list of all endpoint data for bulk insert.
            if not self.endpoints:
                print("API has no endpoints to save.")
                return True

            endpoints_to_save = []
            for endpoint in self.endpoints:
                # Let the endpoint prepare its own data dictionary
                endpoint_data = endpoint.to_db_dict(self.db_id)
                endpoints_to_save.append(endpoint_data)
            
            # Step 3: Perform a single bulk insert for all endpoints.
            endpoints_result = db_manager.insert("endpoints", endpoints_to_save)
            
            if endpoints_result and len(endpoints_result) == len(self.endpoints):
                print(f"Successfully bulk-inserted {len(endpoints_result)} endpoints for API {self.title}")
                return True
            else:
                # This part is crucial for debugging if the bulk insert partially fails or fully fails.
                print(f"Error: Expected to save {len(self.endpoints)} endpoints, but DB returned {len(endpoints_result) if endpoints_result else 0}.")
                # As a fallback, you might consider deleting the API record we just created to avoid orphaned data.
                self.delete_from_db() # Attempt to clean up.
                return False
            
        except Exception as e:
            print(f"Error saving API to database: {e}")
            return False

    def update_in_db(self, update_data: Dict[str, Any]) -> bool:
        """Update the API's data in the database."""
        if not self.db_id:
            print("API has no database ID. Cannot update.")
            return False
        try:
            result = db_manager.update("apis", update_data, {"id": self.db_id})
            if result:
                print(f"Updated API {self.title} in the database.")
                return True
            print(f"Failed to update API {self.title} in the database.")
            return False
        except Exception as e:
            print(f"Error updating API in database: {e}")
            return False

    @classmethod
    def load_from_db(cls, api_id: str) -> Optional['APIClient']:
        """Load an API and its endpoints from the database using its hash ID."""
        try:
            # Load API data
            api_result = db_manager.select("apis", filters={"id": api_id})
            if not api_result:
                print(f"No API found with ID: {api_id}")
                return None
            
            api_data = api_result[0]
            api = cls(api_data["name"], api_data["base_url"], api_data.get("version", ""))
            api.db_id = api_data["id"]

            # Convert authorization string from DB back to Authorization enum
            auth_str = api_data.get("authorization", "")
            if auth_str:
                for auth_enum in Authorization:
                    if auth_enum.value == auth_str:
                        api.authorization = auth_enum
                        break
                if not api.authorization:
                    for auth_enum in Authorization:
                        if auth_enum.value.split('{}')[0] in auth_str:
                            api.authorization = auth_enum
                            break
            
            # Load associated endpoints
            endpoints_result = db_manager.select("endpoints", filters={"api_id": api_id})
            for endpoint_data in endpoints_result:
                endpoint = Endpoint.from_db_data(endpoint_data)
                api.endpoints.append(endpoint)
            
            print(f"Loaded API '{api.title}' with {len(api.endpoints)} endpoints from DB.")
            return api
            
        except Exception as e:
            print(f"Error loading API from database: {e}")
            return None

# In api_client.py
# Replace the existing delete_from_db function with this one.

    def delete_from_db(self) -> bool:
        """
        Delete the API and all its associated data (endpoints, scans, scan_results)
        from the database in the correct order.
        """
        if not self.db_id:
            print("API has no database ID. Cannot delete.")
            return False
        
        try:
            # 1. Find all scans associated with this API
            scans_to_delete = db_manager.select("scans", columns="id", filters={"api_id": self.db_id})
            scan_ids = [scan['id'] for scan in scans_to_delete]

            if scan_ids:
                # 2. Delete all scan_results for those scans
                print(f"Deleting scan results for {len(scan_ids)} scans...")
                db_manager.delete("scan_results", filters={"scan_id": scan_ids})
            
                # 3. Delete all scans for this API
                print(f"Deleting {len(scan_ids)} scans...")
                db_manager.delete("scans", filters={"api_id": self.db_id})

            # 4. Delete all endpoints for this API
            print(f"Deleting endpoints for API {self.db_id}...")
            db_manager.delete("endpoints", filters={"api_id": self.db_id})

            # 5. Finally, delete the API itself
            print(f"Deleting API record {self.db_id}...")
            result = db_manager.delete("apis", filters={"id": self.db_id})
            
            if result:
                print(f"Successfully deleted API {self.title} (ID: {self.db_id}) and all associated data.")
                self.db_id = None
                return True
            else:
                print(f"Failed to delete the main API record for {self.title} from database. It might have been already deleted.")
                return False
            
        except Exception as e:
            print(f"Error during comprehensive API deletion from database: {e}")
            return False


    def set_authorization(self, auth_enum: Authorization):
        self.authorization = auth_enum    

    def set_auth_token(self, token: str):
        self.auth_token = token

    def clear_auth_token(self):
        self.auth_token = ""

    def get_auth_header_with_token(self, token: str) -> str:
        if self.authorization:
            return self.authorization.value.format(token)
        return ""

    def get_auth_header(self) -> str:
        if self.authorization:
            return self.authorization.value.format(self.auth_token)
        return ""

    def add_endpoint(self, endpoint: Endpoint):
        self.endpoints.append(endpoint)

    def get_url(self) -> str:
        return self.base_url

    def get_endpoints(self) -> List[Endpoint]:
        return self.endpoints

    def remove_endpoint(self):
        print("do something")

    def update_endpoint(self):
        print("do something")

    def set_secondary_auth_token(self, token: str):
        self.secondary_auth_token = token

    def get_secondary_auth_header(self) -> str:
        if self.authorization and self.secondary_auth_token:
            return self.authorization.value.format(self.secondary_auth_token)
        return ""
