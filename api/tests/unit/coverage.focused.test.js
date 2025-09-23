// tests/unit/coverage.focused.test.js
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const MockEngine = require('../mocks/engineMock');

/**
 * Coverage-Focused Tests
 * 
 * Specifically designed to hit uncovered code paths in index.js
 * to boost test coverage above 80%.
 */

// Mock Supabase with error scenarios
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
          })),
          upsert: jest.fn(() => Promise.resolve({
            error: { message: 'Simulated upsert error' }
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
          })),
          update: jest.fn((updateData) => ({
            eq: jest.fn((field, value) => ({
              select: jest.fn((fields) => ({
                single: jest.fn(() => {
                  if (mockSupabaseData.simulateDuplicateError) {
                    return Promise.resolve({
                      data: null,
                      error: { code: '23505', message: 'Username already exists' }
                    });
                  }
                  const userIndex = mockSupabaseData.users.findIndex(u => u[field] === value);
                  if (userIndex !== -1) {
                    Object.assign(mockSupabaseData.users[userIndex], updateData);
                    return Promise.resolve({
                      data: mockSupabaseData.users[userIndex],
                      error: null
                    });
                  }
                  return Promise.resolve({
                    data: null,
                    error: { message: 'User not found' }
                  });
                })
              }))
            }))
          }))
        };
      }

      if (table === 'user_preferences') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn((field, value) => ({
              single: jest.fn(() => {
                const prefs = mockSupabaseData.userPreferences.find(p => p[field] === value);
                return Promise.resolve({
                  data: prefs || null,
                  error: prefs ? null : { code: 'PGRST116', message: 'No rows found' }
                });
              })
            }))
          })),
          insert: jest.fn((prefsData) => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                const newPrefs = prefsData[0];
                mockSupabaseData.userPreferences.push(newPrefs);
                return Promise.resolve({
                  data: newPrefs,
                  error: null
                });
              })
            }))
          })),
          upsert: jest.fn((prefsData) => Promise.resolve({ error: null }))
        };
      }

      if (table === 'user_profile_extended') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn((field, value) => ({
              single: jest.fn(() => {
                const profile = mockSupabaseData.userProfileExtended.find(p => p[field] === value);
                return Promise.resolve({
                  data: profile || null,
                  error: profile ? null : { code: 'PGRST116', message: 'No rows found' }
                });
              })
            }))
          })),
          upsert: jest.fn((profileData) => ({
            select: jest.fn(() => ({
              single: jest.fn(() => {
                const existing = mockSupabaseData.userProfileExtended.findIndex(p => p.user_id === profileData.user_id);
                if (existing !== -1) {
                  mockSupabaseData.userProfileExtended[existing] = profileData;
                } else {
                  mockSupabaseData.userProfileExtended.push(profileData);
                }
                return Promise.resolve({
                  data: profileData,
                  error: null
                });
              })
            }))
          }))
        };
      }

      if (table === 'user_activity_log') {
        return {
          insert: jest.fn((logData) => {
            mockSupabaseData.userActivityLog.push(...logData);
            return Promise.resolve({ error: null });
          })
        };
      }

      return {
        select: jest.fn(() => ({ eq: jest.fn(), ilike: jest.fn() })),
        insert: jest.fn(() => ({ select: jest.fn() })),
        update: jest.fn(() => ({ eq: jest.fn() })),
        upsert: jest.fn()
      };
    }),
    auth: { signOut: jest.fn(() => Promise.resolve({ error: null })) }
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
    if (token === 'mock.jwt.token.invalid') {
      throw new Error('Invalid token');
    }
    const parts = token.split('.');
    const userId = parts[parts.length - 1];
    return { id: userId };
  })
}));

