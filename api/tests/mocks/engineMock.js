// tests/mocks/engineMock.js - Updated with better error handling and response consistency
const net = require('net');

class MockEngine {
  constructor(port = 9012) {
    this.port = port;
    this.server = null;
    this.isRunning = false;
    this.errorMode = false;
    this.reset();
  }

  reset() {
    this.errorMode = false;
    this.requestCount = 0;
  }

  setErrorMode(enabled) {
    this.errorMode = enabled;
  }

  async start() {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        let data = '';

        socket.on('data', (chunk) => {
          data += chunk.toString();
        });

        socket.on('end', () => {
          try {
            const request = JSON.parse(data);
            const response = this.handleRequest(request);
            socket.write(JSON.stringify(response));
          } catch (err) {
            const errorResponse = { code: 500, data: 'Mock Engine Error' };
            socket.write(JSON.stringify(errorResponse));
          }
          socket.end();
        });

        socket.on('error', (err) => {
          console.warn('Mock Engine socket error:', err.message);
        });
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        this.isRunning = true;
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop() {
    if (!this.isRunning || !this.server) return;

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }

  handleRequest(request) {
    this.requestCount++;

    if (this.errorMode) {
      return { code: 500, data: 'Simulated engine error' };
    }

    const { command, data = {} } = request;

    switch (command) {
      case 'connection.test':
        return { code: 200, data: { status: 'connected', message: 'Mock engine responding' } };
      
      case 'apis.import_file':
        if (!data.user_id || !data.file) {
          return { code: 400, data: 'Missing required fields: user_id, file' };
        }
        return { code: 200, data: { api_id: `mock_api_${Date.now()}`, filename: data.file } };
      
      case 'dashboard.overview':
        if (!data.user_id) {
          return { code: 400, data: 'Missing user_id field' };
        }
        return {
          code: 200,
          data: {
            total_apis: 2,
            total_scans: 5,
            total_vulnerabilities: 12,
            critical_vulnerabilities: 3,
            vulnerabilities_by_severity: { CRITICAL: 3, HIGH: 4, MEDIUM: 3, LOW: 2 },
            recent_scans: [],
            scan_activity_weekly: [],
            top_vuln_types: []
          }
        };
      
      case 'apis.get_all':
        if (!data.user_id) {
          return { code: 400, data: 'Missing user_id field' };
        }
        return {
          code: 200,
          data: {
            apis: [{
              id: 'mock_api_123',
              name: 'Mock API',
              version: '1.0.0',
              created_at: new Date().toISOString(),
              vulnerabilitiesFound: 5,
              lastScanned: new Date().toISOString().split('T')[0],
              scanStatus: 'Completed',
              permission: 'owner'
            }]
          }
        };
      
      case 'endpoints.list':
        if (!data.user_id) {
          return { code: 400, data: 'Missing user_id field' };
        }
        return {
          code: 200,
          data: {
            endpoints: [
              {
                id: 'endpoint_1',
                path: '/users',
                method: 'GET',
                summary: 'Get users',
                tags: ['users', 'public'],
                flags: []
              },
              {
                id: 'endpoint_2',
                path: '/users',
                method: 'POST',
                summary: 'Create user',
                tags: ['users', 'create'],
                flags: []
              },
              {
                id: 'endpoint_3',
                path: '/test',
                method: 'GET',
                summary: 'Test endpoint',
                tags: ['test'],
                flags: []
              }
            ]
          }
        };
      
      case 'endpoints.details':
        return {
          code: 200,
          data: {
            id: data.endpoint_id || 'endpoint_1',
            path: data.path || '/users',
            method: data.method || 'GET',
            summary: 'Endpoint details',
            description: 'Mock endpoint description',
            tags: ['mock', 'test'],
            flags: []
          }
        };
      
      case 'endpoints.tags.add':
      case 'endpoints.tags.remove':
      case 'endpoints.tags.replace':
        if (!data.path || !data.method || !data.tags) {
          return { code: 400, data: 'Missing path, method, or tags' };
        }
        return {
          code: 200,
          data: { tags: Array.isArray(data.tags) ? data.tags : [data.tags] }
        };
      
      case 'endpoints.flags.add':
      case 'endpoints.flags.remove':
        if (!data.flags) {
          return { code: 400, data: 'Missing flags' };
        }
        return { code: 200, data: { flags: [data.flags] } };
      
      case 'tags.list':
        return { code: 200, data: { tags: ['users', 'public', 'create', 'test', 'mock'] } };
      
      case 'scan.create':
      case 'scan.start':
        return {
          code: 200,
          data: { scan_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
        };
      
      case 'scan.status':
      case 'scan.results':
        return {
          code: 200,
          data: {
            status: 'completed',
            result: [
              {
                endpoint_id: 'endpoint_1',
                vulnerability_name: 'Mock Vulnerability',
                severity: 'HIGH',
                cvss_score: 7.5,
                description: 'Mock vulnerability description',
                recommendation: 'Mock recommendation',
                test_name: 'Mock Test'
              }
            ]
          }
        };
      
      case 'scan.stop':
        return { code: 200, data: { message: 'Scan stopped' } };
      
      case 'scan.list':
        return { code: 200, data: { scans: [] } };
      
      // Handle all other commands with generic success
      default:
        return { code: 200, data: { message: `Mock response for ${command}` } };
    }
  }
}

module.exports = MockEngine;