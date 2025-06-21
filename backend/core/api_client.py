# Manages a specific api
# Contains an array of Endpoint Objects  
# store api info 
# save and load info from file/db

class APIClient:
    def __init__(self, title, base_url, version):
        self.title = title
        self.base_url = base_url
        self.version = version
        self.endpoints = []


    def add_endpoint(self, endpoint):
        self.endpoints.append(endpoint)

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

        