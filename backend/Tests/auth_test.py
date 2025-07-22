import pytest
from utils.auth import Authenticator
import jwt
import datetime
from unittest.mock import MagicMock

@pytest.fixture
def authenticator():
    db_config = {
        'host': 'localhost',
        'database': 'mydatabase',
        'username': 'myuser',
        'password': 'mypassword'
    }
    return Authenticator(db_config)

def test_check_login_success(authenticator):
    # Create a test user
    user_manager = authenticator.user_manager
    user_manager.newUser('test_user', 'test_password', '')
    # Test the check_login method
    assert authenticator.check_login('test_user', 'test_password') == True
    # Delete the test user
    user_manager.removeUser('test_user')

def test_check_login_failure(authenticator):
    assert authenticator.check_login('non_existent_user', 'wrong_password') == False

def test_get_auth_token(authenticator):
    # Create a test user
    user_manager = authenticator.user_manager
    user_manager.newUser('test_user', 'test_password', '')
    # Test the get_auth_token method
    token = authenticator.get_auth_token('test_user')
    assert token is not None
    # Delete the test user
    user_manager.removeUser('test_user')

def test_refresh_token(authenticator):
    # Create a test user
    user_manager = authenticator.user_manager
    user_manager.newUser('test_user', 'test_password', '')
    # Test the refresh_token method
    token = authenticator.get_auth_token('test_user')
    new_token = authenticator.refresh_token(token)
    assert new_token is not None
    # Delete the test user
    user_manager.removeUser('test_user')

def test_apply_auth_headers(authenticator):
    # Create a test user
    user_manager = authenticator.user_manager
    user_manager.newUser('test_user', 'test_password', '')
    # Test the apply_auth_headers method
    token = authenticator.get_auth_token('test_user')
    request = MagicMock()
    request.headers.get.return_value = token
    assert authenticator.apply_auth_headers(request) == 'test_user'
    # Delete the test user
    user_manager.removeUser('test_user')

def test_apply_auth_headers_expired_token(authenticator):
    payload = {
        'exp': datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1),
        'iat': datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
        'sub': 'test_user'
    }
    token = jwt.encode(payload, authenticator.secret_key, algorithm='HS256')
    request = MagicMock()
    request.headers.get.return_value = token
    assert authenticator.apply_auth_headers(request) is None

def test_refresh_token_expired_token(authenticator):
    payload = {
        'exp': datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1),
        'iat': datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2),
        'sub': 'test_user'
    }
    token = jwt.encode(payload, authenticator.secret_key, algorithm='HS256')
    assert authenticator.refresh_token(token) is None