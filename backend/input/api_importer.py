# Used to create and APICLient object from a given specification file 
# Should be able to infer specification type from file contents

import json
import yaml
from openapi_spec_validator import validate_spec
from core.api_client import APIClient
from core.api_client import Authorization
from core.endpoint import Endpoint

class APIImporter:
    def __init__(self):
        self.filepath = ""
        self.apiType = ""

    def importApi(self):
        print("do something")

    def import_openapi(self, fp):
        print("Importing new openAPI file")
        self.filepath = fp
        if self.filepath.endswith(".json"):
            with open(self.filepath, "r") as f:
                spec = json.load(f)
                print("JSON OpenAPI spec loaded")
        elif self.filepath.endswith(".yaml") or self.filepath.endswith(".yml"):
            with open(self.filepath, "r") as f:
                spec = yaml.safe_load(f)
                print("YAML OpenAPI spec loaded")
        else:
            raise Exception("Unsupported file extension.")

        validate_spec(spec)
        self.apiType = "OpenApi"
        return self._parse_openapi(spec)

    def _parse_openapi(self, spec):
        #https://swagger.io/docs/specification/v3_0/basic-structure/
        info = spec.get("info", {})
        servers = spec.get("servers", [{"url": ""}])
        baseUrl = servers[0]["url"] if servers else ""
        paths = spec.get("paths", {})
        components = spec.get("components", {})


        api_client = APIClient( 
            base_url = baseUrl,
            title = info.get("title", "Untitled API"),
            version = info.get("version", "0.0.1")
        )

        #Add endpoints to api client
        for path, method_dict in paths.items():
            for method, method_info in method_dict.items():
                summary = method_info.get("summary", "")
                parameters = method_info.get("parameters", [])
                request_body = method_info.get("requestBody", {})
                responses = method_info.get("responses", {})
                tags = method_info.get("tags", [])
                operation_security = method_info.get("security", "")

                endpoint = Endpoint(
                    path = path,
                    method = method.upper(),
                    summary = summary,
                    parameters = parameters,
                    request_body = request_body,
                    responses = responses,
                    tags = tags,
                )

                if operation_security == "":
                    endpoint.disable_auth()
                else:
                    endpoint.enable_auth()

                api_client.add_endpoint(endpoint)

        # Set up security
        #https://learn.openapis.org/specification/security.html
        #https://spec.openapis.org/oas/latest.html#security-requirement-object
        
        security_schemes = components.get("securitySchemes", {})
        global_security = spec.get("security", [])

        scheme_map = {
            "apiKey": Authorization.API_KEY,
            "http:basic": Authorization.BASIC,
            "http:bearer": Authorization.JWT,
            "oauth2": Authorization.OAUTH,
            "openIdConnect": Authorization.OAUTH,
        }

        def map_security_scheme(scheme):
            if scheme["type"] == "http":
                key = f"http:{scheme.get('scheme')}"
                return scheme_map.get(key, Authorization.CUSTOM)

            elif scheme["type"] == "apiKey":
                location = scheme.get("in")
                if location == "cookie":
                    return Authorization.SESSION_COOKIE
                elif location == "header":
                    return Authorization.API_KEY
                else:
                    return Authorization.CUSTOM 

            elif scheme["type"] in scheme_map:
                return scheme_map[scheme["type"]]

            return Authorization.CUSTOM


        #default to NONE
        api_client.authorization = Authorization.NONE

        if global_security:
            for sec in global_security:
                for sec_name in sec:
                    scheme = security_schemes.get(sec_name)
                    if scheme:
                        api_client.authorization = map_security_scheme(scheme)
                        break  

        return api_client