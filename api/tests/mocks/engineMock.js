const net = require('net');

/**
 * MockEngine - Clean version without syntax errors
 * 
 * Simulates the Python backend behavior for testing
 */
class MockEngine {
  constructor(port = 9012) {
    this.port = port;
    this.server = null;
    this.isRunning = false;
    this.errorMode = false;
    
    // Reset to initial state
    this.reset();
  }

  /**
   * Reset engine to initial state
   */
  reset() {
    this.CLIENT_STORE = {};
    this.API_METADATA = {};
    this.GLOBAL_API_CLIENT = null;
    this.GLOBAL_CLIENT_ID = null;
    this.GLOBAL_SCAN_MANAGER = null;
    this.scans = {};
    this.scanCounter = 1;
    this.hasImportedApi = false;
  }

  /**
   * Toggle error mode for testing
   */
  setErrorMode(enabled) {
    this.errorMode = enabled;
  }

  /**
   * Start the mock engine server
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        let data = '';

        socket.on('data', (chunk) => {
          data += chunk.toString();

          try {
            const request = JSON.parse(data);
            console.log(`Mock Engine received: ${request.command}`);
            
            const response = this.handleRequest(request);
            console.log(`Mock Engine responding with code: ${response.code}`);
            
            socket.write(JSON.stringify(response));
            socket.end();
          } catch (err) {
            if (err instanceof SyntaxError) {
              return; // Incomplete JSON, continue reading
            }
            
            console.error('Mock Engine error:', err);
            const errorResponse = this.createServerErrorResponse(err.message);
            
            try {
              socket.write(JSON.stringify(errorResponse));
              socket.end();
            } catch (writeErr) {
              console.error('Failed to write error response:', writeErr);
              socket.destroy();
            }
          }
        });

        socket.on('error', (err) => {
          console.error('Mock Engine socket error:', err);
        });
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        console.log(`Mock Engine listening on port ${this.port}`);
        this.isRunning = true;
        resolve();
      });

      this.server.on('error', (err) => {
        console.error('Mock Engine server error:', err);
        reject(err);
      });
    });
  }

  /**
   * Stop the mock engine server
   */
  async stop() {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Mock Engine stopped');
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * Create response objects
   */
  createSuccessResponse(data = null) {
    return { code: 200, data: data };
  }

  createBadRequestResponse(message) {
    return { code: 400, data: message };
  }

  createNotFoundResponse(message) {
    return { code: 404, data: message };
  }

  createServerErrorResponse(message) {
    return { code: 500, data: message };
  }

  /**
   * Main request handler
   */
  handleRequest(request) {
    try {
      if (this.errorMode) {
        return this.createServerErrorResponse('Mock Engine: Simulated internal error');
      }

      const { command, data = {} } = request;

      switch (command) {
        case 'connection.test':
          return this.handleConnectionTest(data);
        case 'apis.import_file':
          return this.handleImportFile(data);
        case 'apis.get_all':
          return this.handleGetAllApis(data);
        case 'apis.details':
          return this.handleGetApiDetails(data);
        case 'apis.update':
          return this.handleUpdateApi(data);
        case 'apis.delete':
          return this.handleDeleteApi(data);
        case 'apis.key.set':
          return this.handleSetApiKey(data);
        case 'endpoints.list':
          return this.handleListEndpoints(data);
        case 'endpoints.details':
          return this.handleEndpointDetails(data);
        case 'endpoints.tags.add':
          return this.handleAddTags(data);
        case 'endpoints.tags.remove':
          return this.handleRemoveTags(data);
        case 'endpoints.tags.replace':
          return this.handleReplaceTags(data);
        case 'endpoints.flags.add':
          return this.handleAddFlags(data);
        case 'endpoints.flags.remove':
          return this.handleRemoveFlags(data);
        case 'tags.list':
          return this.handleListTags(data);
        case 'scan.create':
          return this.handleCreateScan(data);
        case 'scan.start':
          return this.handleStartScan(data);
        case 'scan.progress':
          return this.handleScanProgress(data);
        case 'scan.stop':
          return this.handleStopScan(data);
        case 'scan.results':
          return this.handleScanResults(data);
        case 'scan.list':
          return this.handleListScans(data);
        
        // Unimplemented endpoints
        case 'auth.register':
        case 'auth.login':
        case 'auth.google':
        case 'auth.logout':
        case 'dashboard.overview':
        case 'dashboard.metrics':
        case 'dashboard.alerts':
        case 'apis.create':
        case 'apis.import_url':
        case 'templates.list':
        case 'templates.details':
        case 'templates.use':
        case 'user.profile.get':
        case 'user.profile.update':
        case 'user.settings.get':
        case 'user.settings.update':
        case 'reports.list':
        case 'reports.details':
        case 'reports.download':
          return this.createServerErrorResponse('Not yet implemented');
        
        default:
          return this.createBadRequestResponse(`Unknown command '${command}'`);
      }
    } catch (error) {
      console.error('Mock Engine error handling request:', error);
      return this.createServerErrorResponse(`Mock Engine error: ${error.message}`);
    }
  }

  /**
   * Connection test handler
   */
  handleConnectionTest(data) {
    return this.createSuccessResponse({
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Import file handler
   */
  handleImportFile(data) {
    const { file } = data;
    if (!file) {
      return this.createBadRequestResponse("Missing 'file' field in request data");
    }

    try {
      const clientId = `mock_client_${Date.now()}`;
      
      // Default API client
      let mockApiClient = {
        title: 'Imported Test API',
        version: '1.0.0',
        base_url: 'https://api.test.com',
        endpoints: [
          {
            id: 'endpoint_1',
            path: '/users',
            method: 'GET',
            summary: 'Get all users',
            description: 'Retrieve a list of all users',
            tags: ['users', 'public'],
            flags: []
          },
          {
            id: 'endpoint_2',
            path: '/users',
            method: 'POST',
            summary: 'Create user',
            description: 'Create a new user',
            tags: ['users', 'create'],
            flags: []
          },
          {
            id: 'endpoint_3',
            path: '/test',
            method: 'GET',
            summary: 'Test endpoint',
            description: 'Test endpoint for API validation',
            tags: ['test'],
            flags: []
          }
        ],
        set_auth_token: function(token) {
          this.auth_token = token;
        }
      };

      // Check if this is an OWASP API specification
      if (file.includes('owasp') || file.includes('BOLA') || file.includes('vulnerable')) {
        mockApiClient = {
          title: 'OWASP Vulnerable API',
          version: '1.0.0',
          base_url: 'http://localhost:8000',
          endpoints: [
            {
              id: 'endpoint_bola_1',
              path: '/api/BOLA/profile/{user_id}',
              method: 'GET',
              summary: 'Get User Profile',
              description: 'Vulnerable: Can access any user\'s profile',
              tags: ['BOLA', 'vulnerable', 'user-data'],
              flags: ['OWASP_API_1']
            },
            {
              id: 'endpoint_auth_1',
              path: '/api/BKEN_AUTH/login',
              method: 'POST',
              summary: 'Login',
              description: 'Vulnerable: Weak authentication, no rate limiting',
              tags: ['authentication', 'vulnerable', 'BKEN_AUTH'],
              flags: ['OWASP_API_2']
            },
            {
              id: 'endpoint_bopla_1',
              path: '/api/BOPLA/user/{user_id}',
              method: 'GET',
              summary: 'Get User Details',
              description: 'Vulnerable: Returns sensitive data like SSN',
              tags: ['BOPLA', 'sensitive-data', 'vulnerable'],
              flags: ['OWASP_API_3']
            },
            {
              id: 'endpoint_bfla_1',
              path: '/api/BFLA/admin/users',
              method: 'GET',
              summary: 'Get All Users',
              description: 'Vulnerable: No admin check',
              tags: ['BFLA', 'admin', 'vulnerable'],
              flags: ['OWASP_API_5']
            },
            {
              id: 'endpoint_ssrf_1',
              path: '/api/SSRF/fetch',
              method: 'GET',
              summary: 'Fetch URL',
              description: 'Vulnerable: No URL validation',
              tags: ['SSRF', 'vulnerable', 'external-requests'],
              flags: ['OWASP_API_10']
            }
          ],
          set_auth_token: function(token) {
            this.auth_token = token;
          }
        };
      }

      // Update global state
      this.CLIENT_STORE[clientId] = mockApiClient;
      this.API_METADATA[clientId] = {
        title: mockApiClient.title,
        version: mockApiClient.version,
        base_url: mockApiClient.base_url
      };
      
      this.GLOBAL_API_CLIENT = mockApiClient;
      this.GLOBAL_CLIENT_ID = clientId;
      this.GLOBAL_SCAN_MANAGER = { api_client: mockApiClient };
      this.hasImportedApi = true;

      return this.createSuccessResponse({ client_id: clientId });
    } catch (error) {
      return this.createServerErrorResponse(error.message);
    }
  }

  /**
   * Get all APIs handler
   */
  handleGetAllApis(data) {
    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    return this.createSuccessResponse({
      apis: [{
        client_id: this.GLOBAL_CLIENT_ID,
        title: this.GLOBAL_API_CLIENT.title,
        version: this.GLOBAL_API_CLIENT.version
      }]
    });
  }

  /**
   * Get API details handler
   */
  handleGetApiDetails(data) {
    const clientId = data.client_id;
    const client = clientId ? this.CLIENT_STORE[clientId] : this.GLOBAL_API_CLIENT;

    if (!client) {
      return this.createNotFoundResponse("API client not found.");
    }

    return this.createSuccessResponse({
      title: client.title,
      version: client.version,
      base_url: client.base_url,
      num_endpoints: client.endpoints ? client.endpoints.length : 0
    });
  }

  /**
   * Update API handler
   */
  handleUpdateApi(data) {
    const clientId = data.client_id;
    const updates = data.updates || {};

    const meta = this.API_METADATA[clientId];
    const client = this.CLIENT_STORE[clientId];
    
    if (!meta || !client) {
      return this.createNotFoundResponse("API client not found.");
    }

    ['title', 'version', 'base_url'].forEach(key => {
      if (key in updates) {
        meta[key] = updates[key];
        client[key] = updates[key];
      }
    });

    return this.createSuccessResponse({ message: "API metadata updated." });
  }

  /**
   * Delete API handler
   */
  handleDeleteApi(data) {
    const clientId = data.client_id;

    if (!(clientId in this.CLIENT_STORE)) {
      return this.createNotFoundResponse("API not found.");
    }

    delete this.CLIENT_STORE[clientId];
    delete this.API_METADATA[clientId];

    if (clientId === this.GLOBAL_CLIENT_ID) {
      this.GLOBAL_CLIENT_ID = null;
      this.GLOBAL_API_CLIENT = null;
      this.GLOBAL_SCAN_MANAGER = null;
      this.hasImportedApi = false;
    }

    return this.createSuccessResponse({ message: "API deleted." });
  }

  /**
   * Set API key handler
   */
  handleSetApiKey(data) {
    const apiKey = data.api_key;
    
    if (!apiKey) {
      return this.createBadRequestResponse("Missing 'api_key' field");
    }

    if (this.GLOBAL_API_CLIENT && this.GLOBAL_API_CLIENT.set_auth_token) {
      this.GLOBAL_API_CLIENT.set_auth_token(apiKey);
    }

    return this.createSuccessResponse({ message: "api key set" });
  }

  /**
   * List endpoints handler
   */
  handleListEndpoints(data) {
    const clientId = data.client_id;
    const client = clientId ? this.CLIENT_STORE[clientId] : this.GLOBAL_API_CLIENT;

    if (!client) {
      return this.createNotFoundResponse("API not found.");
    }

    const endpoints = client.endpoints.map(ep => ({
      id: ep.id,
      path: ep.path,
      method: ep.method,
      summary: ep.summary,
      tags: ep.tags,
      flags: ep.flags.map(flag => flag.name || flag)
    }));

    return this.createSuccessResponse({ endpoints });
  }

  /**
   * Endpoint details handler
   */
  handleEndpointDetails(data) {
    const { path, method, id } = data;

    if (!path || !method) {
      return this.createBadRequestResponse("Missing 'path' or 'method'");
    }

    if (!id) {
      return this.createBadRequestResponse("Missing 'id'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(ep => ep.id === id);

    if (!endpoint) {
      return this.createNotFoundResponse("Endpoint not found");
    }

    return this.createSuccessResponse({
      id: endpoint.id,
      path: endpoint.path,
      method: endpoint.method,
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags
    });
  }

  /**
   * Add tags handler
   */
  handleAddTags(data) {
    const { path, method, tags } = data;

    if (!path || !method || !tags) {
      return this.createBadRequestResponse("Missing 'path', 'method', or 'tags'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return this.createNotFoundResponse("Endpoint not found");
    }

    endpoint.tags = [...new Set([...endpoint.tags, ...tags])];

    return this.createSuccessResponse({ tags: endpoint.tags });
  }

  /**
   * Remove tags handler
   */
  handleRemoveTags(data) {
    const { path, method, tags } = data;

    if (!path || !method || !tags) {
      return this.createBadRequestResponse("Missing 'path', 'method', or 'tags'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return this.createNotFoundResponse("Endpoint not found");
    }

    endpoint.tags = endpoint.tags.filter(tag => !tags.includes(tag));

    return this.createSuccessResponse({ tags: endpoint.tags });
  }

  /**
   * Replace tags handler
   */
  handleReplaceTags(data) {
    const { path, method, tags } = data;

    if (!path || !method || tags === undefined) {
      return this.createBadRequestResponse("Missing 'path', 'method', or 'tags'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return this.createNotFoundResponse("Endpoint not found");
    }

    endpoint.tags = [...tags];

    return this.createSuccessResponse({ tags: endpoint.tags });
  }

  /**
   * Add flags handler
   */
  handleAddFlags(data) {
    const { endpoint_id, flags } = data;

    if (!endpoint_id || !flags) {
      return this.createBadRequestResponse("Missing 'endpoint_id' or 'flags'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(ep => ep.id === endpoint_id);

    if (!endpoint) {
      return this.createNotFoundResponse("Endpoint not found");
    }

    if (!endpoint.flags) {
      endpoint.flags = [];
    }

    if (!endpoint.flags.includes(flags)) {
      endpoint.flags.push(flags);
    }

    return this.createSuccessResponse({ flags: endpoint.flags });
  }

  /**
   * Remove flags handler
   */
  handleRemoveFlags(data) {
    const { endpoint_id, flags } = data;

    if (!endpoint_id || !flags) {
      return this.createBadRequestResponse("Missing 'endpoint_id' or 'flags'");
    }

    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const endpoint = this.GLOBAL_API_CLIENT.endpoints.find(ep => ep.id === endpoint_id);

    if (!endpoint) {
      return this.createNotFoundResponse(`Endpoint with ID '${endpoint_id}' not found`);
    }

    if (!endpoint.flags) {
      endpoint.flags = [];
    }

    const flagIndex = endpoint.flags.indexOf(flags);
    if (flagIndex === -1) {
      return this.createSuccessResponse({
        flags: endpoint.flags,
        error: `Flag '${flags}' not found on endpoint`
      });
    }

    endpoint.flags.splice(flagIndex, 1);

    return this.createSuccessResponse({
      flags: endpoint.flags,
      message: `Flag '${flags}' removed successfully`
    });
  }

  /**
   * List tags handler
   */
  handleListTags(data) {
    if (!this.GLOBAL_API_CLIENT) {
      return this.createNotFoundResponse("No API has been imported yet.");
    }

    const allTags = new Set();
    this.GLOBAL_API_CLIENT.endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => allTags.add(tag));
    });

    return this.createSuccessResponse({ tags: Array.from(allTags) });
  }

  /**
   * Create scan handler
   */
  handleCreateScan(data) {
    const { client_id, scan_profile = "OWASP_API_10" } = data;
    
    if (!this.GLOBAL_CLIENT_ID) {
      return this.createNotFoundResponse(`${client_id} not found`);
    }

    return this.createSuccessResponse({ message: "Success" });
  }

  /**
   * Start scan handler
   */
  handleStartScan(data) {
    const { api_name, scan_profile = "OWASP_API_10" } = data;

    if (!api_name) {
      return this.createNotFoundResponse(`${api_name} not found`);
    }

    if (!this.GLOBAL_SCAN_MANAGER) {
      return this.createServerErrorResponse("No scan manager available");
    }

    const scanId = `scan_${this.scanCounter++}_${Date.now()}`;
    
    this.scans[scanId] = {
      id: scanId,
      api_name,
      scan_profile,
      status: 'running',
      started_at: new Date().toISOString(),
      results: []
    };

    return this.createSuccessResponse({ scan_id: scanId });
  }

  /**
   * Scan progress handler
   */
  handleScanProgress(data) {
    const { scan_id } = data;

    if (!scan_id) {
      return this.createNotFoundResponse("scan_id missing");
    }

    const scan = this.scans[scan_id];
    if (!scan) {
      return this.createNotFoundResponse(`${scan_id} not found`);
    }

    return this.createSuccessResponse({
      scan_id: scan_id,
      endpoints_remaining: 0,
      status: scan.status,
      progress: scan.status === 'completed' ? 100 : 50
    });
  }

  /**
   * Stop scan handler
   */
  handleStopScan(data) {
    const { scan_id } = data;

    if (!scan_id) {
      return this.createNotFoundResponse(`${scan_id} not found`);
    }

    const scan = this.scans[scan_id];
    if (!scan) {
      return this.createNotFoundResponse(`${scan_id} not found`);
    }

    scan.status = 'stopped';
    return this.createSuccessResponse(`${scan_id} stopped`);
  }

  /**
   * Scan results handler
   */
  handleScanResults(data) {
    const { scan_id } = data;

    if (!scan_id) {
      return this.createNotFoundResponse(`${scan_id} missing`);
    }

    const scan = this.scans[scan_id];
    if (!scan) {
      return this.createNotFoundResponse(`${scan_id} not found`);
    }

    let scanResults = [];

    if (this.GLOBAL_API_CLIENT && this.GLOBAL_API_CLIENT.title === 'OWASP Vulnerable API') {
      scanResults = [
        {
          endpoint_id: 'endpoint_bola_1',
          vulnerability_name: 'Broken Object Level Authorization (BOLA)',
          severity: 'High',
          cvss_score: 8.5,
          description: 'API allows access to user profiles without proper authorization checks. Any authenticated user can view other users\' profiles by modifying the user_id parameter.',
          recommendation: 'Implement proper object-level authorization checks to ensure users can only access their own data. Validate user permissions for each requested resource.',
          evidence: 'Endpoint /api/BOLA/profile/{user_id} accepts any user_id without validating ownership',
          test_name: 'BOLA_USER_PROFILE_ACCESS',
          affected_params: ['user_id'],
          timestamp: new Date().toISOString()
        },
        {
          endpoint_id: 'endpoint_auth_1',
          vulnerability_name: 'Broken Authentication',
          severity: 'High',
          cvss_score: 9.0,
          description: 'Login endpoint lacks rate limiting and accepts weak authentication mechanisms. No account lockout or brute force protection implemented.',
          recommendation: 'Implement rate limiting, account lockout mechanisms, and strong password policies. Add CAPTCHA for repeated failed attempts.',
          evidence: 'Login endpoint /api/BKEN_AUTH/login allows unlimited authentication attempts',
          test_name: 'WEAK_AUTHENTICATION_CHECK',
          affected_params: ['username', 'password'],
          timestamp: new Date().toISOString()
        },
        {
          endpoint_id: 'endpoint_bopla_1',
          vulnerability_name: 'Broken Object Property Level Authorization',
          severity: 'Medium',
          cvss_score: 6.5,
          description: 'API returns sensitive user data including SSN, internal IDs, and other confidential information that should not be exposed.',
          recommendation: 'Filter response data to exclude sensitive fields. Implement field-level authorization based on user roles and permissions.',
          evidence: 'User details endpoint returns sensitive fields like SSN, internal_user_id, and salary information',
          test_name: 'SENSITIVE_DATA_EXPOSURE',
          affected_params: ['user_id'],
          timestamp: new Date().toISOString()
        },
        {
          endpoint_id: 'endpoint_bfla_1',
          vulnerability_name: 'Broken Function Level Authorization',
          severity: 'Critical',
          cvss_score: 9.5,
          description: 'Administrative functions are accessible to regular users without proper role-based access controls.',
          recommendation: 'Implement proper role-based access control (RBAC) and verify user permissions before executing administrative functions.',
          evidence: 'Admin endpoint /api/BFLA/admin/users accessible without admin role verification',
          test_name: 'ADMIN_FUNCTION_ACCESS',
          affected_params: [],
          timestamp: new Date().toISOString()
        },
        {
          endpoint_id: 'endpoint_ssrf_1',
          vulnerability_name: 'Server-Side Request Forgery (SSRF)',
          severity: 'High',
          cvss_score: 8.0,
          description: 'API allows fetching arbitrary URLs without validation, potentially enabling access to internal services and sensitive data.',
          recommendation: 'Implement URL validation with allowlists for permitted domains. Block access to internal IP ranges and localhost.',
          evidence: 'Fetch endpoint accepts any URL including internal addresses like localhost, 127.0.0.1, and private IP ranges',
          test_name: 'SSRF_URL_VALIDATION',
          affected_params: ['url'],
          timestamp: new Date().toISOString()
        }
      ];
    } else {
      scanResults = [
        {
          endpoint_id: 'endpoint_1',
          vulnerability_name: 'Missing Authentication',
          severity: 'Medium',
          cvss_score: 5.0,
          description: 'API endpoint lacks proper authentication mechanisms',
          recommendation: 'Implement proper authentication and authorization',
          evidence: 'Endpoint accessible without authentication headers',
          test_name: 'AUTH_MISSING_TEST',
          affected_params: [],
          timestamp: new Date().toISOString()
        },
        {
          endpoint_id: 'endpoint_2',
          vulnerability_name: 'Input Validation Issue',
          severity: 'Low',
          cvss_score: 3.0,
          description: 'Endpoint may not properly validate input parameters',
          recommendation: 'Implement comprehensive input validation',
          evidence: 'No input validation detected on user creation endpoint',
          test_name: 'INPUT_VALIDATION_TEST',
          affected_params: ['username', 'email'],
          timestamp: new Date().toISOString()
        }
      ];
    }

    return this.createSuccessResponse({ result: scanResults });
  }

  /**
   * List scans handler
   */
  handleListScans(data) {
    if (Object.keys(this.scans).length === 0) {
      return this.createNotFoundResponse("No scans found");
    }

    const resultMap = {};
    
    Object.values(this.scans).forEach(scan => {
      let scanResultData = [];
      
      if (this.GLOBAL_API_CLIENT && this.GLOBAL_API_CLIENT.title === 'OWASP Vulnerable API') {
        scanResultData = [
          {
            endpoint_id: 'endpoint_bola_1',
            vulnerability_name: 'Broken Object Level Authorization',
            severity: 'High',
            cvss_score: 8.5,
            description: 'BOLA vulnerability detected',
            recommendation: 'Implement proper authorization checks',
            evidence: 'User can access other users\' data',
            test_name: 'BOLA_TEST',
            affected_params: ['user_id'],
            timestamp: scan.started_at
          },
          {
            endpoint_id: 'endpoint_auth_1',
            vulnerability_name: 'Broken Authentication',
            severity: 'Critical',
            cvss_score: 9.0,
            description: 'Weak authentication mechanisms detected',
            recommendation: 'Implement strong authentication',
            evidence: 'No rate limiting on login endpoint',
            test_name: 'AUTH_TEST',
            affected_params: ['username', 'password'],
            timestamp: scan.started_at
          }
        ];
      } else {
        scanResultData = [
          {
            endpoint_id: 'endpoint_1',
            vulnerability_name: 'Test Vulnerability',
            severity: 'Medium',
            cvss_score: 5.0,
            description: 'Test description',
            recommendation: 'Test recommendation',
            evidence: 'Test evidence',
            test_name: 'TEST',
            affected_params: [],
            timestamp: scan.started_at
          }
        ];
      }
      
      resultMap[scan.id] = scanResultData;
    });

    return this.createSuccessResponse({ result: resultMap });
  }
}

module.exports = MockEngine;