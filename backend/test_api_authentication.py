import requests

def test_api_authentication(url, auth_credentials):
    # Send request without authentication credentials
    response = requests.get(url)
    assert response.status_code == 401

    # Send request with authentication credentials
    headers = {'Authorization': f'Bearer {auth_credentials}'}
    response = requests.get(url, headers=headers)
    assert response.status_code == 200

    if __name__ == "__main__":
        url = "https://example.com/api/endpoint"  # Replace with the URL you want to test
        auth_credentials = "your_auth_token"  # Replace with your authentication token
        test_api_authentication(url, auth_credentials)
        print("API authentication test successful")

