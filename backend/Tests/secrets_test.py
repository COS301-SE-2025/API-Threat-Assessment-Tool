import pytest
from unittest.mock import patch
from utils.secrets import load_secret_key, get_api_keys, validate_env_variables
import os

def test_load_secret_key():
    secret_key = load_secret_key()
    assert secret_key == 'RkjhX5J9xyKaPhK7ovunFHfZSeMoQaP895VGgEK7sEk='

def test_get_api_keys():
    with patch.dict(os.environ, {'API_KEYS': 'test_api_key'}):
        api_keys = get_api_keys()
        assert api_keys == 'test_api_key'

def test_get_api_keys_none():
    with patch.dict(os.environ, {}, clear=True):
        api_keys = get_api_keys()
        assert api_keys is None

def test_validate_env_variables():
    required_keys = ['API_KEYS', 'SECRET_KEY']
    with patch.dict(os.environ, {'API_KEYS': 'test_api_key', 'SECRET_KEY': 'test_secret_key'}):
        validate_env_variables(required_keys)

def test_validate_env_variables_error():
    required_keys = ['API_KEYS', 'SECRET_KEY']
    with patch.dict(os.environ, {'API_KEYS': 'test_api_key'}, clear=True):
        with pytest.raises(ValueError) as e:
            validate_env_variables(required_keys)
        assert str(e.value) == "Missing environment variable: SECRET_KEY"