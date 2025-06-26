# db management a

import psycopg2

class DatabaseManager:
    def __init__(self, host, database, username, password):
        self.host = host
        self.database = database
        self.username = username
        self.password = password
        self.connection = None

    def connect(self):
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                database=self.database,
                user=self.username,
                password=self.password
            )
        except psycopg2.Error as e:
            print(f"Error connecting to database: {e}")

    def insert_data(self, report):
        try:
            cursor = self.connection.cursor()
            cursor.execute('INSERT INTO reports (report) VALUES (%s)', (report,))
            self.connection.commit()
        except psycopg2.Error as e:
            print(f"Error inserting data: {e}")

    def fetch_data(self):
        try:
            cursor = self.connection.cursor()
            cursor.execute('SELECT * FROM reports')
            return cursor.fetchall()
        except psycopg2.Error as e:
            print(f"Error fetching data: {e}")

    def close(self):
        if self.connection:
            self.connection.close()
            self.connection = None
