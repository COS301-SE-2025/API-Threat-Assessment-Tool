// tests/integration/owasp.workflow.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

/**
 * OWASP API Complete Workflow Test
 * 
 * Tests the complete security assessment workflow using real API specifications
 * from the fixtures directory.
 */

// Test utilities
const getFixtureFile = (filename) => {
  return path.join(__dirname, '../fixtures/apis', filename);
};

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

describe('OWASP API Complete Workflow Integration Test', () => {
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

    // Clean up temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockEngine.reset();
  });

  describe('OWASP Vulnerable API Workflow', () => {
    test('Should import and analyze OWASP vulnerable API', async () => {
      console.log('🔄 Starting OWASP API security assessment...');

      // Check if fixture file exists, if not create it from embedded spec
      const fixtureFile = getFixtureFile('owasp-vulnerable-api.json');
      let testFile;

      if (fs.existsSync(fixtureFile)) {
        console.log('📁 Using fixture file:', fixtureFile);
        testFile = fixtureFile;
      } else {
        console.log('📝 Creating OWASP API spec from embedded data...');
        // Create the OWASP API spec (you can put your custom_server.json content here)
        const owaspApiSpec = {
          "openapi": "3.1.0",
          "info": {
            "title": "OWASP API Top 10 2023 Vulnerable API",
            "description": "A vulnerable API for automated testing of OWASP API Top 10 2023 issues.",
            "version": "1.0.0"
          },
          "servers": [
            {
              "url": "http://localhost:8000",
              "description": "OWASP Testing server"
            }
          ],
          "paths": {
            "/api/BOLA/profile/{user_id}": {
              "get": {
                "summary": "Get User Profile",
                "description": "Vulnerable: Can access any user's profile",
                "parameters": [
                  {
                    "name": "user_id",
                    "in": "path",
                    "required": true,
                    "schema": { "type": "integer" }
                  }
                ],
                "responses": {
                  "200": { "description": "Successful Response" }
                }
              }
            },
            "/api/BKEN_AUTH/login": {
              "post": {
                "summary": "Login",
                "description": "Vulnerable: Weak authentication, no rate limiting",
                "parameters": [
                  {
                    "name": "username",
                    "in": "query",
                    "required": true,
                    "schema": { "type": "string" }
                  },
                  {
                    "name": "password", 
                    "in": "query",
                    "required": true,
                    "schema": { "type": "string" }
                  }
                ],
                "responses": {
                  "200": { "description": "Successful Response" }
                }
              }
            },
            "/api/SSRF/fetch": {
              "get": {
                "summary": "Fetch URL",
                "description": "Vulnerable: No URL validation",
                "parameters": [
                  {
                    "name": "url",
                    "in": "query", 
                    "required": true,
                    "schema": { "type": "string" }
                  }
                ],
                "responses": {
                  "200": { "description": "Successful Response" }
                }
              }
            }
          }
        };

        testFile = createTestFile('owasp-vulnerable-api.json', JSON.stringify(owaspApiSpec, null, 2));
      }

      // STEP 1: IMPORT
      console.log('📥 Step 1: Importing OWASP Vulnerable API...');
      const importResponse = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);

      expect(importResponse.body).toMatchObject({
        success: true,
        message: 'API imported successfully',
        data: {
          api_id: expect.any(String),
          filename: expect.any(String)
        }
      });

      const apiId = importResponse.body.data.api_id;
      console.log(`✅ API imported successfully: ${apiId}`);

      // Clean up temp file if we created it
      if (!fs.existsSync(fixtureFile)) {
        cleanupTestFile(testFile);
      }

      // STEP 2: SCAN/CREATE
      console.log('🔧 Step 2: Creating OWASP security scan...');
      const createResponse = await request(app)
        .post('/api/scan/create')
        .send({
          client_id: apiId,
          scan_profile: 'OWASP_API_10'
        })
        .expect(200);

      expect(createResponse.body).toMatchObject({
        success: true,
        message: 'Scan created successfully'
      });

      console.log('✅ OWASP security scan created');

      // STEP 3: SCAN/START  
      console.log('🚀 Step 3: Starting vulnerability assessment...');
      const startResponse = await request(app)
        .post('/api/scan/start')
        .send({
          api_name: 'owasp-vulnerable-api-assessment',
          scan_profile: 'OWASP_API_10'
        })
        .expect(200);

      expect(startResponse.body).toMatchObject({
        success: true,
        message: 'Scan started successfully',
        data: {
          scan_id: expect.stringMatching(/^scan_\d+_\d+$/)
        }
      });

      const scanId = startResponse.body.data.scan_id;
      console.log(`✅ Vulnerability assessment started: ${scanId}`);

      // STEP 4: SCAN/RESULTS
      console.log('📊 Step 4: Retrieving OWASP vulnerability findings...');

      // Stop scan to get results
      await request(app)
        .post('/api/scan/stop')
        .send({ scan_id: scanId })
        .expect(200);

      const resultsResponse = await request(app)
        .get('/api/scan/results')
        .query({ scan_id: scanId })
        .expect(200);

      expect(resultsResponse.body).toMatchObject({
        success: true,
        message: 'Scan results retrieved successfully',
        data: {
          result: expect.arrayContaining([
            expect.objectContaining({
              endpoint_id: expect.any(String),
              vulnerability_name: expect.any(String),
              severity: expect.any(String),
              cvss_score: expect.any(Number),
              description: expect.any(String),
              recommendation: expect.any(String),
              test_name: expect.any(String)
            })
          ])
        }
      });

      const vulnerabilities = resultsResponse.body.data.result;
      console.log(`🎯 Assessment complete: ${vulnerabilities.length} OWASP vulnerabilities identified`);

      // Analyze OWASP findings
      console.log('\n🚨 OWASP API TOP 10 2023 FINDINGS:');
      console.log('=====================================');
      
      vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.vulnerability_name}`);
        console.log(`   Severity: ${vuln.severity} (CVSS: ${vuln.cvss_score})`);
        console.log(`   Endpoint: ${vuln.endpoint_id}`);
        console.log(`   Test: ${vuln.test_name}`);
        console.log('');
      });

      // Verify we found OWASP-specific vulnerabilities
      const owaspVulns = vulnerabilities.filter(v => 
        v.vulnerability_name.includes('BOLA') ||
        v.vulnerability_name.includes('Authentication') ||
        v.vulnerability_name.includes('Authorization') ||
        v.vulnerability_name.includes('SSRF')
      );

      expect(owaspVulns.length).toBeGreaterThan(0);
      console.log(`✅ Successfully identified ${owaspVulns.length} OWASP API vulnerabilities!`);
    });
  });

  describe('Company API (Molehill) Workflow', () => {
    test('Should import and analyze company internal API', async () => {
      console.log('🔄 Starting Company API security assessment...');

      // Check for molehill fixture or create embedded version
      const fixtureFile = getFixtureFile('molehill-company-api.json');
      let testFile;

      if (fs.existsSync(fixtureFile)) {
        testFile = fixtureFile;
      } else {
        // Create a simplified version of the molehill API
        const molehillApiSpec = {
          "openapi": "3.0.0",
          "info": {
            "title": "Company API",
            "description": "API for Company's internal systems",
            "version": "1.0.0"
          },
          "servers": [{ "url": "http://localhost:3000" }],
          "paths": {
            "/api/v1/hr/employees/list": {
              "get": {
                "tags": ["HR", "v1"],
                "summary": "list employees",
                "responses": { "200": { "description": "Success" } }
              }
            },
            "/api/v1/it/servers/status": {
              "get": {
                "tags": ["IT", "v1"],
                "summary": "Get server status",
                "responses": {
                  "200": {
                    "description": "Server status with potential sensitive data",
                    "content": {
                      "application/json": {
                        "schema": {
                          "type": "object",
                          "properties": {
                            "adminCredentials": {
                              "type": "object",
                              "properties": {
                                "username": { "type": "string" },
                                "password": { "type": "string" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        testFile = createTestFile('molehill-company-api.json', JSON.stringify(molehillApiSpec, null, 2));
      }

      // Execute the same workflow for Company API
      const importResponse = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);

      const apiId = importResponse.body.data.api_id;
      console.log(`✅ Company API imported: ${apiId}`);

      // Create and start scan
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
          api_name: 'company-internal-api',
          scan_profile: 'OWASP_API_10'
        })
        .expect(200);

      const scanId = scanResponse.body.data.scan_id;

      // Get results
      await request(app)
        .post('/api/scan/stop')
        .send({ scan_id: scanId })
        .expect(200);

      const resultsResponse = await request(app)
        .get('/api/scan/results')
        .query({ scan_id: scanId })
        .expect(200);

      expect(resultsResponse.body.success).toBe(true);
      console.log(`✅ Company API assessment completed successfully`);

      // Clean up temp file if we created it
      if (!fs.existsSync(fixtureFile)) {
        cleanupTestFile(testFile);
      }
    });
  });
});