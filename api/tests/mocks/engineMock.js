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
            console.log(`Mock Engine responding with code: ${response.code}`);
            
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

        socket.on('close', () => {
          // Connection closed, cleanup if needed
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
    try {
      const { command, data } = request;

      console.log(`Mock Engine handling command: ${command} with data:`, data);

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
          console.log(`Mock Engine: Unknown command: ${command}`);
          return {
            code: 400,
            data: `Unknown command: ${command}`
          };
      }
    } catch (error) {
      console.error('Mock Engine error handling request:', error);
      return {
        code: 500,
        data: `Mock Engine error: ${error.message}`
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
    // Handle undefined/null data gracefully
    if (!data) {
      return {
        code: 400,
        data: 'Missing request data'
      };
    }

    const { id, path, method } = data;
    
    // Match Python backend validation order: path/method first, then id
    if (!path || !method) {
      console.log(`Mock: Missing path (${path}) or method (${method})`);
      return {
        code: 400,
        data: 'Missing \'path\' or \'method\''
      };
    }
    
    if (!id) {
      console.log(`Mock: Missing id (${id})`);
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

    // Try to find by ID first
    let endpoint = this.mockData.globalApi.endpoints.find(ep => ep.id === id);
    
    // If not found by ID, try to find by path and method as fallback
    if (!endpoint) {
      endpoint = this.mockData.globalApi.endpoints.find(
        ep => ep.path === path && ep.method === method
      );
    }

    if (!endpoint) {
      console.log(`Mock: No endpoint found for id=${id}, path=${path}, method=${method}`);
      console.log(`Mock: Available endpoints:`, this.mockData.globalApi.endpoints.map(ep => 
        `{id: ${ep.id}, path: ${ep.path}, method: ${ep.method}}`
      ));
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
      console.log(`Mock: No endpoint found for path=${path}, method=${method}`);
      console.log(`Mock: Available endpoints:`, this.mockData.globalApi.endpoints.map(ep => 
        `{path: ${ep.path}, method: ${ep.method}}`
      ));
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