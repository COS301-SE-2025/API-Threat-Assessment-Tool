# Handles all outgoing HTTP requests
# Allows you to send and customize http requests

import requests
import json
import xml.etree.ElementTree as ET
from urllib.parse import urljoin

class HTTPInterface:
    def __init__(self, host, base_path=""):
        self.host = host.rstrip('/')
        self.base_path = base_path.lstrip('/')
        self.base_url = urljoin(self.host + '/', self.base_path)
        self.headers = {}
        self.body = None
        self.session = requests.Session()
        self.auto_format = True

    def enable_auto_format(self):
        self.auto_format = True

    def disable_auto_format(self):
        self.auto_format = False

    def add_header(self, key, value):
        self.headers[key] = value

    def add_header(self, header):
        header_split = header.split(':')
        header_key = header_split[0].strip()
        header_value = header_split[1].strip()
        self.headers[header_key] = header_value

    def remove_header(self, key):
        self.headers.pop(key, None)

    def reset_headers(self):
        self.headers.clear()

    def set_body(self, body):
        self.body = body

    def clear_body(self):
        self.body = None

    def _is_valid_json(self, body):
        try:
            json.loads(body)
            return True
        except Exception:
            return False

    def _is_valid_xml(self, body):
        try:
            ET.fromstring(body)
            return True
        except Exception:
            return False

    def _transform_body(self, content_type):
        if self.body is None:
            return None

        content_type = content_type.lower()

        if 'application/json' in content_type:
            if self.auto_format and isinstance(self.body, (dict, list)):
                return json.dumps(self.body)
            if not self.auto_format:
                if isinstance(self.body, str) and self._is_valid_json(self.body):
                    return self.body
                raise ValueError("Invalid JSON body for Content-Type application/json")

        elif 'application/xml' in content_type or 'text/xml' in content_type:
            if isinstance(self.body, str) and self._is_valid_xml(self.body):
                return self.body
            raise ValueError("Invalid XML body for Content-Type application/xml")

        elif 'application/x-www-form-urlencoded' in content_type:
            if isinstance(self.body, dict):
                return self.body
            raise ValueError("Body must be a dict for Content-Type application/x-www-form-urlencoded")

        return self.body

    def send_get(self, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        return self.session.get(url, headers=self.headers, params=params)

    def send_post(self, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        content_type = self.headers.get('Content-Type', '')
        body = self._transform_body(content_type)
        return self.session.post(url, headers=self.headers, params=params, data=body)

    def send_put(self, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        content_type = self.headers.get('Content-Type', '')
        body = self._transform_body(content_type)
        return self.session.put(url, headers=self.headers, params=params, data=body)

    def send_patch(self, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        content_type = self.headers.get('Content-Type', '')
        body = self._transform_body(content_type)
        return self.session.patch(url, headers=self.headers, params=params, data=body)

    def send_delete(self, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        content_type = self.headers.get('Content-Type', '')
        body = self._transform_body(content_type)
        return self.session.delete(url, headers=self.headers, params=params, data=body)

    def send_custom(self, method, endpoint, params=None):
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        content_type = self.headers.get('Content-Type', '')
        body = self._transform_body(content_type)
        return self.session.request(method.upper(), url, headers=self.headers, params=params, data=body)
