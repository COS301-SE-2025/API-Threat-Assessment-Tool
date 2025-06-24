# Managae authenticatoin and authorisation a

import jwt
import datetime
from utils.user_manager import UserManager

secret_key = "your_secret_key_here"

def checkLogin(username, password):
    user_manager = UserManager('localhost', 'mydatabase', 'myuser', 'mypassword')
    user = user_manager.getUserPermissions(username)
    if user and user[0][1] == password:
        return True
    return False

def get_auth_token(username):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': username
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')

def refresh_token(token):
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        new_token = get_auth_token(payload['sub'])
        return new_token
    except jwt.ExpiredSignatureError:
        return None

def apply_auth_headers(request):
    token = request.headers.get('Authorization')
    if token:
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload['sub']
        except jwt.ExpiredSignatureError:
            return None
    return None

