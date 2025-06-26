import requests
import sys

def test_backend():
    url = "http://localhost:5252"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("Backend connection test successful!")
            sys.exit(0)
        else:
            print(f"Backend returned status code {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_backend()
