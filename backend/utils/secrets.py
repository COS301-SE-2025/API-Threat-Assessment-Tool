#secrets a
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), 'skey.env')
load_dotenv(env_path)

def load_secret_key():
    secret_key = 'RkjhX5J9xyKaPhK7ovunFHfZSeMoQaP895VGgEK7sEk='
    print(secret_key)
    return secret_key

def get_api_keys():
    return os.environ.get('API_KEYS')

def validate_env_variables(required_keys):
    for key in required_keys:
        if key not in os.environ:
            raise ValueError(f"Missing environment variable: {key}")

