# Handles all outgoing HTTP requests
# Can set 

class HTTPInterface:
    def __init__(self, host: str, base_path: str):
        self.host = host.rstrip("/")
        self.base_path = base_path.strip("/")
        self.base_url = f"{self.host}/{self.base_path}"
        self.headers = {}
        self.body = {}

    def send_get():
        print("do something")

    def send_post():
        print("do something")

    def send_custom():
        print("do something")

    def add_header(self, key: str, value: str):
        print("do something")

    def update_body(self, body: str):
        print("do something")