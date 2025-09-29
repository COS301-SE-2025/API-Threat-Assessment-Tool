// tests/unit/coverage.focused.test.js - Fixed environment and server startup issues
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

// Mock Supabase
const mockSupabaseData = {
  users: [],
  userPreferences: [],
  userProfileExtended: [],
  userActivityLog: [],
  simulateError: false,
  simulateDuplicateError: false
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (mockSupabaseData.simulateError) {
        return {
          select: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Simulated database error' }
          })),
          insert: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Simulated insert error' }
          })),
          update: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Simulated update error' }
          }))
        };
      }

      if (table === 'users') {
        return {
          select: jest.fn((fields) => ({
            eq: jest.fn((field, value) => ({
              single: jest.fn(() => {
                const user = mockSupabaseData.users.find(u => u[field] === value);
                return Promise.resolve({
                  data: user || null,
                  error: user ? null : { message: 'User not found' }
                });
              })
            }))
          })),
          insert: jest.fn((userData) => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                if (mockSupabaseData.simulateDuplicateError) {
                  return Promise.resolve({
                    data: null,
                    error: { code: '23505', message: 'Duplicate key error' }
                  });
                }
                const newUser = userData[0];
                mockSupabaseData.users.push(newUser);
                return Promise.resolve({
                  data: newUser,
                  error: null
                });
              })
            }))
          }))
        };
      }

      return {
        select: jest.fn(() => ({ eq: jest.fn(), ilike: jest.fn() })),
        insert: jest.fn(() => ({ select: jest.fn() }))
      };
    }),
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  }))
}));

describe('Coverage Focused Tests', () => {
  let app;
  let mockEngine;

  beforeAll(async () => {
    mockEngine = new MockEngine(global.TEST_CONFIG?.ENGINE_PORT || 9012);
    await mockEngine.start();
    
    // Set up environment properly
    process.env.ENGINE_PORT = global.TEST_CONFIG?.ENGINE_PORT || 9012;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = global.TEST_CONFIG?.JWT_SECRET || 'test-jwt-secret';
    
    // Load app without triggering server startup
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');
  });

  afterAll(async () => {
    await mockEngine.stop();
  });

  beforeEach(() => {
    mockEngine.reset();
    mockSupabaseData.users = [];
    mockSupabaseData.simulateError = false;
    mockSupabaseData.simulateDuplicateError = false;
  });

  describe('Basic Functionality', () => {
    test('should handle basic route access', async () => {
      const response = await request(app).get('/').expect(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle connection test', async () => {
      const response = await request(app)
        .get('/api/connection/test')
        .expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Environment Branch Coverage', () => {
    test('should handle test environment gracefully', async () => {
      // Already in test environment, verify it works
      const response = await request(app).get('/').expect(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle missing environment variables', async () => {
      // Test that app continues to function with missing env vars
      const originalEnv = process.env.SOME_OPTIONAL_VAR;
      delete process.env.SOME_OPTIONAL_VAR;
      
      const response = await request(app).get('/').expect(200);
      expect(response.body.success).toBe(true);
      
      // Restore if it existed
      if (originalEnv) {
        process.env.SOME_OPTIONAL_VAR = originalEnv;
      }
    });
  });

  describe('Error Handling Coverage', () => {
    test('should handle engine errors', async () => {
      mockEngine.setErrorMode(true);
      
      const response = await request(app)
        .get('/api/connection/test')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      
      mockEngine.setErrorMode(false);
    });

    test('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({}) // Missing credentials
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Missing credentials');
    });
  });

  describe('Authentication Coverage', () => {
    test('should handle invalid tokens', async () => {
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
  });

  describe('File Upload Coverage', () => {
    test('should handle missing file in upload', async () => {
      const response = await request(app)
        .post('/api/import')
        .field('user_id', 'test-user-123')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
    });

    test('should handle missing user_id in upload', async () => {
      const testFile = path.join(__dirname, '../temp/test.json');
      
      // Create temp directory and file
      const tempDir = path.dirname(testFile);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(testFile, JSON.stringify({ test: 'data' }));
      
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

  describe('API Management Coverage', () => {
    test('should handle missing user_id in API list', async () => {
      const response = await request(app)
        .get('/api/apis')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID');
    });

    test('should handle missing user_id in dashboard', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required.');
    });
  });

  describe('Database Error Simulation', () => {
    test('should handle database connection errors', async () => {
      mockSupabaseData.simulateError = true;
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      
      mockSupabaseData.simulateError = false;
    });

    test('should handle duplicate key errors', async () => {
      mockSupabaseData.simulateDuplicateError = true;
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      
      mockSupabaseData.simulateDuplicateError = false;
    });
  });

  describe('Route Coverage', () => {
    test('should handle unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown/route')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/auth/login')
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation Coverage', () => {
    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
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

    test('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 8 characters'
      });
    });

    test('should require all signup fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com'
          // Missing other required fields
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Response Format Coverage', () => {
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
  });
});