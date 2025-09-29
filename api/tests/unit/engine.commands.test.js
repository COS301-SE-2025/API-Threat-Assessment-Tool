// tests/unit/engine.commands.test.js - Fixed with proper user_id handling and authentication
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

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
    auth: { signOut: jest.fn() }
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

describe('Engine Commands Tests', () => {
  let app;
  let mockEngine;
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
  });

  afterAll(async () => {
    if (mockEngine) {
      await mockEngine.stop();
    }
  });

  beforeEach(() => {
    mockEngine.reset();
  });

  describe('Authentication Commands', () => {
    describe('POST /api/auth/register', () => {
      test('should register user successfully', async () => {
        const userData = {
          username: 'newuser',
          password: 'password123',
          email: 'newuser@example.com'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User registered successfully'
        });
      });

      test('should require all fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ username: 'test' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Missing required fields');
      });
    });

    describe('POST /api/auth/check-login', () => {
      test('should validate login successfully', async () => {
        const response = await request(app)
          .post('/api/auth/check-login')
          .send({
            username: 'testuser',
            password: 'password123'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Login validated successfully'
        });
      });

      test('should require username and password', async () => {
        const response = await request(app)
          .post('/api/auth/check-login')
          .send({ username: 'test' })
          .expect(400);

        expect(response.body.message).toBe('Missing username or password');
      });
    });

    describe('POST /api/auth/google', () => {
      test('should handle Google OAuth login', async () => {
        const response = await request(app)
          .post('/api/auth/google')
          .send({ token: 'google-oauth-token' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Google login successful'
        });
      });

      test('should require Google token', async () => {
        const response = await request(app)
          .post('/api/auth/google')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('Missing Google OAuth token');
      });
    });
  });

  describe('Dashboard Commands', () => {
    describe('GET /api/dashboard/overview', () => {
      test('should get dashboard overview with user_id', async () => {
        const response = await request(app)
          .get('/api/dashboard/overview')
          .query({ user_id: testUserId })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Dashboard overview retrieved successfully'
        });
      });

      test('should require user_id', async () => {
        const response = await request(app)
          .get('/api/dashboard/overview')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User ID is required.');
      });
    });
  });

  describe('API Management Commands', () => {
    describe('GET /api/apis', () => {
      test('should list APIs with user_id', async () => {
        const response = await request(app)
          .get('/api/apis')
          .query({ user_id: testUserId })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'APIs retrieved successfully'
        });
      });

      test('should require user_id', async () => {
        const response = await request(app)
          .get('/api/apis')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/apis/details', () => {
      test('should get API details', async () => {
        const response = await request(app)
          .get('/api/apis/details')
          .query({ api_id: 'test-api-id', user_id: testUserId })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API details retrieved successfully'
        });
      });

      test('should require API ID', async () => {
        const response = await request(app)
          .get('/api/apis/details')
          .query({ user_id: testUserId })
          .expect(400);

        expect(response.body.message).toBe('API ID is required');
      });
    });

    describe('POST /api/import', () => {
      test('should import API from file with user_id', async () => {
        const tempFile = path.join(__dirname, '../temp/test-api.json');
        
        // Create temp directory and file
        const tempDir = path.dirname(tempFile);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFile, JSON.stringify({
          openapi: '3.0.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {}
        }));

        const response = await request(app)
          .post('/api/import')
          .field('user_id', testUserId) // Add required user_id
          .attach('file', tempFile)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API imported successfully'
        });

        fs.unlinkSync(tempFile);
      });

      test('should require user_id', async () => {
        const tempFile = path.join(__dirname, '../temp/test-api.json');
        
        const tempDir = path.dirname(tempFile);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFile, JSON.stringify({
          openapi: '3.0.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {}
        }));

        const response = await request(app)
          .post('/api/import')
          .attach('file', tempFile)
          .expect(400);

        expect(response.body.success).toBe(false);

        fs.unlinkSync(tempFile);
      });
    });
  });

  describe('Endpoint Management Commands', () => {
    describe('POST /api/endpoints', () => {
      test('should list endpoints with required fields', async () => {
        const response = await request(app)
          .post('/api/endpoints')
          .send({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Endpoints retrieved successfully'
        });
      });
    });

    describe('POST /api/endpoints/details', () => {
      test('should get endpoint details', async () => {
        const response = await request(app)
          .post('/api/endpoints/details')
          .send({ 
            endpoint_id: 'test-endpoint-id',
            user_id: testUserId,
            api_id: 'test-api-id'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Endpoint details retrieved successfully'
        });
      });

      test('should require endpoint_id', async () => {
        const response = await request(app)
          .post('/api/endpoints/details')
          .send({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(400);

        expect(response.body.message).toBe('Missing endpoint_id');
      });
    });

    describe('POST /api/endpoints/tags/add', () => {
      test('should add tags with all required fields', async () => {
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/test',
            method: 'GET',
            tags: ['new-tag'],
            user_id: testUserId,
            api_id: 'test-api-id'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags added successfully'
        });
      });

      test('should require tags array', async () => {
        const response = await request(app)
          .post('/api/endpoints/tags/add')
          .send({
            path: '/test',
            method: 'GET',
            user_id: testUserId,
            api_id: 'test-api-id'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Tag Management Commands', () => {
    describe('GET /api/tags', () => {
      test('should list all tags with required parameters', async () => {
        const response = await request(app)
          .get('/api/tags')
          .query({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tags retrieved successfully'
        });
      });

      test('should require user_id and api_id', async () => {
        const response = await request(app)
          .get('/api/tags')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Scan Management Commands', () => {
    describe('POST /api/scan/create', () => {
      test('should create scan with user_id', async () => {
        const response = await request(app)
          .post('/api/scan/create')
          .send({
            user_id: testUserId,
            api_id: 'test-api-id',
            scan_profile: 'OWASP_API_10'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan created successfully'
        });
      });
    });

    describe('POST /api/scan/start', () => {
      test('should start scan with required fields', async () => {
        const response = await request(app)
          .post('/api/scan/start')
          .send({
            api_id: 'test-api-id',
            user_id: testUserId,
            scan_profile: 'OWASP_API_10'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan started successfully'
        });
      });
    });

    describe('POST /api/scan/status', () => {
      test('should get scan status', async () => {
        const response = await request(app)
          .post('/api/scan/status')
          .send({ scan_id: 'test-scan-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan status retrieved successfully'
        });
      });

      test('should require scan_id', async () => {
        const response = await request(app)
          .post('/api/scan/status')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/scan/results', () => {
      test('should get scan results with required parameters', async () => {
        const response = await request(app)
          .get('/api/scan/results')
          .query({ 
            scan_id: 'test-scan-id',
            user_id: testUserId,
            api_id: 'test-api-id'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan results retrieved successfully'
        });
      });
    });

    describe('GET /api/scan/list', () => {
      test('should list scans with user_id', async () => {
        const response = await request(app)
          .get('/api/scan/list')
          .query({ user_id: testUserId })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scans retrieved successfully'
        });
      });
    });
  });

  describe('Schedule Management Commands', () => {
    describe('GET /api/scans/schedule', () => {
      test('should get schedule with required parameters', async () => {
        const response = await request(app)
          .get('/api/scans/schedule')
          .query({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Schedule retrieved successfully.'
        });
      });

      test('should require user_id and api_id', async () => {
        const response = await request(app)
          .get('/api/scans/schedule')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/scans/schedule', () => {
      test('should create schedule', async () => {
        const response = await request(app)
          .post('/api/scans/schedule')
          .send({
            user_id: testUserId,
            api_id: 'test-api-id',
            frequency: 'daily',
            is_enabled: true
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Schedule saved successfully.'
        });
      });
    });

    describe('DELETE /api/scans/schedule', () => {
      test('should delete schedule', async () => {
        const response = await request(app)
          .delete('/api/scans/schedule')
          .send({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Schedule deleted successfully.'
        });
      });
    });
  });

  describe('API Sharing Commands', () => {
    describe('POST /api/apis/share', () => {
      test('should share API', async () => {
        const response = await request(app)
          .post('/api/apis/share')
          .send({
            owner_user_id: testUserId,
            api_id: 'test-api-id',
            email: 'share@example.com',
            permission: 'read'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/apis/shares', () => {
      test('should list API shares', async () => {
        const response = await request(app)
          .get('/api/apis/shares')
          .query({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/apis/share', () => {
      test('should revoke API access', async () => {
        const response = await request(app)
          .delete('/api/apis/share')
          .send({
            owner_user_id: testUserId,
            api_id: 'test-api-id',
            revoke_user_id: 'other-user-id'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/apis/leave-share', () => {
      test('should leave API share', async () => {
        const response = await request(app)
          .delete('/api/apis/leave-share')
          .send({ user_id: testUserId, api_id: 'test-api-id' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Connection Test Command', () => {
    describe('GET /api/connection/test', () => {
      test('should test connection successfully', async () => {
        const response = await request(app)
          .get('/api/connection/test')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Connection test successful'
        });
      });

      test('should handle connection failure', async () => {
        mockEngine.setErrorMode(true);
        
        const response = await request(app)
          .get('/api/connection/test')
          .expect(500);

        expect(response.body.success).toBe(false);
        mockEngine.setErrorMode(false);
      });
    });
  });
});