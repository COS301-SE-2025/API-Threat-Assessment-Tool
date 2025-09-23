// tests/unit/api.test.js
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

// Mock Supabase client with dynamic responses
const mockSupabaseData = {
  users: [],
  insertedUser: null
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'users') {
        return {
          select: jest.fn((fields) => ({
            eq: jest.fn((field, value) => ({
              single: jest.fn(() => {
                // Find user by the specified field and value
                const user = mockSupabaseData.users.find(u => u[field] === value);
                if (user) {
                  return Promise.resolve({
                    data: user,
                    error: null
                  });
                } else {
                  return Promise.resolve({
                    data: null,
                    error: { message: 'User not found' }
                  });
                }
              })
            })),
            ilike: jest.fn((field, value) => {
              // Find users with case-insensitive matching
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
                // Create a new user based on the input data
                const newUser = {
                  id: userData[0].id || 'new-user-id',
                  email: userData[0].email,
                  username: userData[0].username,
                  first_name: userData[0].first_name,
                  last_name: userData[0].last_name,
                  email_confirmed: userData[0].email_confirmed || false,
                  created_at: userData[0].created_at || new Date().toISOString()
                };
                
                // Store the user in our mock data
                mockSupabaseData.users.push(newUser);
                mockSupabaseData.insertedUser = newUser;
                
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

// Mock bcrypt with dynamic responses
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`$2a$${rounds}$hashed_${password}`)),
  compare: jest.fn((password, hash) => {
    // Simple mock: return true if the hash contains the password
    return Promise.resolve(hash.includes(password));
  })
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mock.jwt.token.${payload.id}`),
  verify: jest.fn((token) => {
    // Extract user ID from mock token
    const parts = token.split('.');
    const userId = parts[parts.length - 1];
    return { id: userId };
  })
}));

describe('API Unit Tests', () => {
  let app;
  let mockEngine;
  let originalEnginePort;

  beforeAll(async () => {
    // Start mock engine
    mockEngine = new MockEngine(global.TEST_CONFIG.ENGINE_PORT);
    await mockEngine.start();

    // Set up environment
    originalEnginePort = process.env.ENGINE_PORT;
    process.env.ENGINE_PORT = global.TEST_CONFIG.ENGINE_PORT;
    
    // Clear require cache and load app
    const indexPath = path.join(__dirname, '../../index.js');
    delete require.cache[indexPath];
    app = require('../../index.js');
  });

  afterAll(async () => {
    // Stop mock engine
    if (mockEngine) {
      await mockEngine.stop();
    }
    
    // Restore original port
    if (originalEnginePort) {
      process.env.ENGINE_PORT = originalEnginePort;
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
    mockSupabaseData.users = [];
    mockSupabaseData.insertedUser = null;
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
          version: '1.0.0',
          endpoints: expect.objectContaining({
            health: 'GET /',
            importApi: 'POST /api/import',
            listEndpoints: 'POST /api/endpoints',
            endpointDetails: 'POST /api/endpoints/details',
            addTags: 'POST /api/endpoints/tags/add',
            removeTags: 'POST /api/endpoints/tags/remove',
            replaceTags: 'POST /api/endpoints/tags/replace',
            listTags: 'GET /api/tags'
          })
        }
      });
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
      test('should create new user with valid data', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          firstName: 'Test',
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
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName
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

      test('should reject short password', async () => {
        const userData = {
          email: 'test@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User'
        };

        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual({
          field: 'password',
          message: 'Password must be at least 8 characters'
        });
      });
    });

    describe('POST /api/auth/login', () => {
      beforeEach(() => {
        // Add a test user to mock database
        mockSupabaseData.users.push({
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          password: '$2a$10$hashed_password123', // Matches our bcrypt mock
          first_name: 'Test',
          last_name: 'User',
          email_confirmed: true,
          created_at: new Date().toISOString()
        });
      });

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
      beforeEach(() => {
        // Add a test user to mock database
        mockSupabaseData.users.push({
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          email_confirmed: true,
          created_at: new Date().toISOString()
        });
      });

      test('should return user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-id')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Profile retrieved',
          data: {
            user: expect.objectContaining({
              id: 'test-user-id',
              email: 'test@example.com'
            })
          }
        });
      });

      test('should reject missing authorization header', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Missing or invalid Authorization header');
      });
    });

    describe('POST /api/auth/logout', () => {
      test('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Logged out'
        });
      });
    });
  });

  describe('API Import Endpoints', () => {
    test('POST /api/import should import OpenAPI file', async () => {
      // Create a test OpenAPI file
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

    test('POST /api/import should reject missing file', async () => {
      const response = await request(app)
        .post('/api/import')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
    });
  });

  describe('Scan Endpoints', () => {
    test('POST /api/scan/start should start a new scan', async () => {
      const scanData = {
        api_id: 'test-api-id',
        template_id: 'test-template-id'
      };

      const response = await request(app)
        .post('/api/scan/start')
        .send(scanData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan started successfully',
        data: {
          scan_id: expect.any(String)
        }
      });
    });

    test('GET /api/scan/status should return scan status', async () => {
      const response = await request(app)
        .get('/api/scan/status')
        .query({ scan_id: 'test-scan-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan status retrieved successfully',
        data: {
          status: expect.any(String)
        }
      });
    });

    test('POST /api/scan/stop should stop a scan', async () => {
      const response = await request(app)
        .post('/api/scan/stop')
        .send({ scan_id: 'test-scan-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan stopped successfully'
      });
    });

    test('GET /api/scan/results should return scan results', async () => {
      const response = await request(app)
        .get('/api/scan/results')
        .query({ scan_id: 'test-scan-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scan results retrieved successfully',
        data: expect.any(Object)
      });
    });

    test('GET /api/scan/list should list all scans', async () => {
      const response = await request(app)
        .get('/api/scan/list')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scans retrieved successfully',
        data: expect.any(Array)
      });
    });
  });

  describe('Template Endpoints', () => {
    test('GET /api/templates/list should list all templates', async () => {
      const response = await request(app)
        .get('/api/templates/list')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Templates retrieved successfully',
        data: expect.any(Array)
      });
    });

    test('GET /api/templates/details should return template details', async () => {
      const response = await request(app)
        .get('/api/templates/details')
        .query({ template_id: 'test-template-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Template details retrieved successfully',
        data: expect.any(Object)
      });
    });

    test('POST /api/templates/use should use a template', async () => {
      const response = await request(app)
        .post('/api/templates/use')
        .send({ template_id: 'test-template-id', api_id: 'test-api-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Template used successfully',
        data: expect.any(Object)
      });
    });
  });

  describe('User Profile and Settings Endpoints', () => {
    test('GET /api/user/profile/get should return user profile', async () => {
      const response = await request(app)
        .get('/api/user/profile/get')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User profile retrieved successfully',
        data: expect.any(Object)
      });
    });

    test('PUT /api/user/profile/update should update user profile', async () => {
      const updateData = {
        username: 'newusername',
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/api/user/profile/update')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User profile updated successfully'
      });
    });

    test('GET /api/user/settings/get should return user settings', async () => {
      const response = await request(app)
        .get('/api/user/settings/get')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User settings retrieved successfully',
        data: expect.any(Object)
      });
    });

    test('PUT /api/user/settings/update should update user settings', async () => {
      const updateData = {
        notifications: true
      };

      const response = await request(app)
        .put('/api/user/settings/update')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User settings updated successfully'
      });
    });
  });

  describe('Report Endpoints', () => {
    test('GET /api/reports/list should list all reports', async () => {
      const response = await request(app)
        .get('/api/reports/list')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Reports retrieved successfully',
        data: expect.any(Array)
      });
    });

    test('GET /api/reports/details should return report details', async () => {
      const response = await request(app)
        .get('/api/reports/details')
        .query({ report_id: 'test-report-id' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Report details retrieved successfully',
        data: expect.any(Object)
      });
    });

    test('POST /api/reports/download should download report', async () => {
      const response = await request(app)
        .post('/api/reports/download')
        .send({ report_id: 'test-report-id', report_type: 'pdf' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Report downloaded successfully',
        data: expect.any(Object)
      });
    });
  });

  describe('Connection Test Endpoint', () => {
    test('GET /api/connection/test should test connection', async () => {
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