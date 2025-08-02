// tests/helpers/test-helpers.js
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Test helpers and utilities for API testing
 */
class TestHelpers {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Clean up temp directory
   */
  cleanupTempDir() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Create a temporary test file
   * @param {string} filename - Name of the file
   * @param {string|Buffer} content - File content
   * @param {number} size - Optional: create file of specific size
   * @returns {string} Path to the created file
   */
  createTestFile(filename, content, size = null) {
    this.ensureTempDir();
    const filePath = path.join(this.tempDir, filename);
    
    if (size) {
      const buffer = Buffer.alloc(size, 'x');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, content);
    }
    
    return filePath;
  }

  /**
   * Create a valid OpenAPI specification file
   * @param {string} filename - Name of the file
   * @param {object} customPaths - Optional custom paths to include
   * @returns {string} Path to the created file
   */
  createValidOpenApiFile(filename = 'test-api.json', customPaths = {}) {
    const defaultPaths = {
      '/users': {
        get: {
          summary: 'Get all users',
          operationId: 'getUsers',
          tags: ['users'],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new user',
          operationId: 'createUser',
          tags: ['users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          responses: {
            '201': { description: 'User created' },
            '400': { description: 'Invalid input' }
          }
        }
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by ID',
          operationId: 'getUserById',
          tags: ['users'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'User found' },
            '404': { description: 'User not found' }
          }
        }
      }
    };

    const apiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for unit testing'
      },
      servers: [
        { url: 'https://api.example.com/v1' }
      ],
      paths: { ...defaultPaths, ...customPaths },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['name', 'email']
          }
        }
      }
    };

    return this.createTestFile(filename, JSON.stringify(apiSpec, null, 2));
  }

  /**
   * Create an invalid JSON file for testing error handling
   * @param {string} filename - Name of the file
   * @returns {string} Path to the created file
   */
  createInvalidJsonFile(filename = 'invalid.json') {
    const invalidJson = '{"invalid": json, "missing": "quotes}';
    return this.createTestFile(filename, invalidJson);
  }

  /**
   * Create a YAML OpenAPI specification file
   * @param {string} filename - Name of the file
   * @returns {string} Path to the created file
   */
  createYamlApiFile(filename = 'test-api.yaml') {
    const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
  description: A test API in YAML format
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        '200':
          description: Success
    `;
    return this.createTestFile(filename, yamlContent.trim());
  }

  /**
   * Generate a valid JWT token for testing
   * @param {string} userId - User ID to include in token
   * @param {object} additionalClaims - Additional claims to include
   * @returns {string} JWT token
   */
  generateTestJWT(userId = 'test-user-id', additionalClaims = {}) {
    // For testing, we'll use the mocked JWT that matches our mock implementation
    return `mock.jwt.token.${userId}`;
  }

  /**
   * Generate test user data
   * @param {object} overrides - Properties to override
   * @returns {object} User data object
   */
  generateTestUser(overrides = {}) {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
      id: `user-${randomId}`,
      email: `test${randomId}@example.com`,
      username: `testuser${randomId}`,
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
      emailConfirmed: false,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test API data
   * @param {object} overrides - Properties to override
   * @returns {object} API data object
   */
  generateTestApi(overrides = {}) {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
      id: `api-${randomId}`,
      name: `Test API ${randomId}`,
      description: 'A test API for unit testing',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test endpoint data
   * @param {object} overrides - Properties to override
   * @returns {object} Endpoint data object
   */
  generateTestEndpoint(overrides = {}) {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
      id: `endpoint-${randomId}`,
      path: `/test/${randomId}`,
      method: 'GET',
      summary: `Test endpoint ${randomId}`,
      description: 'A test endpoint for unit testing',
      tags: ['test'],
      flags: [],
      parameters: [],
      responses: { '200': { description: 'Success' } },
      ...overrides
    };
  }

  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the specified time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API response structure
   * @param {object} response - Response object to validate
   * @param {number} expectedStatus - Expected HTTP status code
   * @returns {boolean} True if response structure is valid
   */
  validateApiResponse(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    const body = response.body;
    if (!body || typeof body !== 'object') {
      throw new Error('Response body is not a valid object');
    }

    if (!body.hasOwnProperty('success')) {
      throw new Error('Response missing success field');
    }

    if (!body.hasOwnProperty('message')) {
      throw new Error('Response missing message field');
    }

    if (!body.hasOwnProperty('timestamp')) {
      throw new Error('Response missing timestamp field');
    }

    return true;
  }

  /**
   * Extract validation errors from API response
   * @param {object} response - API response object
   * @returns {Array} Array of validation errors
   */
  extractValidationErrors(response) {
    if (response.body && response.body.errors && Array.isArray(response.body.errors)) {
      return response.body.errors;
    }
    return [];
  }

  /**
   * Create multiple test files at once
   * @param {Array} fileConfigs - Array of {filename, content} objects
   * @returns {Array} Array of file paths
   */
  createMultipleTestFiles(fileConfigs) {
    return fileConfigs.map(config => 
      this.createTestFile(config.filename, config.content)
    );
  }

  /**
   * Generate random string of specified length
   * @param {number} length - Length of the string
   * @returns {string} Random string
   */
  generateRandomString(length = 10) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generate test scan data
   * @param {object} overrides - Properties to override
   * @returns {object} Scan data object
   */
  generateTestScan(overrides = {}) {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
      id: `scan-${randomId}`,
      apiName: `Test API ${randomId}`,
      status: 'created',
      progress: 0,
      scanProfile: 'OWASP_API_10',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create authorization header for testing
   * @param {string} token - JWT token
   * @returns {object} Headers object with authorization
   */
  createAuthHeader(token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Validate JWT token format (basic check)
   * @param {string} token - JWT token to validate
   * @returns {boolean} True if token format is valid
   */
  isValidJWTFormat(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 || token.startsWith('mock.jwt.token.');
  }

  /**
   * Create test request with common headers
   * @param {object} request - Supertest request object
   * @param {string} token - Optional JWT token
   * @returns {object} Request object with headers
   */
  addCommonHeaders(request, token = null) {
    request.set('Content-Type', 'application/json');
    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  }

  /**
   * Cleanup a single file
   * @param {string} filePath - Path to file to cleanup
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }

  /**
   * Cleanup multiple files
   * @param {Array} filePaths - Array of file paths to cleanup
   */
  cleanupFiles(filePaths) {
    filePaths.forEach(filePath => this.cleanupFile(filePath));
  }
}

// Create and export a singleton instance
const testHelpers = new TestHelpers();

module.exports = testHelpers;