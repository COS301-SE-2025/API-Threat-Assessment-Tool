# user management 
# Make sure user can actually access the api's they're meants to

from utils.db import DatabaseManager

class UserManager:
    def __init__(self, db_config):
        self.db_manager = DatabaseManager(
            host=db_config['host'],
            database=db_config['database'],
            username=db_config['username'],
            password=db_config['password']
        )

    def openDB(self):
        self.db_manager.connect()
        cursor = self.db_manager.connection.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users
            (id SERIAL PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), api_access TEXT)
        ''')
        self.db_manager.connection.commit()

    def newUser(self, username, password, api_access):
        self.db_manager.connect()
        try:
            cursor = self.db_manager.connection.cursor()
            cursor.execute('INSERT INTO users (username, password, api_access) VALUES (%s, %s, %s)', (username, password, api_access))
            self.db_manager.connection.commit()
        except Exception as e:
            print(f"Error creating user: {e}")
        finally:
            self.db_manager.close()

    def updateUser(self, username, password=None, api_access=None):
        self.db_manager.connect()
        try:
            cursor = self.db_manager.connection.cursor()
            if password and api_access:
                cursor.execute('UPDATE users SET password = %s, api_access = %s WHERE username = %s', (password, api_access, username))
            elif password:
                cursor.execute('UPDATE users SET password = %s WHERE username = %s', (password, username))
            elif api_access:
                cursor.execute('UPDATE users SET api_access = %s WHERE username = %s', (api_access, username))
            self.db_manager.connection.commit()
        except Exception as e:
            print(f"Error updating user: {e}")
        finally:
            self.db_manager.close()

    def removeUser(self, username):
        self.db_manager.connect()
        try:
            cursor = self.db_manager.connection.cursor()
            cursor.execute('DELETE FROM users WHERE username = %s', (username,))
            self.db_manager.connection.commit()
        except Exception as e:
            print(f"Error removing user: {e}")
        finally:
            self.db_manager.close()

    def getUserPermissions(self, username):
        self.db_manager.connect()
        try:
            cursor = self.db_manager.connection.cursor()
            cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
            result = cursor.fetchone()
            return result
        except Exception as e:
            print(f"Error getting user permissions: {e}")
        finally:
            self.db_manager.close()

    def close(self):
        self.db_manager.close()

