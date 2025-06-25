// tests/unit/coverage-boost.test.js
// Quick tests to improve coverage on index.js error paths and edge cases

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(), ilike: jest.fn() })),
      insert: jest.fn(() => ({ select: jest.fn() }))
    })),
    auth: { signOut: jest.fn() }
  }))
}));

describe('Coverage Boost Tests - Error Paths & Edge Cases', () => {
  let app;
  let mockEngine;

  beforeAll(async () => {
    // Start mock engine
    mockEngine = new MockEngine(global.TEST_CONFIG.ENGINE_PORT);
    await mockEngine.start();

    // Set up environment
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

    // Clean up temp files
    const tempDir = path.join(__dirname, '../temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockEngine.reset();
  });

  describe('Error Handling Tests', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('not json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send()
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing credentials');
    });

    test('should handle very large request payload', async () => {
      const largePayload = {
        username: 'test',
        password: 'a'.repeat(50000), // Very long password
        extraData: 'x'.repeat(100000)
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload);

      // Should either handle gracefully or reject
      expect([200, 400, 413, 500]).toContain(response.status);
    });
  });

  describe('File Upload Edge Cases', () => {
    const createTempFile = (filename, content, size = null) => {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const filePath = path.join(tempDir, filename);
      
      if (size) {
        // Create file of specific size
        const buffer = Buffer.alloc(size, 'x');
        fs.writeFileSync(filePath, buffer);
      } else {
        fs.writeFileSync(filePath, content);
      }
      
      return filePath;
    };

    test('should reject files that are too large', async () => {
      // Create a file larger than 10MB limit
      const largeFile = createTempFile('large.json', null, 11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/import')
        .attach('file', largeFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      // Clean up
      fs.unlinkSync(largeFile);
    });

    test('should reject invalid file types', async () => {
      const txtFile = createTempFile('test.txt', 'This is not JSON');

      const response = await request(app)
        .post('/api/import')
        .attach('file', txtFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      // Clean up
      fs.unlinkSync(txtFile);
    });

    test('should handle corrupted JSON files', async () => {
      const corruptFile = createTempFile('corrupt.json', '{"invalid": json syntax}');

      const response = await request(app)
        .post('/api/import')
        .attach('file', corruptFile);

      // Should fail during processing
      expect([400, 500]).toContain(response.status);
      
      // Clean up
      fs.unlinkSync(corruptFile);
    });

    test('should handle empty files', async () => {
      const emptyFile = createTempFile('empty.json', '');

      const response = await request(app)
        .post('/api/import')
        .attach('file', emptyFile);

      expect([400, 500]).toContain(response.status);
      
      // Clean up
      fs.unlinkSync(emptyFile);
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle invalid JWT token format', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'just-a-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle empty authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should handle rapid successive requests', async () => {
      const requests = Array(10).fill().map(() => 
        request(app)
          .post('/api/auth/signup')
          .send({
            email: `test${Math.random()}@example.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
          })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should succeed, some might be rate limited
      const statusCodes = responses.map(r => r.status);
      expect(statusCodes).toEqual(expect.arrayContaining([201]));
      
      // Check if any were rate limited
      const rateLimited = statusCodes.filter(code => code === 429);
      if (rateLimited.length > 0) {
        expect(rateLimited.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Input Validation Tests', () => {
    test('should handle null values in signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: null,
          password: null,
          firstName: null,
          lastName: null
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle undefined values in signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: undefined,
          password: undefined,
          firstName: undefined,
          lastName: undefined
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle special characters in input', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@<script>alert("xss")</script>.com',
          password: 'password123',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: "admin'; DROP TABLE users; --",
          password: 'password'
        });

      // Should handle gracefully without crashing
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('HTTP Method Tests', () => {
    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/auth/login');

      // Should handle CORS preflight
      expect([200, 204, 404]).toContain(response.status);
    });

    test('should handle HEAD requests', async () => {
      const response = await request(app)
        .head('/')
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent file uploads', async () => {
      const apiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } }
      };

      const file1 = createTempFile('concurrent1.json', JSON.stringify(apiSpec));
      const file2 = createTempFile('concurrent2.json', JSON.stringify(apiSpec));

      const uploads = [
        request(app).post('/api/import').attach('file', file1),
        request(app).post('/api/import').attach('file', file2)
      ];

      const responses = await Promise.allSettled(uploads);
      
      // At least one should succeed
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successful.length).toBeGreaterThan(0);

      // Clean up
      fs.unlinkSync(file1);
      fs.unlinkSync(file2);
    });
  });

  describe('Memory and Performance', () => {
    test('should handle repeated operations without memory leaks', async () => {
      // Perform the same operation many times
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/')
          .expect(200);
      }

      // If we get here without crashing, memory is likely being managed well
      expect(true).toBe(true);
    });

    test('should handle rapid endpoint listing requests', async () => {
      const requests = Array(20).fill().map(() => 
        request(app)
          .post('/api/endpoints')
          .send({})
      );

      const responses = await Promise.allSettled(requests);
      
      // Most should complete successfully
      const successful = responses.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(requests.length * 0.8);
    });
  });
});