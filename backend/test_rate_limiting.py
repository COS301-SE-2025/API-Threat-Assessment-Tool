import requests
import time

def test_rate_limiting(url, threshold):
    # Send a large number of requests to the API endpoint
    for i in range(threshold + 1):
        response = requests.get(url)
        if response.status_code == 429:
            # Rate limiting detected
            print("Rate limiting detected")
            break
        time.sleep(0.1)  # Wait for 100ms between requests
