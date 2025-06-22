#file ref: https://swagger.io/docs/specification/v3_0/basic-structure/

import os
from input.api_importer import APIImporter
from core.api_client import APIClient
from extra.colors import Colors 

def yaml_test():
    path = os.path.join(os.path.dirname(__file__), "Files", "OpenAPISimpleTest.yaml")
    importer = APIImporter()
    api_client = importer.import_openapi(path)

    print(f"API Title: {api_client.title}")
    print(f"API Version: {api_client.version}")
    print(f"Base URL: {api_client.base_url}")
    print(f"Found {len(api_client.endpoints)} endpoints:")

    for endpoint in api_client.endpoints:
        print(f" - [{endpoint.method}] {endpoint.path} ({endpoint.summary})")

def json_test():
    path = os.path.join(os.path.dirname(__file__), "Files", "OpenAPISimpleTest.json")
    importer = APIImporter()
    api_client = importer.import_openapi(path)

    print(f"API Title: {api_client.title}")
    print(f"API Version: {api_client.version}")
    print(f"Base URL: {api_client.base_url}")
    print(f"Found {len(api_client.endpoints)} endpoints:")

    for endpoint in api_client.endpoints:
        print(f" - [{endpoint.method}] {endpoint.path} ({endpoint.summary})")

def json_test_path(filename):
    path = os.path.join(os.path.dirname(__file__), "Files", filename)
    importer = APIImporter()
    api_client = importer.import_openapi(path)

    print(f"API Title: {api_client.title}")
    print(f"API Version: {api_client.version}")
    print(f"Base URL: {api_client.base_url}")
    print(f"Found {len(api_client.endpoints)} endpoints:")

    for endpoint in api_client.endpoints:
        print(f" - [{endpoint.method}] {endpoint.path} ({endpoint.summary})")


if __name__ == "__main__":
    print(f"{Colors.GREEN}========================================{Colors.END}")
    print(f"{Colors.LIGHT_BLUE}JSON OpenAPI Import Test{Colors.END}")
    print(f"{Colors.YELLOW}========================================{Colors.END}")
    json_test()
    print(f"{Colors.GREEN}========================================{Colors.END}")

    print(f"{Colors.GREEN}\n\n========================================{Colors.END}")
    print(f"{Colors.LIGHT_BLUE}YAML OpenAPI Import Test{Colors.END}")
    print(f"{Colors.YELLOW}========================================{Colors.END}")
    yaml_test()
    print(f"{Colors.GREEN}========================================{Colors.END}")


    print(f"{Colors.GREEN}\n\n========================================{Colors.END}")
    print(f"{Colors.LIGHT_BLUE}Molehill JSON OpenAPI Import Test{Colors.END}")
    print(f"{Colors.YELLOW}========================================{Colors.END}")
    json_test_path("molehill.json")
    print(f"{Colors.GREEN}========================================{Colors.END}")
