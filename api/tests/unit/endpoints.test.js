// tests/unit/endpoints.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

/**
 * Unit Tests for Endpoints and Tags API
 * 
 * Tests the endpoint management and tag operations functionality
 * including listing endpoints, managing tags, and error handling.
 */

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
        eq: jest.fn(() => ({ single: jest.fn() })), 
        ilike: jest.fn() 
      })),
      insert: jest.fn(() => ({ select: jest.fn() })),
      update: jest.fn(() => ({ eq: jest.fn() })),
      upsert: jest.fn()
    })),
    auth: { signOut: jest.fn() }
  }))
}));

describe('Endpoints and Tags API Tests', () => {
  let app;
  let mockEngine;
  let testApiSpec;

  beforeAll(async () => {
    // Start mock engine
    const testPort = global.TEST_CONFIG?.ENGINE_PORT || 9012;
    mockEngine = new MockEngine(testPort);
    await mockEngine.start();

    // Configure environment
    process.env.ENGINE_PORT = testPort;
    process.env.NODE_ENV = 'test';
    
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
      .attach('file', testFile)
      .expect(200);
    cleanupTestFile(testFile);
    return response.body.data.api_id;
  };

  describe('POST /api/endpoints - List Endpoints', () => {
    test('should list all endpoints from imported API', async () => {
      // Import API first
      await importTestApi();

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

    test('should handle empty API gracefully', async () => {
      // Don't import any API - mock engine should return 404
      const response = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/details - Get Endpoint Details', () => {
    test('should get details for valid endpoint', async () => {
      // Import API first
      await importTestApi();

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
          summary: expect.any(String),
          description: expect.any(String),
          tags: expect.any(Array)
        }
      });
    });

    test('should return 400 for missing endpoint_id', async () => {
      const response = await request(app)
        .post('/api/endpoints/details')
        .send({
          path: '/users',
          method: 'GET'
          // Missing endpoint_id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for missing path or method', async () => {
      const response = await request(app)
        .post('/api/endpoints/details')
        .send({
          endpoint_id: 'endpoint_1'
          // Missing path and method
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle nonexistent endpoint', async () => {
      // Import API first
      await importTestApi();

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
  });

  describe('Tag Management Endpoints', () => {
    describe('POST /api/endpoints/tags/add - Add Tags', () => {
      test('should add tags to endpoint successfully', async () => {
        // Import API first
        await importTestApi();

        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['public', 'readonly', 'v1']
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags added successfully',
          data: {
            tags: expect.arrayContaining(['public', 'readonly', 'v1'])
          }
        });
      });

      test('should merge with existing tags', async () => {
        // Import API first
        await importTestApi();

        // Add initial tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['existing']
          })
          .expect(200);

        // Add more tags
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['new', 'additional']
          })
          .expect(200);

        expect(response.body.data.tags).toEqual(
          expect.arrayContaining(['existing', 'new', 'additional'])
        );
      });

      test('should return 400 for invalid tags format', async () => {
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: 'invalid-format' // Should be array
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      test('should return 400 for missing path or method', async () => {
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            tags: ['test']
            // Missing path and method
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/endpoints/tags/remove - Remove Tags', () => {
      test('should remove specific tags from endpoint', async () => {
        // Import API first
        await importTestApi();

        // Add tags first
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['tag1', 'tag2', 'tag3']
          })
          .expect(200);

        // Remove specific tag
        const response = await request(app)
          .post('/api/endpoints/tags/remove')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['tag2']
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags removed successfully'
        });

        expect(response.body.data.tags).not.toContain('tag2');
        expect(response.body.data.tags).toContain('tag1');
        expect(response.body.data.tags).toContain('tag3');
      });

      test('should handle removing non-existent tags gracefully', async () => {
        // Import API first
        await importTestApi();

        const response = await request(app)
          .post('/api/endpoints/tags/remove')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['nonexistent']
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/endpoints/tags/replace - Replace Tags', () => {
      test('should replace all tags on endpoint', async () => {
        // Import API first
        await importTestApi();

        // Add initial tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['old1', 'old2']
          })
          .expect(200);

        // Replace with new tags
        const response = await request(app)
          .post('/api/endpoints/tags/replace')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['new1', 'new2', 'new3']
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags replaced successfully',
          data: {
            tags: ['new1', 'new2', 'new3']
          }
        });

        expect(response.body.data.tags).not.toContain('old1');
        expect(response.body.data.tags).not.toContain('old2');
      });

      test('should handle empty tags array', async () => {
        // Import API first
        await importTestApi();

        // Add initial tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['tag1', 'tag2']
          })
          .expect(200);

        // Replace with empty array
        const response = await request(app)
          .post('/api/endpoints/tags/replace')
          .send({
            path: '/users',
            method: 'GET',
            tags: []
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags replaced successfully',
          data: {
            tags: []
          }
        });
      });
    });

    describe('GET /api/tags - List All Tags', () => {
      test('should list all unique tags in system', async () => {
        // Import API first
        await importTestApi();

        // Add tags to different endpoints
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['user-tag', 'common']
          })
          .expect(200);

        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/test',
            method: 'GET',
            tags: ['test-tag', 'common']
          })
          .expect(200);

        const response = await request(app)
          .get('/api/tags')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags retrieved successfully',
          data: {
            tags: expect.arrayContaining(['user-tag', 'test-tag', 'common'])
          }
        });

        // Verify no duplicates
        const tags = response.body.data.tags;
        const uniqueTags = [...new Set(tags)];
        expect(tags.length).toBe(uniqueTags.length);
      });

      test('should return 500 when no API exists', async () => {
        // Don't import any API
        const response = await request(app)
          .get('/api/tags')
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle very long tag names', async () => {
      // Import API first
      await importTestApi();

      const longTag = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: [longTag]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toContain(longTag);
    });

    test('should handle special characters in tags', async () => {
      // Import API first
      await importTestApi();

      const specialTags = ['tag-with-dash', 'tag_with_underscore', 'tag.with.dots'];
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: specialTags
        })
        .expect(200);

      expect(response.body.data.tags).toEqual(
        expect.arrayContaining(specialTags)
      );
    });

    test('should handle large number of tags', async () => {
      // Import API first
      await importTestApi();

      const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
      const response = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: manyTags
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags.length).toBeGreaterThanOrEqual(manyTags.length);
    });
  });
});