# Used to create and APICLient object from a given specification file 
# Should be able to infer specification type from file contents

import json
import yaml
from openapi_spec_validator import validate_spec
from core.api_client import APIClient
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

        api_client = APIClient( 
            base_url = baseUrl,
            title = info.get("title", "Untitled API"),
            version = info.get("version", "0.0.1")
        )

        for path, method_dict in paths.items():
            for method, method_info in method_dict.items():
                summary = method_info.get("summary", "")
                parameters = method_info.get("parameters", [])
                request_body = method_info.get("requestBody", {})
                responses = method_info.get("responses", {})
                tags = method_info.get("tags", [])

                endpoint = Endpoint(
                    path = path,
                    method = method.upper(),
                    summary = summary,
                    parameters = parameters,
                    request_body = request_body,
                    responses = responses,
                    tags = tags,
                )

                api_client.add_endpoint(endpoint)

        return api_client
