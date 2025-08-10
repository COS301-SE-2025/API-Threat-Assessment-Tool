# Managae authenticatoin and authorisation a

import jwt
import datetime
from utils.user_manager import UserManager
from utils.secrets import load_secret_key

class Authenticator:
    def __init__(self, db_config):
        self.secret_key = load_secret_key()
        self.user_manager = UserManager(db_config)
        self.user_manager.openDB()
    
    def check_login(self, username, password):
        user = self.user_manager.getUserPermissions(username)
        if user and user[2] == password:
            return True
        return False

    def get_auth_token(self, username):
        payload = {
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1),
            'iat': datetime.datetime.now(datetime.timezone.utc),
            'sub': username
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')

    def refresh_token(self, token):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            new_token = self.get_auth_token(payload['sub'])
            return new_token
        except jwt.ExpiredSignatureError:
            return None

    def apply_auth_headers(self, request):
        token = request.headers.get('Authorization')
        if token:
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                return payload['sub']
            except jwt.ExpiredSignatureError:
                return None
        return None
