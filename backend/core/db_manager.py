# db_manager.py
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional, Union
import logging
from datetime import datetime

# logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DB_Manager:
    _instance = None
    _supabase: Client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DB_Manager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        try:
            load_dotenv()
            SUPABASE_URL = os.getenv("SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_KEY")
            
            if not SUPABASE_URL or not SUPABASE_KEY:
                raise ValueError("Supabase URL or KEY not found in environment variables")
            
            self._supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase connection established successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    def insert(self, table_name: str, data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Optional[Union[Dict[str, Any], List[Dict[str, Any]]]]:
        """
        Inserts a single record or a list of records into the specified table.
        - If data is a dict, performs a single insert.
        - If data is a list of dicts, performs a bulk insert.
        """
        try:
            result = self._supabase.table(table_name).insert(data).execute()
            
            # For a single insert, Supabase returns a list with one item.
            # For a bulk insert, it returns a list of all inserted items.
            if result.data:
                # If the original data was a single dict, return just that dict.
                if isinstance(data, dict):
                    return result.data[0]
                # If the original data was a list, return the list of results.
                return result.data
            return None
        except Exception as e:
            # Log the table and the type of data that caused the error for better debugging.
            data_type = "single record" if isinstance(data, dict) else "bulk records"
            logger.error(f"Error inserting {data_type} into {table_name}: {e}")
            return None
    
    def select(self, table_name: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        try:
            query = self._supabase.table(table_name).select(columns)
            
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        query = query.in_(key, value)
                    else:
                        query = query.eq(key, value)
            
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Error selecting from {table_name}: {e}")
            return []

    def select_with_filter(self, table_name: str, columns: str = "*", filters: Optional[List[tuple]] = None) -> List[Dict[str, Any]]:
        """
        Selects records with a more flexible list of filters (e.g., for lte, gte).
        Filters should be a list of tuples, e.g., [('column', 'operator', 'value')].
        """
        try:
            query = self._supabase.table(table_name).select(columns)

            if filters:
                for column, operator, value in filters:
                    if operator == 'eq':
                        query = query.eq(column, value)
                    elif operator == 'neq':
                        query = query.neq(column, value)
                    elif operator == 'gt':
                        query = query.gt(column, value)
                    elif operator == 'gte':
                        query = query.gte(column, value)
                    elif operator == 'lt':
                        query = query.lt(column, value)
                    elif operator == 'lte':
                        query = query.lte(column, value)
                    elif operator == 'in':
                        query = query.in_(column, value)
                    else:
                        logger.warning(f"Unsupported filter operator '{operator}' in select_with_filter. Skipping.")

            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Error selecting from {table_name} with custom filters: {e}")
            return []
    
    


    def update(self, table_name: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            query = self._supabase.table(table_name).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Error updating {table_name}: {e}")
            return []

    def delete(self, table_name: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            query = self._supabase.table(table_name).delete()
            
            if not filters:
                # To prevent accidental deletion of a whole table
                logger.warning(f"Attempted to delete from {table_name} with no filters. Aborting.")
                return []

            for key, value in filters.items():
                if isinstance(value, list):
                    # Use 'in_' for list values, essential for bulk deletes
                    query = query.in_(key, value)
                else:
                    # Use 'eq' for single values
                    query = query.eq(key, value)
            
            result = query.execute()
            logger.info(f"Deleted {len(result.data)} record(s) from {table_name}")
            return result.data
        except Exception as e:
            logger.error(f"Error deleting from {table_name}: {e}")
            return []

    def upsert(self, table_name: str, data: Dict[str, Any], on_conflict: str) -> Optional[List[Dict[str, Any]]]:
        """
        Performs an 'upsert' (update or insert) operation.
        If a row with a matching 'on_conflict' column exists, it updates it.
        Otherwise, it inserts a new row.
        """
        try:
            # Supabase's upsert method handles the logic automatically.
            result = self._supabase.table(table_name).upsert(
                data, 
                on_conflict=on_conflict
            ).execute()
            
            if result.data:
                return result.data
            return None
        except Exception as e:
            logger.error(f"Error upserting into {table_name}: {e}")
            return None

    
    def execute_raw(self, query: str) -> List[Dict[str, Any]]:
        try:
            result = self._supabase.rpc('execute_sql', {'query': query}).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error executing raw query: {e}")
            return []

    # Deprecated
    # def backup(self, output_dir: str = "./backups") -> Optional[str]:
    #     """
    #     Creates a PostgreSQL dump backup of the Supabase database.
    #     Returns the path to the backup file if successful.
    #     """
    #     try:
    #         os.makedirs(output_dir, exist_ok=True)
    #         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    #         backup_file = os.path.join(output_dir, f"backup_{timestamp}.sql")

    #         env = os.environ.copy()
    #         env["PGPASSWORD"] = self.db_config["password"]

    #         cmd = [
    #             "pg_dump",
    #             "-h", self.db_config["host"],
    #             "-p", str(self.db_config["port"]),
    #             "-U", self.db_config["user"],
    #             "-d", self.db_config["dbname"],
    #             "-F", "c",  # custom format, compressed
    #             "-f", backup_file
    #         ]

    #         subprocess.run(cmd, check=True, env=env)
    #         logger.info(f"Backup created at {backup_file}")
    #         return backup_file
    #     except Exception as e:
    #         logger.error(f"Backup failed: {e}")
    #         return None


#singleton instance
db_manager = DB_Manager()
