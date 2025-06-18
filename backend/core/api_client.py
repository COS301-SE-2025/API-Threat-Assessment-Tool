# Manages a specific api
# Contains an array of Endpoint Objects  
# store api info 
# save and load info from file/db

class APIClient:
    def __init__(self, host: str, base_path: str):
        self.host = host.rstrip("/")
        self.base_path = base_path.strip("/")
        self.base_url = f"{self.host}/{self.base_path}"
        self.endpoints = [Endpoints] 
        self.apiSpecType = ""

    def add_endpoint():
        print("do something")

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