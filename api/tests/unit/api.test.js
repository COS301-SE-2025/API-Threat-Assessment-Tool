// tests/unit/api.test.js - Updated with consistent mocks and proper user_id handling
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

// Mock Supabase client with consistent responses
const mockSupabaseData = {
  users: [],
  userPreferences: [],
  userActivityLog: []
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
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
            })),
            ilike: jest.fn((field, value) => {
              const users = mockSupabaseData.users.filter(u => 
                u[field] && u[field].toLowerCase() === value.toLowerCase()
              );
              return Promise.resolve({
                data: users,
                error: null
              });
            })
          })),
          insert: jest.fn((userData) => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                const newUser = {
                  id: userData[0].id || 'new-user-id',
                  email: userData[0].email,
                  username: userData[0].username,
                  first_name: userData[0].first_name,
                  last_name: userData[0].last_name,
                  email_confirmed: userData[0].email_confirmed || false,
                  created_at: userData[0].created_at || new Date().toISOString()
                };
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

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`$2a$${rounds}$hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash.includes(password)))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mock.jwt.token.${payload.id}`),
  verify: jest.fn((token) => {
    const parts = token.split('.');
    const userId = parts[parts.length - 1];
    return { id: userId };
  })
}));

describe('API Unit Tests', () => {
  let app;
  let mockEngine;
  let testUser;

  beforeAll(async () => {
    // Start mock engine
    mockEngine = new MockEngine(global.TEST_CONFIG.ENGINE_PORT);
    await mockEngine.start();

    // Set up environment
    process.env.ENGINE_PORT = global.TEST_CONFIG.ENGINE_PORT;
    process.env.JWT_SECRET = global.TEST_CONFIG.JWT_SECRET;
    
    // Clear require cache and load app
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');

    // Create test user
    testUser = {
      id: 'test-user-123',
      email: 'testuser@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      password: '$2a$10$hashed_password123',
      email_confirmed: true,
      created_at: new Date().toISOString()
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
    // Reset mock data before each test
    mockEngine.reset();
    mockSupabaseData.users = [testUser];
    mockSupabaseData.userPreferences = [];
    mockSupabaseData.userActivityLog = [];
  });

  describe('Health Check', () => {
    test('GET / should return API status and endpoints', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'AT-AT API is running!',
        data: {
          version: expect.any(String),
          endpoints: expect.any(Object)
        }
      });
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
      test('should create new user with valid data', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'password123',
          username: 'newuser',
          firstName: 'New',
          lastName: 'User'
        };

        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User registered',
          data: {
            user: expect.objectContaining({
              email: userData.email,
              username: userData.username
            })
          }
        });
      });

      test('should reject invalid email', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        };

        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual({
          field: 'email',
          message: 'Invalid email format'
        });
      });
    });

    describe('POST /api/auth/login', () => {
      test('should login with valid credentials', async () => {
        const loginData = {
          username: 'testuser',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Login successful',
          data: {
            user: expect.objectContaining({
              username: 'testuser'
            }),
            token: expect.any(String)
          }
        });
      });

      test('should reject missing credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Missing credentials');
      });
    });

    describe('GET /api/auth/profile', () => {
      test('should return user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Profile retrieved',
          data: {
            user: expect.objectContaining({
              id: 'test-user-123',
              email: 'testuser@example.com'
            })
          }
        });
      });

      test('should reject missing authorization header', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access denied. No valid token provided.');
      });
    });
  });

  describe('API Import Endpoints', () => {
    test.skip('POST /api/import should import OpenAPI file with user_id', async () => {
      const testApiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      };

      const testFile = createTestFile('test-api.json', JSON.stringify(testApiSpec));

      const response = await request(app)
        .post('/api/import')
        .field('user_id', 'test-user-123') // Add required user_id
        .attach('file', testFile)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'API imported successfully',
        data: {
          api_id: expect.any(String),
          filename: 'test-api.json'
        }
      });

      // Clean up
      fs.unlinkSync(testFile);
    });

    test('POST /api/import should reject missing user_id', async () => {
      const testApiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };

      const testFile = createTestFile('test-api.json', JSON.stringify(testApiSpec));

      const response = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID');

      // Clean up
      fs.unlinkSync(testFile);
    });

    test('POST /api/import should reject missing file', async () => {
      const response = await request(app)
        .post('/api/import')
        .field('user_id', 'test-user-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
    });
  });

  describe('Dashboard Endpoints', () => {
    test.skip('GET /api/dashboard/overview should require user_id', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .query({ user_id: 'test-user-123' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data: expect.any(Object)
      });
    });

    test.skip('GET /api/dashboard/overview should reject missing user_id', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required.');
    });
  });

  describe('API Management Endpoints', () => {
    test.skip('GET /api/apis should require user_id', async () => {
      const response = await request(app)
        .get('/api/apis')
        .query({ user_id: 'test-user-123' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'APIs retrieved successfully',
        data: expect.any(Object)
      });
    });

    test.skip('GET /api/apis should reject missing user_id', async () => {
      const response = await request(app)
        .get('/api/apis')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID');
    });
  });

  describe('Connection Test', () => {
    test.skip('GET /api/connection/test should test engine connection', async () => {
      const response = await request(app)
        .get('/api/connection/test')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Connection test successful',
        data: expect.any(Object)
      });
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found',
        errors: {
          path: '/api/unknown',
          method: 'GET'
        }
      });
    });
  });
});