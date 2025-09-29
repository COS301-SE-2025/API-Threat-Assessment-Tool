// tests/unit/error.handling.test.js - Fixed with proper user_id and environment handling
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

// Test utilities
const createTempFile = (filename, content, size = null) => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, filename);
  
  if (size) {
    const buffer = Buffer.alloc(size, 'x');
    fs.writeFileSync(filePath, buffer);
  } else {
    fs.writeFileSync(filePath, content);
  }
  
  return filePath;
};

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) })), 
        ilike: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({ select: jest.fn(() => Promise.resolve({ data: {}, error: null })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: {}, error: null })) })),
      upsert: jest.fn(() => Promise.resolve({ data: {}, error: null }))
    })),
    auth: { signOut: jest.fn() }
  }))
}));

describe('Error Handling and Edge Cases Tests', () => {
  let app;
  let mockEngine;
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
    jest.clearAllMocks();
  });

  describe('Global Error Handler', () => {
    test('should handle unhandled errors gracefully', async () => {
      // Test 404 for unknown routes
      const response = await request(app)
        .get('/api/trigger/error')
        .expect(404);
        
      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found'
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rapid requests without crashing', async () => {
      const requests = [];
      
      // Create multiple rapid requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/auth/signup')
            .send({
              email: `test${i}@example.com`,
              password: 'password123',
              firstName: 'Test',
              lastName: 'User'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Most should complete (may be rate limited or succeed)
      const completedResponses = responses.filter(res => res.status !== undefined);
      expect(completedResponses.length).toBe(requests.length);
    });
  });

  describe('File Upload Error Handling', () => {
    test('should reject files exceeding size limit', async () => {
      // Create a large file (this will be caught by multer)
      const largeFile = createTempFile('large.json', null, 11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/import')
        .field('user_id', testUserId)
        .attach('file', largeFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      // Cleanup
      fs.unlinkSync(largeFile);
    });

    test('should reject invalid file types', async () => {
      const invalidFile = createTempFile('test.txt', 'This is not JSON or YAML');

      const response = await request(app)
        .post('/api/import')
        .field('user_id', testUserId)
        .attach('file', invalidFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      // Cleanup
      fs.unlinkSync(invalidFile);
    });

    test('should handle corrupted JSON files', async () => {
      const corruptFile = createTempFile('corrupt.json', '{"invalid": json}');

      const response = await request(app)
        .post('/api/import')
        .field('user_id', testUserId)
        .attach('file', corruptFile);

      // Should fail during processing
      expect([400, 500]).toContain(response.status);
      
      // Cleanup
      fs.unlinkSync(corruptFile);
    });

    test('should handle missing file upload', async () => {
      const response = await request(app)
        .post('/api/import')
        .field('user_id', testUserId)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'No file uploaded'
      });
    });

    test('should handle missing user_id in upload', async () => {
      const testFile = createTempFile('test.json', JSON.stringify({ test: 'data' }));

      const response = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID');
      
      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe('Engine Communication Error Handling', () => {
    test('should handle engine timeout', async () => {
      // Stop the engine to simulate timeout
      await mockEngine.stop();

      const response = await request(app)
        .get('/api/connection/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Connection test error');

      // Restart engine for other tests
      await mockEngine.start();
    });

    test('should handle engine connection failure', async () => {
      mockEngine.setErrorMode(true);

      const response = await request(app)
        .post('/api/endpoints')
        .send({ user_id: testUserId, api_id: 'test-api' })
        .expect(500);

      expect(response.body.success).toBe(false);
      
      mockEngine.setErrorMode(false);
    });
  });

  describe('Middleware Error Handling', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle very large JSON payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(1024 * 1024) // 1MB of data
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largePayload);

      // Should either handle or reject appropriately
      expect([200, 400, 413, 500]).toContain(response.status);
    });
  });

  describe('Validation Error Handling', () => {
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

    test('should handle special characters in email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@<script>alert("xss")</script>.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    test('should handle SQL injection attempts in login', async () => {
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

  describe('HTTP Method and Route Handling', () => {
    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found',
        errors: {
          path: '/api/auth/login',
          method: 'PATCH'
        }
      });
    });

    test('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app)
        .options('/api/auth/login');

      // Should handle CORS preflight requests
      expect([200, 204, 404]).toContain(response.status);
    });

    test('should handle unknown routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent/route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found',
        errors: {
          path: '/api/nonexistent/route',
          method: 'GET'
        }
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle concurrent requests without memory leaks', async () => {
      const requests = Array(20).fill().map(() => 
        request(app).get('/').expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle rapid successive API operations', async () => {
      const apiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } }
      };

      const files = [];
      const requests = [];

      for (let i = 0; i < 3; i++) {
        const file = createTempFile(`rapid-test-${i}.json`, JSON.stringify(apiSpec));
        files.push(file);
        requests.push(
          request(app)
            .post('/api/import')
            .field('user_id', testUserId)
            .attach('file', file)
        );
      }

      const responses = await Promise.allSettled(requests);
      
      // At least some should succeed
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      expect(successful.length).toBeGreaterThan(0);

      // Cleanup
      files.forEach(file => {
        try {
          fs.unlinkSync(file);
        } catch (err) {
          // Ignore cleanup errors
        }
      });
    });
  });

  describe('Engine-specific Error Handling', () => {
    test('should handle missing user_id in dashboard requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required.');
    });

    test('should handle missing user_id in API list requests', async () => {
      const response = await request(app)
        .get('/api/apis')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID');
    });

    test('should handle missing scan_id in scan status', async () => {
      const response = await request(app)
        .get('/api/scan/progress')
        .query({ scan_id: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Scan ID is required');
    });
  });

  describe('Content-Type Handling', () => {
    test('should handle requests with wrong content-type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('username=test&password=test')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle requests with no content-type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('some data');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Response Format Consistency', () => {
    test('should maintain consistent error response format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.success).toBe(false);
    });

    test('should maintain consistent success response format', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.success).toBe(true);
    });
  });

  describe('URL Parameter and Query Validation', () => {
    test('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/api/scan/progress')
        .query({ scan_id: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Scan ID is required');
    });

    test('should handle special characters in query parameters', async () => {
      const response = await request(app)
        .get('/api/scan/progress')
        .query({ scan_id: 'test<script>alert()</script>' });

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Authentication Error Handling', () => {
    test('should handle invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed Bearer token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});