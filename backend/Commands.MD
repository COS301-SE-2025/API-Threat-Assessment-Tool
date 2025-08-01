### Rehister New User
```json
{

"command": "auth.register",
"data":
    {
        "username": "string",
        "password": "string",
        "email": "string"
    }
}
```
Response:  

- status = 200 if successful  
- data = none  

- status = 400 if not successful  
- data = error message  

Description:  
- Creates a new user

--- 

### Check User Login
```json
{

"command": "auth.login",
"data":
    {
        "username": "string",
        "password": "string"
    }
}
```
Response:  

- status = 200 if successful  
- data = { "user_id": "string" } 

- status = 400 if not successful  
- data = none  

Description:  
- Validates the user's login credentials  

--- 


### Login with Google
```json
{

"command": "auth.google",
"data":
    {
        "token": "string"
    }
}
```
Response:  

- status = 200 if successful  
- data = { "user_id": "string" }  

- status = 400 if not successful  
- data = none  

Description:  
- Logs user in using a Google OAuth token  

--- 


### Logout
```json
{

"command": "auth.logout",
"data": {}
}
```
Response:  

- status = 200 if successful  
- data = none  

Description:  
- Logs the current user out  

--- 


### Dashboard Overview
```json
{

"command": "dashboard.overview",
"data": {}
}
```
Response:  

- status = 200  
- data = { "overview_data": ... }

Description:  
- Returns system-wide overview information for dashboard display  

--- 


### Dashboard Metrics
```json
{

"command": "dashboard.metrics",
"data": {}
}
```
Response:  

- status = 200  
- data = { "metrics": ... }

Description:  
- Returns scan and usage metrics for dashboard  

--- 


### Dashboard Alerts
```json
{

"command": "dashboard.alerts",
"data": {}
}
```
Response:  

- status = 200  
- data = { "alerts": [...] }

Description:  
- Returns alerts such as scan failures or findings  

--- 


### Get All APIs
```json
{

"command": "apis.get_all",
"data": {"user_id": "string"}
}
```
Response:  

- status = 200  
- data = [ { "api_id": "string", "name": "string", ... }, ... ]

Description:  
- Retrieves all APIs managed by the daemon  for a particular user

--- 


### Create API
```json
{

"command": "apis.create",
"data": {
    "name": "string",
    "description": "string",
    "file": "specification file"
}
}
```
Response:  

- status = 200  
- data = { "api_id": "string" }

Description:  
- Creates a new API record  

--- 


### Get API Details
```json
{

"command": "apis.details",
"data": {
    "api_id": "string"
}
}
```
Response:  

- status = 200  
- data = { "name": "string", "endpoints": [...], ... }

Description:  
- Returns metadata and endpoints for a specific API  

--- 


