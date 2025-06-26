import requests
import sqlmap

def test_sql_injection(url, payloads):
    for payload in payloads:
        response = requests.get(url, params={'query': payload})
        if response.status_code != 200:
            # Potential SQL injection vulnerability detected
            print(f"Potential SQL injection vulnerability detected: {payload}")
