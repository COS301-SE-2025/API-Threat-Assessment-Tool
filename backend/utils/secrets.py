#secrets

import os

def load_secret_key():
    return os.environ.get('SECRET_KEY')

def get_api_keys():
    return os.environ.get('API_KEYS')

def validate_env_variables(required_keys):
    for key in required_keys:
        if key not in os.environ:
            raise ValueError(f"Missing environment variable: {key}")

