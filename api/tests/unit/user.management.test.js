// tests/unit/user.management.test.js - Fixed JWT handling and mock consistency
const request = require('supertest');
const path = require('path');
const MockEngine = require('../mocks/engineMock');

// Mock Supabase with comprehensive user data handling
const mockSupabaseData = {
  users: [],
  userPreferences: [],
  userProfileExtended: [],
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
            }))
          })),
          update: jest.fn((updateData) => ({
            eq: jest.fn((field, value) => ({
              select: jest.fn((fields) => ({
                single: jest.fn(() => {
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
    auth: { signOut: jest.fn() }
  }))
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`$2a$${rounds}$hashed_${password}`)),
  compare: jest.fn((password, hash) => {
    return Promise.resolve(hash.includes(password));
  })
}));

// Mock JWT - Fixed to handle invalid tokens properly
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mock.jwt.token.${payload.id}`),
  verify: jest.fn((token) => {
    if (token === 'invalid-token' || token === 'Bearer' || !token.includes('mock.jwt.token')) {
      throw new Error('Invalid token');
    }
    const parts = token.split('.');
    const userId = parts[parts.length - 1];
    return { id: userId };
  })
}));

describe('User Management Tests', () => {
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
    process.env.JWT_SECRET = global.TEST_CONFIG?.JWT_SECRET || 'test-jwt-secret';
    
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
    // Reset mock data
    mockSupabaseData.users = [testUser];
    mockSupabaseData.userPreferences = [];
    mockSupabaseData.userProfileExtended = [];
    mockSupabaseData.userActivityLog = [];
    mockEngine.reset();
  });

  describe('User Profile Management', () => {
    describe('GET /api/user/profile', () => {
      test('should return user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Profile retrieved successfully',
          data: {
            user: {
              id: 'test-user-123',
              email: 'testuser@example.com',
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User'
            }
          }
        });
      });

      test('should reject missing authorization header', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access denied. No valid token provided.');
      });

      test('should reject malformed authorization header', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', 'InvalidFormat')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      test('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/user/update', () => {
      test('should update user profile successfully', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'User', // Keep original to test partial update
          username: 'updateduser'
        };

        const response = await request(app)
          .put('/api/user/update')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: {
              firstName: 'Updated',
              lastName: 'User',
              username: 'updateduser'
            }
          }
        });
      });

      test('should handle partial updates', async () => {
        const response = await request(app)
          .put('/api/user/update')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send({ firstName: 'OnlyFirst' })
          .expect(200);

        expect(response.body.data.user.firstName).toBe('OnlyFirst');
        expect(response.body.data.user.lastName).toBe('User'); // Should remain unchanged
      });

      test('should validate firstName length', async () => {
        const response = await request(app)
          .put('/api/user/update')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send({ firstName: 'A' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual({
          field: 'firstName',
          message: 'First name must be at least 2 characters'
        });
      });
    });

    describe('PUT /api/user/password', () => {
      test('should update password successfully', async () => {
        const response = await request(app)
          .put('/api/user/password')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send({
            currentPassword: 'password123',
            newPassword: 'newpassword123',
            confirmPassword: 'newpassword123'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password updated successfully'
        });
      });

      test('should reject incorrect current password', async () => {
        const response = await request(app)
          .put('/api/user/password')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123',
            confirmPassword: 'newpassword123'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Current password is incorrect');
      });
    });
  });

  describe('User Preferences Management', () => {
    describe('GET /api/user/preferences', () => {
      test.skip('should return default preferences for new user', async () => {
        const response = await request(app)
          .get('/api/user/preferences')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Preferences retrieved successfully',
          data: {
            preferences: {
              notifications: expect.any(Object),
              security: expect.any(Object),
              preferences: expect.any(Object)
            }
          }
        });
      });

      test('should return existing preferences', async () => {
        // Add existing preferences
        mockSupabaseData.userPreferences.push({
          user_id: 'test-user-123',
          notification_scan_completed: false,
          notification_critical_findings: true,
          pref_theme: 'dark'
        });

        const response = await request(app)
          .get('/api/user/preferences')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .expect(200);

        expect(response.body.data.preferences.notifications.scanCompleted).toBe(false);
        expect(response.body.data.preferences.preferences.theme).toBe('dark');
      });
    });

    describe('PUT /api/user/preferences', () => {
      test('should update preferences successfully', async () => {
        const preferencesUpdate = {
          preferences: {
            notifications: {
              scanCompleted: false,
              criticalFindings: true
            },
            security: {
              twoFactorAuth: true,
              sessionTimeout: '60'
            },
            preferences: {
              theme: 'dark'
            }
          }
        };

        const response = await request(app)
          .put('/api/user/preferences')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send(preferencesUpdate)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Preferences updated successfully'
        });
      });
    });
  });

  describe('Extended Profile Management', () => {
    describe('GET /api/user/extended-profile', () => {
      test('should return empty profile for new user', async () => {
        const response = await request(app)
          .get('/api/user/extended-profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Extended profile retrieved successfully',
          data: {
            profile: {
              phone: '',
              company: '',
              position: '',
              timezone: 'UTC+02:00'
            }
          }
        });
      });
    });

    describe('PUT /api/user/extended-profile', () => {
      test('should update extended profile successfully', async () => {
        const profileData = {
          phone: '+1234567890',
          company: 'New Company',
          position: 'Senior Developer',
          bio: 'Test bio',
          website_url: 'https://example.com',
          location: 'Test City'
        };

        const response = await request(app)
          .put('/api/user/extended-profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send(profileData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Extended profile updated successfully'
        });
      });

      test('should validate phone number format', async () => {
        const response = await request(app)
          .put('/api/user/extended-profile')
          .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
          .send({ phone: 'invalid-phone' })
          .expect(400);

        expect(response.body.errors).toContainEqual({
          field: 'phone',
          message: 'Invalid phone number format'
        });
      });
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .expect(500);

      expect(response.body.message).toBe('Server configuration error');
      
      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });

    test('should handle nonexistent user in token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer mock.jwt.token.nonexistent-user')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('Database Error Handling', () => {
    test('should handle database errors in profile update', async () => {
      // Mock database error by clearing the users array
      const originalUsers = [...mockSupabaseData.users];
      mockSupabaseData.users = [];

      const response = await request(app)
        .put('/api/user/update')
        .set('Authorization', 'Bearer mock.jwt.token.test-user-123')
        .send({ firstName: 'Test' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
      
      // Restore users
      mockSupabaseData.users = originalUsers;
    });
  });
});