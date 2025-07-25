import pytest
from unittest.mock import patch, MagicMock
from utils.db import DatabaseManager
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
def db_manager(db_config):
    return DatabaseManager(**db_config)

def test_connect(db_manager):
    with patch('psycopg2.connect') as mock_connect:
        db_manager.connect()
        mock_connect.assert_called_once_with(
            host=db_manager.host,
            database=db_manager.database,
            user=db_manager.username,
            password=db_manager.password
        )

def test_connect_error(db_manager):
    with patch('psycopg2.connect', side_effect=psycopg2.Error('Mocked error')):
        db_manager.connect()
        assert db_manager.connection is None

def test_insert_data(db_manager):
    with patch.object(db_manager, 'connection') as mock_connection:
        mock_cursor = MagicMock()
        mock_connection.cursor.return_value = mock_cursor
        db_manager.insert_data('Test report')
        mock_cursor.execute.assert_called_once_with('INSERT INTO reports (report) VALUES (%s)', ('Test report',))
        mock_connection.commit.assert_called_once()

def test_insert_data_error(db_manager):
    with patch.object(db_manager, 'connection') as mock_connection:
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = psycopg2.Error('Mocked error')
        mock_connection.cursor.return_value = mock_cursor
        db_manager.insert_data('Test report')
        mock_connection.commit.assert_not_called()

def test_fetch_data(db_manager):
    with patch.object(db_manager, 'connection') as mock_connection:
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [('Test report',)]
        mock_connection.cursor.return_value = mock_cursor
        result = db_manager.fetch_data()
        assert result == [('Test report',)]

def test_fetch_data_error(db_manager):
    with patch.object(db_manager, 'connection') as mock_connection:
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = psycopg2.Error('Mocked error')
        mock_connection.cursor.return_value = mock_cursor
        db_manager.fetch_data()
        mock_cursor.fetchall.assert_not_called()

def test_close(db_manager):
    with patch.object(db_manager, 'connection') as mock_connection:
        db_manager.close()
        mock_connection.close.assert_called_once()
        assert db_manager.connection is None