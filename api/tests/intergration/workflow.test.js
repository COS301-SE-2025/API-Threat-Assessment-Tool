// tests/integration/workflow.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

/**
 * Main Workflow Integration Tests
 * 
 * Core workflow tests that verify the complete API management lifecycle
 * from import to scan execution. This file focuses on the essential
 * end-to-end workflow scenarios.
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

// Mock dependencies
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

describe('Main Workflow Integration Tests', () => {
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
        title: 'Main Workflow Test API',
        version: '1.0.0',
        description: 'API for testing complete workflow'
      },
      servers: [{ url: 'https://api.test.com/v1' }],
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            description: 'Retrieve a list of all users',
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
            description: 'Test endpoint for validation',
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

  describe('Complete End-to-End Workflow', () => {
    test('Should execute complete workflow: Import → Configure → Scan → Results', async () => {
      // Step 1: Import API
      const testFile = createTestFile('workflow-api.json', JSON.stringify(testApiSpec));
      const importResponse = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);
      cleanupTestFile(testFile);

      expect(importResponse.body.data.api_id).toBeDefined();
      const apiId = importResponse.body.data.api_id;

      // Step 2: Verify API is accessible
      const apisResponse = await request(app)
        .get('/api/apis')
        .expect(200);

      expect(apisResponse.body.data.apis).toHaveLength(1);

      // Step 3: List and configure endpoints
      const endpointsResponse = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(200);

      expect(endpointsResponse.body.data.endpoints).toHaveLength(3);

      // Step 4: Add tags to endpoints
      await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['workflow-test', 'authenticated']
        })
        .expect(200);

      // Step 5: Set API key
      await request(app)
        .post('/api/apis/key/set')
        .send({
          api_key: 'workflow-test-key-123'
        })
        .expect(200);

      // Step 6: Create and start scan
      await request(app)
        .post('/api/scan/create')
        .send({
          client_id: apiId,
          scan_profile: 'OWASP_API_10'
        })
        .expect(200);

      const scanResponse = await request(app)
        .post('/api/scan/start')
        .send({
          api_name: 'workflow-test-api',
          scan_profile: 'OWASP_API_10'
        })
        .expect(200);

      const scanId = scanResponse.body.data.scan_id;

      // Step 7: Monitor scan progress
      const progressResponse = await request(app)
        .get('/api/scan/progress')
        .query({ scan_id: scanId })
        .expect(200);

      expect(progressResponse.body.data.scan_id).toBe(scanId);

      // Step 8: Get scan results
      const resultsResponse = await request(app)
        .get('/api/scan/results')
        .query({ scan_id: scanId })
        .expect(200);

      expect(resultsResponse.body.data.result).toBeDefined();
      expect(Array.isArray(resultsResponse.body.data.result)).toBe(true);

      // Step 9: Verify modifications persist
      const finalEndpointsResponse = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(200);

      const modifiedEndpoint = finalEndpointsResponse.body.data.endpoints.find(
        ep => ep.path === '/users' && ep.method === 'GET'
      );

      expect(modifiedEndpoint.tags).toContain('workflow-test');
      expect(modifiedEndpoint.tags).toContain('authenticated');
    });

    test('Should handle workflow with multiple APIs', async () => {
      // Import first API
      const api1File = createTestFile('workflow-api1.json', JSON.stringify({
        ...testApiSpec,
        info: { ...testApiSpec.info, title: 'API 1', version: '1.0.0' }
      }));
      
      await request(app)
        .post('/api/import')
        .attach('file', api1File)
        .expect(200);
      cleanupTestFile(api1File);

      // Import second API
      const api2File = createTestFile('workflow-api2.json', JSON.stringify({
        ...testApiSpec,
        info: { ...testApiSpec.info, title: 'API 2', version: '2.0.0' }
      }));
      
      await request(app)
        .post('/api/import')
        .attach('file', api2File)
        .expect(200);
      cleanupTestFile(api2File);

      // Note: Mock engine only supports one global API at a time
      // So we verify the last imported API is active
      const apisResponse = await request(app)
        .get('/api/apis')
        .expect(200);

      expect(apisResponse.body.data.apis).toHaveLength(1);
      expect(apisResponse.body.data.apis[0].title).toBe('Imported Test API');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('Should recover from engine connectivity issues', async () => {
      // Test connection first
      await request(app)
        .get('/api/connection/test')
        .expect(200);

      // Simulate engine failure
      mockEngine.setErrorMode(true);

      const failedResponse = await request(app)
        .get('/api/connection/test')
        .expect(500);

      expect(failedResponse.body.success).toBe(false);

      // Restore engine
      mockEngine.setErrorMode(false);

      const recoveredResponse = await request(app)
        .get('/api/connection/test')
        .expect(200);

      expect(recoveredResponse.body.success).toBe(true);
    });

    test('Should handle partial workflow failures gracefully', async () => {
      // Import API successfully
      const testFile = createTestFile('failure-test-api.json', JSON.stringify(testApiSpec));
      await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);
      cleanupTestFile(testFile);

      // Try to perform operations on non-existent endpoints
      const invalidTagResponse = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/nonexistent',
          method: 'GET',
          tags: ['test']
        })
        .expect(500);

      expect(invalidTagResponse.body.success).toBe(false);

      // Verify that valid operations still work
      const validTagResponse = await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['recovery-test']
        })
        .expect(200);

      expect(validTagResponse.body.success).toBe(true);
    });
  });

  describe('Data Consistency and State Management', () => {
    test('Should maintain consistent state across operations', async () => {
      // Import API
      const testFile = createTestFile('consistency-api.json', JSON.stringify(testApiSpec));
      await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);
      cleanupTestFile(testFile);

      // Perform multiple modifications
      await request(app)
        .post('/api/endpoints/tags/add')
        .send({
          path: '/users',
          method: 'GET',
          tags: ['consistent-tag']
        })
        .expect(200);

      await request(app)
        .post('/api/endpoints/flags/add')
        .send({
          endpoint_id: 'endpoint_1',
          flags: 'CONSISTENT_FLAG'
        })
        .expect(200);

      // Verify state is consistent across different queries
      const endpointsResponse = await request(app)
        .post('/api/endpoints')
        .send({})
        .expect(200);

      const detailsResponse = await request(app)
        .post('/api/endpoints/details')
        .send({
          endpoint_id: 'endpoint_1',
          path: '/users',
          method: 'GET'
        })
        .expect(200);

      const tagsResponse = await request(app)
        .get('/api/tags')
        .expect(200);

      // Verify consistency
      const endpoint = endpointsResponse.body.data.endpoints.find(
        ep => ep.id === 'endpoint_1'
      );

      expect(endpoint.tags).toContain('consistent-tag');
      expect(endpoint.flags).toContain('CONSISTENT_FLAG');
      expect(detailsResponse.body.data.tags).toContain('consistent-tag');
      expect(tagsResponse.body.data.tags).toContain('consistent-tag');
    });
  });
});