### Update API
```json
{

"command": "apis.update",
"data": {
    "api_id": "string",
    "name": "string",
    "description": "string"
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Updates an existing API's metadata  

--- 


### Delete API
```json
{

"command": "apis.delete",
"data": {
    "api_id": "string"
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Deletes a specific API  

--- 


### Import API from File
```json
{

"command": "apis.import_file",
"data": {
    "file": "file"
}
}
```
Response:  

- status = 200  
- data = { "api_id": "string" }

Description:  
- Loads an OpenAPI specification from a local file  

--- 


### Import API from URL
```json
{

"command": "apis.import_url",
"data": {
    "url": "string"
}
}
```
Response:  

- status = 200  
- data = { "api_id": "string" }

Description:  
- Fetches and loads an OpenAPI specification from a URL  

--- 


### List API Endpoints
```json
{

"command": "endpoints.list",
"data": {
    "api_id": "string"
}
}
```
Response:  

- status = 200  
- data = [ { "id": "string", "path": "string", ... }, ... ]

Description:  
- Returns all endpoints for a given API  

--- 


### Get Endpoint Details
```json
{

"command": "endpoints.details",
"data": {
    "endpoint_id": "string"
}
}
```
Response:  

- status = 200  
- data = { "id": "string", "path": "string", "tags": [...], ... }

Description:  
- Retrieves detailed information about a specific endpoint  

--- 


### Add Endpoint Tags
```json
{

"command": "endpoints.tags.add",
"data": {
    "endpoint_id": "string",
    "tags": ["string", ...]
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Adds tags to an endpoint  

--- 


### Remove Endpoint Tags
```json
{

"command": "endpoints.tags.remove",
"data": {
    "endpoint_id": "string",
    "tags": ["string", ...]
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Removes specific tags from an endpoint  

--- 


### Replace Endpoint Tags
```json
{

"command": "endpoints.tags.replace",
"data": {
    "endpoint_id": "string",
    "tags": ["string", ...]
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Replaces all tags associated with an endpoint  

--- 


### List All Tags
```json
{

"command": "tags.list",
"data": {}
}
```
Response:  

- status = 200  
- data = [ "tag1", "tag2", ... ]

Description:  
- Returns a list of all known tags in the system  

--- 


### Create Scan
```json
{

"command": "scan.create",
"data": {
    "client_id": "string",
    "scan_profile": "string"
    }
}
```
Response:  

- status = 200  
- data = { 
    "scan_id": "string",
    "results_count": number 
    }

Description:  
- Creates a scan for a given API and runs associated vulnerability tests  

--- 


### Get Scan Results
```json
{

"command": "scan.results",
"data": {
    "scan_id": "string"
}
}
```
Response:  

- status = 200  
- data = [ { "endpoint": "string", "result": { ... } }, ... ]

Description:  
- Retrieves the results of a completed scan  

--- 


### Start Scan
```json
{

"command": "scan.start",
"data": {
    "scan_id": "string"
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Starts an existing paused/pending scan  

--- 


### Stop Scan
```json
{

"command": "scan.stop",
"data": {
    "scan_id": "string"
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Stops a running scan  

--- 


### List All Scans
```json
{

"command": "scan.list",
"data": {}
}
```
Response:  

- status = 200  
- data = [ { "scan_id": "string", "status": "running|completed", ... } ]

Description:  
- Lists all scans run or scheduled  

--- 


### List All Templates
```json
{

"command": "templates.list",
"data": {}
}
```
Response:  

- status = 200  
- data = [ { "id": "string", "name": "string", ... } ]

Description:  
- Returns available scan templates  

--- 


### Get Template Details
```json
{

"command": "templates.details",
"data": {
    "template_id": "string"
}
}
```
Response:  

- status = 200  
- data = { "id": "string", "description": "string", ... }

Description:  
- Retrieves full details about a template  

--- 


### Use Template
```json
{

"command": "templates.use",
"data": {
    "template_id": "string",
    "api_id": "string"
}
}
```
Response:  

- status = 200  
- data = { "results_count": number }

Description:  
- Uses a template to run a predefined scan  

--- 


### Get User Profile
```json
{

"command": "user.profile.get",
"data": {}
}
```
Response:  

- status = 200  
- data = { "username": "string", "role": "string", ... }

Description:  
- Retrieves profile data for the logged-in user  

--- 


### Update User Profile
```json
{

"command": "user.profile.update",
"data": {
    "username": "string",
    "email": "string"
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Updates the profile details of the current user  

--- 


### Get User Settings
```json
{

"command": "user.settings.get",
"data": {}
}
```
Response:  

- status = 200  
- data = { "notifications": true, ... }

Description:  
- Gets current user preferences/settings  

--- 


### Update User Settings
```json
{

"command": "user.settings.update",
"data": {
    "notifications": true
}
}
```
Response:  

- status = 200  
- data = none  

Description:  
- Updates the user settings  

--- 


### List All Reports
```json
{

"command": "reports.list",
"data": {}
}
```
Response:  

- status = 200  
- data = [ { "report_id": "string", "date": "string", ... } ]

Description:  
- Lists all vulnerability reports  

--- 


### Get Report Details
```json
{

"command": "reports.details",
"data": {
    "report_id": "string"
}
}
```
Response:  

- status = 200  
- data = { "summary": "string", "findings": [...] }

Description:  
- Gets full contents of a specific report  

--- 


### Download Report
```json
{

"command": "reports.download",
"data": {
    "report_id": "string",
    "report_type": "technical|executive"
}
}
```
Response:  

- status = 200  
- data = { "report": "base64 or text" }

Description:  
- Generates and returns a download of the selected report type  

--- 


### Connection Test
```json
{

"command": "connection.test",
"data": {}
}
```
Response:  

- status = 200  
- data = { "message": "Connection Established" }

Description:  
- Used to test whether the daemon is reachable and responsive  
```