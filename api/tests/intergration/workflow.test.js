// tests/integration/workflow.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

// Create a helper to generate test files
const createTestFile = (filename, content) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
};

// Mock Supabase and other dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(), ilike: jest.fn() })),
      insert: jest.fn(() => ({ select: jest.fn() }))
    })),
    auth: { signOut: jest.fn() }
  }))
}));

describe('API Workflow Integration Tests', () => {
  let app;
  let mockEngine;
  let testApiSpec;

  beforeAll(async () => {
    // Start mock engine
    mockEngine = new MockEngine(global.TEST_CONFIG.ENGINE_PORT);
    await mockEngine.start();

    // Set up test environment
    process.env.ENGINE_PORT = global.TEST_CONFIG.ENGINE_PORT;
    
    // Clear require cache and load app
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');

    // Create test API specification
    testApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test Integration API',
        version: '1.0.0',
        description: 'API for integration testing'
      },
      servers: [
        { url: 'https://api.test.com/v1' }
      ],
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
            description: 'Retrieve a list of all users',
            tags: ['users'],
            responses: {
              '200': {
                description: 'List of users',
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
            summary: 'Create user',
            description: 'Create a new user',
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
        '/test': {
          get: {
            summary: 'Test endpoint',
            description: 'Test endpoint for API validation',
            tags: ['test'],
            responses: {
              '200': { description: 'Test successful' }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
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
    // Reset mock engine data before each test
    mockEngine.reset();
  });

  describe('Complete API Management Workflow', () => {
    let importedApiId;
    
    test('Step 1: Import API specification', async () => {
      // Create temporary API spec file
      const testFile = createTestFile('integration-test-api.json', JSON.stringify(testApiSpec));

      const response = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'API imported successfully',
        data: {
          api_id: expect.any(String),
          filename: 'integration-test-api.json'
        }
      });

      importedApiId = response.body.data.api_id;

      // Clean up test file
      fs.unlinkSync(testFile);
    });

    test('Step 2: List imported endpoints', async () => {
      const response = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Endpoints retrieved successfully',
        data: {
          endpoints: expect.arrayContaining([
            expect.objectContaining({
              path: '/users',
              method: 'GET',
              summary: expect.any(String)
            }),
            expect.objectContaining({
              path: '/users',
              method: 'POST',
              summary: expect.any(String)
            }),
            expect.objectContaining({
              path: '/test',
              method: 'GET',
              summary: expect.any(String)
            })
          ])
        }
      });

      expect(response.body.data.endpoints).toHaveLength(3);
    });

    test('Step 3: Get details for specific endpoint', async () => {
      const response = await request(app)
        .post('/api/endpoints/details')
        .send({
          endpoint_id: 'endpoint_1',
          path: '/users',
          method: 'GET'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Endpoint details retrieved successfully',
        data: {
          id: 'endpoint_1',
          path: '/users',
          method: 'GET',
          summary: 'Get all users',
          description: 'Retrieve a list of all users',
          tags: expect.any(Array)
        }
      });
    });

    test('Step 4: Add tags to endpoint', async () => {
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['public', 'v1', 'production']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags added successfully',
        data: {
          tags: expect.arrayContaining(['public', 'v1', 'production'])
        }
      });
    });

    test('Step 5: List all tags in system', async () => {
      // First ensure we add the tags from previous step
      await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['public', 'v1', 'production']
        })
        .expect(200);

      const response = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags retrieved successfully',
        data: {
          tags: expect.arrayContaining(['public', 'v1', 'production'])
        }
      });
    });

    test('Step 6: Remove specific tags from endpoint', async () => {
      // First add the tags
      await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['public', 'v1', 'production']
        })
        .expect(200);

      // Then remove one tag
      const response = await request(app)
        .post('/api/endpoints/tags/remove')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['v1']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags removed successfully'
      });

      // Verify v1 tag was removed but others remain
      expect(response.body.data.tags).toContain('public');
      expect(response.body.data.tags).toContain('production');
      expect(response.body.data.tags).not.toContain('v1');
    });

    test('Step 7: Replace all tags on endpoint', async () => {
      // First add some initial tags
      await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['old1', 'old2']
        })
        .expect(200);

      const newTags = ['api', 'secure', 'authenticated'];
      
      const response = await request(app)
        .post('/api/endpoints/tags/replace')
        .send({
          path: '/users',
          method: 'GET',
          tags: newTags
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tags replaced successfully',
        data: {
          tags: newTags
        }
      });

      // Verify old tags are gone and new tags are present
      expect(response.body.data.tags).toEqual(expect.arrayContaining(newTags));
      expect(response.body.data.tags).not.toContain('old1');
      expect(response.body.data.tags).not.toContain('old2');
    });

    test('Step 8: Verify endpoint changes in listing', async () => {
      // First set the expected tags
      const expectedTags = ['api', 'secure', 'authenticated'];
      await request(app)
        .post('/api/endpoints/tags/replace')
        .send({
          path: '/users',
          method: 'GET',
          tags: expectedTags
        })
        .expect(200);

      // Then verify they appear in the listing
      const response = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(200);

      const usersGetEndpoint = response.body.data.endpoints.find(
        ep => ep.path === '/users' && ep.method === 'GET'
      );

      expect(usersGetEndpoint).toBeDefined();
      expect(usersGetEndpoint.tags).toEqual(
        expect.arrayContaining(expectedTags)
      );
    });
  });

  describe('Error Handling in Workflow', () => {
    test('Should handle invalid endpoint details request', async () => {
      const response = await request(app)
        .post('/api/endpoints/details')
        .send({
          endpoint_id: 'nonexistent',
          path: '/nonexistent',
          method: 'GET'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('Should handle missing required parameters for tag operations', async () => {
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          tags: ['test']
          // Missing path and method
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Missing path or method'
      });
    });

    test('Should handle invalid tags format', async () => {
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: 'not-an-array'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Missing tags (must be array)'
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('Should handle multiple tag operations on different endpoints', async () => {
      // Add different tags to different endpoints simultaneously
      const operations = [
        request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['user-read', 'public']
          }),
        request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'POST',
            tags: ['user-write', 'admin']
          }),
        request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/test',
            method: 'GET',
            tags: ['testing', 'debug']
          })
      ];

      const responses = await Promise.all(operations);
      
      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify all tags are present in the system
      const tagsResponse = await request(app)
        .get('/api/tags')
        .expect(200);

      expect(tagsResponse.body.data.tags).toEqual(
        expect.arrayContaining([
          'user-read', 'public', 'user-write', 'admin', 'testing', 'debug'
        ])
      );
    });
  });
});