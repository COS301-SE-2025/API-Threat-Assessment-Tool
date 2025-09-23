// tests/unit/engine.commands.test.js
const request = require('supertest');
const path = require('path');
const MockEngine = require('../mocks/engineMock');

/**
 * Engine Commands Tests
 * 
 * Tests for all engine command endpoints from Commands.MD
 * Covers all the new API endpoints that communicate with the Python backend.
 */

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

describe('Engine Commands Tests', () => {
  let app;
  let mockEngine;

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

      test('should handle engine registration failure', async () => {
        mockEngine.setErrorMode(true);
        
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'test',
            password: 'password',
            email: 'test@example.com'
          })
          .expect(500);

        expect(response.body.success).toBe(false);
        mockEngine.setErrorMode(false);
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
      test('should get dashboard overview', async () => {
        const response = await request(app)
          .get('/api/dashboard/overview')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Dashboard overview retrieved successfully'
        });
      });

      test('should handle engine errors', async () => {
        mockEngine.setErrorMode(true);
        
        const response = await request(app)
          .get('/api/dashboard/overview')
          .expect(500);

        expect(response.body.success).toBe(false);
        mockEngine.setErrorMode(false);
      });
    });

    describe('GET /api/dashboard/metrics', () => {
      test('should get dashboard metrics', async () => {
        const response = await request(app)
          .get('/api/dashboard/metrics')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Dashboard metrics retrieved successfully'
        });
      });
    });

    describe('GET /api/dashboard/alerts', () => {
      test('should get dashboard alerts', async () => {
        const response = await request(app)
          .get('/api/dashboard/alerts')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Dashboard alerts retrieved successfully'
        });
      });
    });
  });

  describe('API Management Commands', () => {
    describe('GET /api/apis', () => {
      test('should get all APIs', async () => {
        const response = await request(app)
          .get('/api/apis')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'APIs retrieved successfully'
        });
      });

      test('should accept user_id parameter', async () => {
        const response = await request(app)
          .get('/api/apis')
          .query({ user_id: 'test-user' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/apis/create', () => {
      test('should create API successfully', async () => {
        const response = await request(app)
          .post('/api/apis/create')
          .send({
            name: 'Test API',
            description: 'Test description',
            file: 'test.json'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API created successfully'
        });
      });

      test('should require API name', async () => {
        const response = await request(app)
          .post('/api/apis/create')
          .send({ description: 'Test' })
          .expect(400);

        expect(response.body.message).toBe('API name is required');
      });
    });

    describe('GET /api/apis/details', () => {
      test('should get API details', async () => {
        const response = await request(app)
          .get('/api/apis/details')
          .query({ api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API details retrieved successfully'
        });
      });

      test('should require API ID', async () => {
        const response = await request(app)
          .get('/api/apis/details')
          .expect(400);

        expect(response.body.message).toBe('API ID is required');
      });
    });

    describe('PUT /api/apis/update', () => {
      test('should update API successfully', async () => {
        const response = await request(app)
          .put('/api/apis/update')
          .send({
            api_id: 'test-api-id',
            name: 'Updated API',
            description: 'Updated description'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API updated successfully'
        });
      });

      test('should require API ID', async () => {
        const response = await request(app)
          .put('/api/apis/update')
          .send({ name: 'Test' })
          .expect(400);

        expect(response.body.message).toBe('API ID is required');
      });
    });

    describe('DELETE /api/apis/delete', () => {
      test('should delete API successfully', async () => {
        const response = await request(app)
          .delete('/api/apis/delete')
          .send({ api_id: 'test-api-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API deleted successfully'
        });
      });

      test('should require API ID', async () => {
        const response = await request(app)
          .delete('/api/apis/delete')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('API ID is required');
      });
    });

    describe('POST /api/apis/key/validate', () => {
      test('should validate API key', async () => {
        const response = await request(app)
          .post('/api/apis/key/validate')
          .send({ api_key: 'test-api-key' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API key validated successfully'
        });
      });

      test('should require API key', async () => {
        const response = await request(app)
          .post('/api/apis/key/validate')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('API key is required');
      });
    });

    describe('POST /api/apis/key/set', () => {
      test('should set API key', async () => {
        const response = await request(app)
          .post('/api/apis/key/set')
          .send({ api_key: 'new-api-key' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API key set successfully'
        });
      });

      test('should require API key', async () => {
        const response = await request(app)
          .post('/api/apis/key/set')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('API key is required');
      });
    });

    describe('POST /api/apis/import/url', () => {
      test('should import API from URL', async () => {
        const response = await request(app)
          .post('/api/apis/import/url')
          .send({ url: 'https://api.example.com/swagger.json' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'API imported from URL successfully'
        });
      });

      test('should require URL', async () => {
        const response = await request(app)
          .post('/api/apis/import/url')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('URL is required');
      });
    });
  });

  describe('Scan Management Commands', () => {
    describe('POST /api/scan/create', () => {
      test('should create scan successfully', async () => {
        const response = await request(app)
          .post('/api/scan/create')
          .send({
            client_id: 'test-client-id',
            scan_profile: 'OWASP_API_10'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan created successfully'
        });
      });

      test('should require client ID', async () => {
        const response = await request(app)
          .post('/api/scan/create')
          .send({ scan_profile: 'OWASP_API_10' })
          .expect(400);

        expect(response.body.message).toBe('Client ID is required');
      });

      test('should use default scan profile', async () => {
        const response = await request(app)
          .post('/api/scan/create')
          .send({ client_id: 'test-client-id' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/scan/start', () => {
      test('should start scan successfully', async () => {
        const response = await request(app)
          .post('/api/scan/start')
          .send({
            api_name: 'test-api',
            scan_profile: 'OWASP_API_10'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan started successfully'
        });
      });

      test('should require API name', async () => {
        const response = await request(app)
          .post('/api/scan/start')
          .send({ scan_profile: 'OWASP_API_10' })
          .expect(400);

        expect(response.body.message).toBe('API name is required');
      });
    });

    describe('GET /api/scan/progress', () => {
      test('should get scan progress', async () => {
        const response = await request(app)
          .get('/api/scan/progress')
          .query({ scan_id: 'test-scan-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan progress retrieved successfully'
        });
      });

      test('should require scan ID', async () => {
        const response = await request(app)
          .get('/api/scan/progress')
          .expect(400);

        expect(response.body.message).toBe('Scan ID is required');
      });
    });

    describe('POST /api/scan/stop', () => {
      test('should stop scan successfully', async () => {
        const response = await request(app)
          .post('/api/scan/stop')
          .send({ scan_id: 'test-scan-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan stopped successfully'
        });
      });

      test('should require scan ID', async () => {
        const response = await request(app)
          .post('/api/scan/stop')
          .send({})
          .expect(400);

        expect(response.body.message).toBe('Scan ID is required');
      });
    });

    describe('GET /api/scan/results', () => {
      test('should get scan results', async () => {
        const response = await request(app)
          .get('/api/scan/results')
          .query({ scan_id: 'test-scan-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scan results retrieved successfully'
        });
      });

      test('should require scan ID', async () => {
        const response = await request(app)
          .get('/api/scan/results')
          .expect(400);

        expect(response.body.message).toBe('Scan ID is required');
      });
    });

    describe('GET /api/scan/list', () => {
      test('should list all scans', async () => {
        const response = await request(app)
          .get('/api/scan/list')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Scans retrieved successfully'
        });
      });
    });
  });

  describe('Template Management Commands', () => {
    describe('GET /api/templates/list', () => {
      test('should list all templates', async () => {
        const response = await request(app)
          .get('/api/templates/list')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Templates retrieved successfully'
        });
      });
    });

    describe('GET /api/templates/details', () => {
      test('should get template details', async () => {
        const response = await request(app)
          .get('/api/templates/details')
          .query({ template_id: 'test-template-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Template details retrieved successfully'
        });
      });

      test('should require template ID', async () => {
        const response = await request(app)
          .get('/api/templates/details')
          .expect(400);

        expect(response.body.message).toBe('Template ID is required');
      });
    });

    describe('POST /api/templates/use', () => {
      test('should use template successfully', async () => {
        const response = await request(app)
          .post('/api/templates/use')
          .send({
            template_id: 'test-template-id',
            api_id: 'test-api-id'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Template used successfully'
        });
      });

      test('should require template ID and API ID', async () => {
        const response = await request(app)
          .post('/api/templates/use')
          .send({ template_id: 'test-template-id' })
          .expect(400);

        expect(response.body.message).toBe('Template ID and API ID are required');
      });
    });
  });

  describe('User Profile Commands', () => {
    describe('GET /api/user/profile/get', () => {
      test('should get user profile', async () => {
        const response = await request(app)
          .get('/api/user/profile/get')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User profile retrieved successfully'
        });
      });
    });

    describe('PUT /api/user/profile/update', () => {
      test('should update user profile', async () => {
        const response = await request(app)
          .put('/api/user/profile/update')
          .send({
            username: 'newusername',
            email: 'newemail@example.com'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User profile updated successfully'
        });
      });
    });

    describe('GET /api/user/settings/get', () => {
      test('should get user settings', async () => {
        const response = await request(app)
          .get('/api/user/settings/get')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User settings retrieved successfully'
        });
      });
    });

    describe('PUT /api/user/settings/update', () => {
      test('should update user settings', async () => {
        const response = await request(app)
          .put('/api/user/settings/update')
          .send({ notifications: true })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'User settings updated successfully'
        });
      });
    });
  });

  describe('Report Management Commands', () => {
    describe('GET /api/reports/list', () => {
      test('should list all reports', async () => {
        const response = await request(app)
          .get('/api/reports/list')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Reports retrieved successfully'
        });
      });
    });

    describe('GET /api/reports/details', () => {
      test('should get report details', async () => {
        const response = await request(app)
          .get('/api/reports/details')
          .query({ report_id: 'test-report-id' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Report details retrieved successfully'
        });
      });

      test('should require report ID', async () => {
        const response = await request(app)
          .get('/api/reports/details')
          .expect(400);

        expect(response.body.message).toBe('Report ID is required');
      });
    });

    describe('POST /api/reports/download', () => {
      test('should download report', async () => {
        const response = await request(app)
          .post('/api/reports/download')
          .send({
            report_id: 'test-report-id',
            report_type: 'pdf'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Report downloaded successfully'
        });
      });

      test('should require report ID and type', async () => {
        const response = await request(app)
          .post('/api/reports/download')
          .send({ report_id: 'test-report-id' })
          .expect(400);

        expect(response.body.message).toBe('Report ID and report type are required');
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

  describe('Endpoint Flags Management', () => {
    describe('POST /api/endpoints/flags/add', () => {
      test('should add flags successfully', async () => {
        const response = await request(app)
          .post('/api/endpoints/flags/add')
          .send({
            endpoint_id: 'test-endpoint-id',
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
          .send({ endpoint_id: 'test-endpoint-id' })
          .expect(400);

        expect(response.body.message).toBe('Missing flags');
      });

      test('should require endpoint_id or path/method', async () => {
        const response = await request(app)
          .post('/api/endpoints/flags/add')
          .send({ flags: 'TEST_FLAG' })
          .expect(400);

        expect(response.body.message).toBe('Missing endpoint_id or path/method');
      });
    });

    describe('POST /api/endpoints/flags/remove', () => {
      test('should remove flags successfully', async () => {
        const response = await request(app)
          .post('/api/endpoints/flags/remove')
          .send({
            endpoint_id: 'test-endpoint-id',
            flags: 'CRITICAL_FLAG'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Flags removed successfully'
        });
      });

      test('should require flags', async () => {
        const response = await request(app)
          .post('/api/endpoints/flags/remove')
          .send({ endpoint_id: 'test-endpoint-id' })
          .expect(400);

        expect(response.body.message).toBe('Missing flags');
      });
    });
  });
});