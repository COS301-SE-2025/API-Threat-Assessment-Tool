import pytest
from unittest.mock import patch, MagicMock
from utils.user_manager import UserManager
import psycopg2

@pytest.fixture
def db_config():
    return {
        'host': 'localhost',
        'database': 'mydatabase',
        'username': 'myuser',
        'password': 'mypassword'
    }

@pytest.fixture
def user_manager(db_config):
    return UserManager(db_config)

def test_openDB(user_manager):
    user_manager.openDB()
    assert user_manager.db_manager.connection is not None

def test_newUser(user_manager):
    user_manager.openDB()
    user_manager.newUser('test_user', 'test_password', 'test_api_access')
    # You can query the database to check if the user was added successfully

def test_updateUser(user_manager):
    user_manager.openDB()
    user_manager.newUser('test_user', 'test_password', 'test_api_access')
    user_manager.updateUser('test_user', 'new_password', 'new_api_access')
    # You can query the database to check if the user was updated successfully

def test_removeUser(user_manager):
    user_manager.openDB()
    user_manager.newUser('test_user', 'test_password', 'test_api_access')
    user_manager.removeUser('test_user')
    # You can query the database to check if the user was removed successfully

def test_getUserPermissions(user_manager):
    user_manager.openDB()
    user_manager.newUser('test_user', 'test_password', 'test_api_access')
    result = user_manager.getUserPermissions('test_user')
    assert result is not None

def test_close(user_manager):
    user_manager.openDB()
    user_manager.close()
    assert user_manager.db_manager.connection is None