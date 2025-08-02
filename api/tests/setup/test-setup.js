// tests/setup.js
/**
 * Global test configuration and setup
 * This file is loaded before all tests to configure the testing environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-supabase-key';

// Global test configuration
global.TEST_CONFIG = {
  ENGINE_PORT: 9012, // Different port from production to avoid conflicts
  TEST_TIMEOUT: 30000, // 30 seconds timeout for tests
  API_BASE_URL: 'http://localhost:3001'
};

// Set Jest timeout
jest.setTimeout(global.TEST_CONFIG.TEST_TIMEOUT);

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate a random string for test data
   * @param {number} length - Length of the string
   * @returns {string}
   */
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate test user data
   * @returns {object} User data for testing
   */
  generateTestUser: () => ({
    email: `test.${global.testUtils.randomString(8)}@example.com`,
    password: 'password123',
    username: `testuser${global.testUtils.randomString(6)}`,
    firstName: 'Test',
    lastName: 'User'
  })
};

// Setup and teardown for all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});