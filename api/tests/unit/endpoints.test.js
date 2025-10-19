// tests/unit/endpoints.test.js - Fixed with proper user_id and authentication
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

// Test utilities
const createTestFile = (filename, content) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
};

const cleanupTestFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`Failed to cleanup test file: ${err.message}`);
  }
};

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: { id: 'test-user-123', email: 'test@example.com' }, error: null })) })), 
        ilike: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({ select: jest.fn(() => Promise.resolve({ data: {}, error: null })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: {}, error: null })) })),
      upsert: jest.fn(() => Promise.resolve({ data: {}, error: null }))
    })),
    auth: { signOut: jest.fn(() => Promise.resolve({ error: null })) }
  }))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mock.jwt.token.${payload.id}`),
  verify: jest.fn((token) => {
    if (!token.includes('mock.jwt.token')) {
      throw new Error('Invalid token');
    }
    const parts = token.split('.');
    const userId = parts[parts.length - 1];
    return { id: userId };
  })
}));

describe('Endpoints and Tags API Tests', () => {
  let app;
  let mockEngine;
  let testApiSpec;
  let testToken = 'mock.jwt.token.test-user-123';
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    // Start mock engine
    const testPort = global.TEST_CONFIG?.ENGINE_PORT || 9012;
    mockEngine = new MockEngine(testPort);
    await mockEngine.start();

    // Configure environment
    process.env.ENGINE_PORT = testPort;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = global.TEST_CONFIG?.JWT_SECRET || 'test-jwt-secret';
    
    // Load app
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');

    // Create test API specification
    testApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'API for endpoint testing'
      },
      servers: [{ url: 'https://api.test.com/v1' }],
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            description: 'Retrieve users',
            tags: ['users', 'public'],
            responses: { '200': { description: 'Success' } }
          },
          post: {
            summary: 'Create user',
            description: 'Create a new user',
            tags: ['users', 'create'],
            responses: { '201': { description: 'Created' } }
          }
        },
        '/test': {
          get: {
            summary: 'Test endpoint',
            description: 'Test endpoint',
            tags: ['test'],
            responses: { '200': { description: 'Success' } }
          }
        }
      }
    };
  });

  afterAll(async () => {
    if (mockEngine) {
      await mockEngine.stop();
    }

    // Clean up temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockEngine.reset();
  });

  // Helper function to import API before each test that needs it
  const importTestApi = async () => {
    const testFile = createTestFile('unit-test-api.json', JSON.stringify(testApiSpec));
    const response = await request(app)
      .post('/api/import')
      .field('user_id', testUserId) // Add required user_id
      .attach('file', testFile)
      .expect(200);
    cleanupTestFile(testFile);
    return response.body.data.api_id;
  };

  describe('POST /api/endpoints - List Endpoints', () => {
    test('should list all endpoints from imported API', async () => {
      // Import API first
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints')
        .send({ user_id: testUserId, api_id: apiId }) // Add required fields
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Endpoints retrieved successfully',
        data: {
          endpoints: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              path: expect.any(String),
              method: expect.any(String),
              summary: expect.any(String),
              tags: expect.any(Array),
              flags: expect.any(Array)
            })
          ])
        }
      });

      expect(response.body.data.endpoints).toHaveLength(3);
    });

    test('should require user_id', async () => {
      const response = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/details - Endpoint Details', () => {
    test('should get endpoint details', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/details')
        .send({
          user_id: testUserId,
          api_id: apiId,
          endpoint_id: 'endpoint_1',
          path: '/users',
          method: 'GET'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Endpoint details retrieved successfully',
        data: expect.objectContaining({
          id: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          summary: expect.any(String)
        })
      });
    });

    test('should require endpoint identification', async () => {
      const response = await request(app)
        .post('/api/endpoints/details')
        .send({ user_id: testUserId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing endpoint_id');
    });
  });

  describe('POST /api/endpoints/tags/add - Add Tags', () => {
    test('should add tags to endpoint', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          user_id: testUserId,
          api_id: apiId,
          path: '/users',
          method: 'GET',
          tags: ['new-tag', 'test-tag']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags added successfully',
        data: {
          tags: expect.arrayContaining(['new-tag', 'test-tag'])
        }
      });
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          user_id: testUserId,
          path: '/users'
          // Missing method and tags
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate tags format', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          user_id: testUserId,
          api_id: apiId,
          path: '/users',
          method: 'GET',
          tags: 'not-an-array'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/tags/remove - Remove Tags', () => {
    test('should remove tags from endpoint', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/tags/remove')
        .send({
          user_id: testUserId,
          api_id: apiId,
          path: '/users',
          method: 'GET',
          tags: ['old-tag']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags removed successfully'
      });
    });
  });

  describe('POST /api/endpoints/tags/replace - Replace Tags', () => {
    test('should replace all tags on endpoint', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/tags/replace')
        .send({
          user_id: testUserId,
          api_id: apiId,
          path: '/users',
          method: 'GET',
          tags: ['replaced-tag-1', 'replaced-tag-2']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags replaced successfully',
        data: {
          tags: ['replaced-tag-1', 'replaced-tag-2']
        }
      });
    });

    test('should allow empty tags array', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/tags/replace')
        .send({
          user_id: testUserId,
          api_id: apiId,
          path: '/users',
          method: 'GET',
          tags: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/tags - List All Tags', () => {
    test('should list all unique tags', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .get('/api/tags')
        .query({ user_id: testUserId, api_id: apiId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags retrieved successfully',
        data: {
          tags: expect.any(Array)
        }
      });
    });

    test('should require user_id and api_id', async () => {
      const response = await request(app)
        .get('/api/tags')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/flags/add - Add Flags', () => {
    test('should add flags to endpoint', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/flags/add')
        .send({
          user_id: testUserId,
          api_id: apiId,
          endpoint_id: 'endpoint_1',
          flags: 'CRITICAL_FLAG'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Flags added successfully'
      });
    });

    test('should require flags', async () => {
      const response = await request(app)
        .post('/api/endpoints/flags/add')
        .send({
          user_id: testUserId,
          endpoint_id: 'endpoint_1'
          // Missing flags
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/flags/remove - Remove Flags', () => {
    test('should remove flags from endpoint', async () => {
      const apiId = await importTestApi();

      const response = await request(app)
        .post('/api/endpoints/flags/remove')
        .send({
          user_id: testUserId,
          api_id: apiId,
          endpoint_id: 'endpoint_1',
          flags: 'CRITICAL_FLAG'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Flags removed successfully'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid JSON gracefully', async () => {
      // This test should pass through normal Express error handling
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .set('Content-Type', 'application/json')
        .send('{"invalid": }') // Malformed JSON
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing API ID', async () => {
      const response = await request(app)
        .post('/api/endpoints')
        .send({ user_id: testUserId })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should handle engine errors gracefully', async () => {
      mockEngine.setErrorMode(true);

      const response = await request(app)
        .post('/api/endpoints')
        .send({ user_id: testUserId, api_id: 'test-api' })
        .expect(500);

      expect(response.body.success).toBe(false);

      mockEngine.setErrorMode(false);
    });

    describe('Tag Error Branches', () => {
      test('should handle tag operations on invalid endpoint', async () => {
        const apiId = await importTestApi();
        
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            user_id: testUserId,
            api_id: apiId,
            path: '/invalid',
            method: 'GET',
            tags: ['test']
          })
          .expect(500);
        
        expect(response.body.success).toBe(false);
      });
    });
  });
});