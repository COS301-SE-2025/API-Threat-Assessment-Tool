// tests/unit/endpoints.test.js
const request = require('supertest');
const path = require('path');
const MockEngine = require('../mocks/engineMock');

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({ select: jest.fn(), insert: jest.fn() })),
    auth: { signOut: jest.fn() }
  }))
}));

describe('Endpoints and Tags API Tests', () => {
  let app;
  let mockEngine;

  beforeAll(async () => {
    // Start mock engine
    mockEngine = new MockEngine(global.TEST_CONFIG.ENGINE_PORT);
    await mockEngine.start();

    // Set up test environment
    process.env.ENGINE_PORT = global.TEST_CONFIG.ENGINE_PORT;
    
    // Load app
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');
  });

  afterAll(async () => {
    if (mockEngine) {
      await mockEngine.stop();
    }
  });

  beforeEach(() => {
    mockEngine.reset();
  });

  describe('POST /api/endpoints - List Endpoints', () => {
    test('should list all endpoints from imported API', async () => {
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
              tags: expect.any(Array)
            })
          ])
        }
      });
    });

    test('should handle empty API gracefully', async () => {
      // Reset mock to have no imported API
      mockEngine.mockData.hasImportedApi = false;
      mockEngine.mockData.globalApi = null;

      const response = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/endpoints/details - Get Endpoint Details', () => {
    test('should get details for valid endpoint', async () => {
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

      expect(response.body).toMatchObject({
        success: false,
        message: 'Missing endpoint_id'
      });
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
        // First add some tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['existing']
          });

        // Then add more tags
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
            tags: 'not-an-array'
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Missing tags (must be array)'
        });
      });

      test('should return 400 for missing path or method', async () => {
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
    });

    describe('POST /api/endpoints/tags/remove - Remove Tags', () => {
      test('should remove specific tags from endpoint', async () => {
        // First add tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['tag1', 'tag2', 'tag3']
          });

        // Then remove some tags
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
          message: 'Tags removed successfully',
          data: {
            tags: expect.arrayContaining(['tag1', 'tag3'])
          }
        });

        expect(response.body.data.tags).not.toContain('tag2');
      });

      test('should handle removing non-existent tags gracefully', async () => {
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
        // First add some tags
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['old1', 'old2']
          });

        // Then replace with new tags
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

        // Verify old tags are gone
        expect(response.body.data.tags).not.toContain('old1');
        expect(response.body.data.tags).not.toContain('old2');
      });

      test('should handle empty tags array', async () => {
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
        // Add tags to multiple endpoints
        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'GET',
            tags: ['users', 'public', 'v1']
          });

        await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/users',
            method: 'POST',
            tags: ['users', 'write', 'v1']
          });

        const response = await request(app)
          .get('/api/tags')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags retrieved successfully',
          data: {
            tags: expect.arrayContaining(['users', 'public', 'v1', 'write'])
          }
        });

        // Should not have duplicates
        const tags = response.body.data.tags;
        expect(tags.length).toBe(new Set(tags).size);
      });

      test('should return 500 when no API exists', async () => {
        // Reset to empty state (no imported API)
        mockEngine.mockData.hasImportedApi = false;
        mockEngine.mockData.globalApi = null;

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
        .post('/api/endpoints/details')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle very long tag names', async () => {
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
      const specialTags = ['tag-with-dash', 'tag.with.dots', 'tag_with_underscore'];
      
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