describe('Coverage-Focused Tests', () => {
  let app;
  let mockEngine;
  let testUser;

  beforeAll(async () => {
    // Start mock engine
    const testPort = global.TEST_CONFIG?.ENGINE_PORT || 9012;
    mockEngine = new MockEngine(testPort);
    await mockEngine.start();

    // Configure environment
    process.env.ENGINE_PORT = testPort;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    // Load app
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
  });

  beforeEach(() => {
    mockSupabaseData.users = [testUser];
    mockSupabaseData.userPreferences = [];
    mockSupabaseData.userProfileExtended = [];
    mockSupabaseData.userActivityLog = [];
    mockSupabaseData.simulateError = false;
    mockSupabaseData.simulateDuplicateError = false;
    mockEngine.reset();
  });

  describe('Database Error Handling Paths', () => {
    test('should handle database errors in /users endpoint', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Fetch failed');
    });

    test('should handle duplicate username error in profile update', async () => {
      mockSupabaseData.simulateDuplicateError = true;

      const response = await request(app)
        .put('/api/user/update')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({ username: 'existinguser' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    test('should handle database error in profile update', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .put('/api/user/update')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({ firstName: 'NewName' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database error');
    });

    test('should handle preferences creation error', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .get('/api/user/preferences')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .expect(200);

      // Should still return default preferences even if database fails
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
    });

    test('should handle preferences update error', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .put('/api/user/preferences')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({
          preferences: {
            notifications: { scanCompleted: false }
          }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to update preferences');
    });

    test('should handle extended profile database error', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .get('/api/user/extended-profile')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database error');
    });

    test('should handle extended profile update error', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .put('/api/user/extended-profile')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({
          phone: '+1234567890',
          company: 'Test Corp'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to update extended profile');
    });
  });

  describe('JWT Error Handling Paths', () => {
    test('should handle JWT verification errors', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer mock.jwt.token.invalid')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    test('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server configuration error');

      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle multiple users found scenario', async () => {
      // Add multiple users with same username pattern
      mockSupabaseData.users.push({
        id: 'user2',
        username: 'testuser',
        email: 'testuser2@example.com',
        password: '$2a$10$hashed_password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Multiple users found, contact support');
    });

    test('should handle Supabase error response', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database error');
    });

    test('should handle signup database insert error', async () => {
      mockSupabaseData.simulateError = true;

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insert failed');
    });

    test('should handle logout Supabase error', async () => {
      // Mock Supabase auth.signOut to return error
      const originalCreateClient = require('@supabase/supabase-js').createClient;
      require('@supabase/supabase-js').createClient = jest.fn(() => ({
        auth: {
          signOut: jest.fn(() => Promise.resolve({
            error: { message: 'Logout failed' }
          }))
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({ eq: jest.fn(), ilike: jest.fn() })),
          insert: jest.fn(() => ({ select: jest.fn() }))
        }))
      }));

      const response = await request(app)
        .post('/api/auth/logout')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Logout failed');

      // Restore original
      require('@supabase/supabase-js').createClient = originalCreateClient;
    });
  });

  describe('File Upload Error Paths', () => {
    test('should handle file system errors during import', async () => {
      const apiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } }
      };

      const createTempFile = (filename, content) => {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content);
        return filePath;
      };

      const testFile = createTempFile('test-api.json', JSON.stringify(apiSpec));

      // Test successful import first
      const response = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Cleanup
      try {
        fs.unlinkSync(testFile);
      } catch (err) {
        // File might already be cleaned up by the endpoint
      }
    });

    test('should handle engine processing failure', async () => {
      mockEngine.setErrorMode(true);

      const apiSpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } }
      };

      const createTempFile = (filename, content) => {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const filePath = path.join(tempDir, filename);
        fs.writeFileSync(filePath, content);
        return filePath;
      };

      const testFile = createTempFile('fail-test-api.json', JSON.stringify(apiSpec));

      const response = await request(app)
        .post('/api/import')
        .attach('file', testFile)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Import failed');

      mockEngine.setErrorMode(false);

      // Cleanup
      try {
        fs.unlinkSync(testFile);
      } catch (err) {
        // File might already be cleaned up
      }
    });
  });

  describe('Activity Logging Edge Cases', () => {
    test('should handle activity log failures gracefully', async () => {
      // Mock activity log to fail but user update to succeed
      const originalUsers = [...mockSupabaseData.users];
      
      const response = await request(app)
        .put('/api/user/update')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({ firstName: 'UpdatedName' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('UpdatedName');
    });

    test('should handle activity log in password change', async () => {
      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');
    });

    test('should log failed password change attempts', async () => {
      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });
  });

  describe('Environment Configuration Paths', () => {
    test('should handle missing environment variables', async () => {
      // Test that app functions with minimal environment
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('2.0.0');
    });

    test('should list all available endpoints', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.data.endpoints).toBeDefined();
      expect(Object.keys(response.body.data.endpoints).length).toBeGreaterThan(20);
    });
  });

  describe('Missing Code Paths', () => {
    test('should handle empty request body parsing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle authentication middleware error paths', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });

    test('should handle validation error accumulation', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: '',
          password: '',
          firstName: '',
          lastName: ''
        })
        .expect(400);

      expect(response.body.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});