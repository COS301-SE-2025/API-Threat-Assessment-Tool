// tests/mocks/engineMock.js
const net = require('net');

class MockEngine {
  constructor(port = 9012) {
    this.port = port;
    this.server = null;
    this.isRunning = false;
    
    // Initialize mock data - this simulates the Python backend state
    this.reset();
  }

  reset() {
    // Reset to initial state - simulates Python backend globals
    this.mockData = {
      globalApi: {
        title: 'Mock API',
        version: '1.0.0',
        base_url: 'https://api.mock.com',
        endpoints: [
          {
            id: 'endpoint_1',
            path: '/users',
            method: 'GET',
            summary: 'Get all users',
            description: 'Retrieve a list of all users',
            tags: ['users', 'public'] // Start with these base tags
          },
          {
            id: 'endpoint_2',
            path: '/users',
            method: 'POST',
            summary: 'Create user',
            description: 'Create a new user',
            tags: ['users', 'create']
          },
          {
            id: 'endpoint_3',
            path: '/test',
            method: 'GET',
            summary: 'Test endpoint',
            description: 'Test endpoint for API validation',
            tags: ['test']
          }
        ]
      },
      apis: {},
      hasImportedApi: true // Track if an API has been imported
    };
  }

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
            socket.write(JSON.stringify(response));
            socket.end();
          } catch (err) {
            // Not complete JSON yet, continue reading
            if (err instanceof SyntaxError) {
              return;
            }
            
            console.error('Mock Engine error:', err);
            const errorResponse = {
              code: 500,
              data: err.message
            };
            socket.write(JSON.stringify(errorResponse));
            socket.end();
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

  handleRequest(request) {
    const { command, data } = request;

    switch (command) {
      case 'apis.import_file':
        return this.handleImportFile(data);
      
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
      
      case 'tags.list':
        return this.handleListTags(data);
      
      default:
        return {
          code: 400,
          data: `Unknown command: ${command}`
        };
    }
  }

  handleImportFile(data) {
    const { file } = data;
    if (!file) {
      return {
        code: 400,
        data: 'Missing file parameter'
      };
    }

    // Simulate successful import
    this.mockData.hasImportedApi = true;
    const clientId = 'global';
    
    return {
      code: 200,
      data: {
        client_id: clientId
      }
    };
  }

  handleListEndpoints(data) {
    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    return {
      code: 200,
      data: {
        endpoints: this.mockData.globalApi.endpoints
      }
    };
  }

  handleEndpointDetails(data) {
    const { id, path, method } = data;
    
    // Match Python backend validation order: path/method first, then id
    if (!path || !method) {
      return {
        code: 400,
        data: 'Missing \'path\' or \'method\''
      };
    }
    
    if (!id) {
      return {
        code: 400,
        data: 'Missing \'id\''
      };
    }

    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    const endpoint = this.mockData.globalApi.endpoints.find(ep => ep.id === id);
    if (!endpoint) {
      return {
        code: 404,
        data: 'Endpoint not found'
      };
    }

    return {
      code: 200,
      data: endpoint
    };
  }

  handleAddTags(data) {
    const { path, method, tags } = data;
    
    if (!path || !method || !tags) {
      return {
        code: 400,
        data: 'Missing path, method, or tags'
      };
    }

    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    const endpoint = this.mockData.globalApi.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return {
        code: 404,
        data: 'Endpoint not found'
      };
    }

    // Add tags (merge with existing, remove duplicates)
    endpoint.tags = [...new Set([...endpoint.tags, ...tags])];

    return {
      code: 200,
      data: {
        tags: endpoint.tags
      }
    };
  }

  handleRemoveTags(data) {
    const { path, method, tags } = data;
    
    if (!path || !method || !tags) {
      return {
        code: 400,
        data: 'Missing path, method, or tags'
      };
    }

    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    const endpoint = this.mockData.globalApi.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return {
        code: 404,
        data: 'Endpoint not found'
      };
    }

    // Remove specified tags
    endpoint.tags = endpoint.tags.filter(tag => !tags.includes(tag));

    return {
      code: 200,
      data: {
        tags: endpoint.tags
      }
    };
  }

  handleReplaceTags(data) {
    const { path, method, tags } = data;
    
    if (!path || !method || tags === undefined) {
      return {
        code: 400,
        data: 'Missing path, method, or tags'
      };
    }

    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    const endpoint = this.mockData.globalApi.endpoints.find(
      ep => ep.path === path && ep.method === method
    );

    if (!endpoint) {
      return {
        code: 404,
        data: 'Endpoint not found'
      };
    }

    // Replace all tags
    endpoint.tags = [...tags];

    return {
      code: 200,
      data: {
        tags: endpoint.tags
      }
    };
  }

  handleListTags(data) {
    if (!this.mockData.hasImportedApi || !this.mockData.globalApi) {
      return {
        code: 404,
        data: 'No API has been imported yet.'
      };
    }

    // Collect all unique tags from all endpoints
    const allTags = new Set();
    this.mockData.globalApi.endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => allTags.add(tag));
    });

    return {
      code: 200,
      data: {
        tags: Array.from(allTags)
      }
    };
  }
}

module.exports = MockEngine;