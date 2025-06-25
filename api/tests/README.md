# AT-AT API Testing Suite

Comprehensive unit and integration tests for the AT-AT API Threat Assessment Tool.

## 🧪 Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── api.test.js        # API endpoint tests
│   └── endpoints.test.js  # Endpoint and tag management tests
├── integration/           # Full workflow integration tests
│   └── workflow.test.js   # End-to-end API workflow tests
├── mocks/                 # Mock utilities and test doubles
│   └── engineMock.js      # Python engine mock server
├── fixtures/              # Test data and fixtures
│   └── testData.js        # Sample data for tests
├── setup.js               # Global test configuration
├── testRunner.js          # Custom test runner
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev jest supertest @types/jest jest-environment-node
```

### 2. Run All Tests

```bash
npm test
```

### 3. Run Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 📋 Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ci` | CI-friendly test run |

## 🔧 Test Configuration

Tests are configured using Jest with the following key settings:

- **Test Environment**: Node.js
- **Setup File**: `tests/setup.js`
- **Test Pattern**: `tests/**/*.test.js`
- **Coverage Directory**: `coverage/`
- **Timeout**: 30 seconds (for integration tests)

## 🎯 Test Coverage

### Unit Tests Cover:

- **Authentication Endpoints**
  - User registration with validation
  - Login with username/email
  - JWT token verification
  - Logout functionality

- **API Import**
  - OpenAPI file upload
  - File validation
  - Error handling

- **Endpoint Management**
  - List all endpoints
  - Get endpoint details
  - Parameter validation

- **Tag Management**
  - Add tags to endpoints
  - Remove specific tags
  - Replace all tags
  - List all system tags

- **Error Handling**
  - Invalid requests
  - Missing parameters
  - Malformed data
  - Network errors

### Integration Tests Cover:

- **Complete Workflow**
  1. Import API specification
  2. List imported endpoints
  3. Get endpoint details
  4. Add tags to endpoints
  5. Manage tag operations
  6. Verify changes persist

- **Concurrent Operations**
  - Multiple simultaneous requests
  - Tag operations on different endpoints
  - Data consistency

- **Error Recovery**
  - Invalid endpoint references
  - Missing required parameters
  - Engine communication failures

## 🎭 Mock Engine

The test suite includes a comprehensive mock Python engine that simulates the behavior of the actual Python backend:

### Features:
- **Complete API Simulation**: Handles all engine commands
- **Stateful Operations**: Maintains endpoint and tag state
- **Error Simulation**: Returns appropriate error responses
- **Performance**: Fast execution without Python dependencies

### Mock Data:
- Sample APIs with multiple endpoints
- Realistic endpoint metadata
- Tag management operations
- Error scenarios

## 📊 Test Data & Fixtures

### Provided Test Data:

- **Sample OpenAPI Specifications**
  - Pet Store API (comprehensive example)
  - Simple test APIs
  - Invalid specifications for error testing

- **User Data**
  - Valid registration data
  - Invalid email formats
  - Password validation cases
  - Missing required fields

- **Endpoint Data**
  - Various HTTP methods
  - Different path patterns
  - Tag combinations
  - Error scenarios

### Helper Functions:

```javascript
const { createTempApiFile, cleanupTempFile } = require('./fixtures/testData');

// Create temporary test file
const filePath = createTempApiFile('test-api.json', customApiSpec);

// Clean up after test
cleanupTempFile(filePath);
```

## 🐛 Debugging Tests

### Verbose Output

```bash
npm run test:unit -- --verbose
```

### Running Single Test File

```bash
npx jest tests/unit/api.test.js
```

### Running Specific Test

```bash
npx jest -t "should import OpenAPI file"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/unit/api.test.js
```

## 🔍 Code Quality

### Linting Checks:
- No hardcoded URLs or ports
- Proper test descriptions
- Mock usage instead of console.log
- Consistent naming conventions

### Best Practices:
- Each test is independent
- Proper setup/teardown
- Meaningful assertions
- Error case coverage

## 📈 Performance Considerations

- **Fast Execution**: Mock engine eliminates Python startup time
- **Parallel Testing**: Unit tests run in parallel
- **Resource Cleanup**: Automatic cleanup of test artifacts
- **Memory Management**: Mock data reset between tests

## 🔧 Customization

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/`
2. **Integration Tests**: Add to `tests/integration/`
3. **Mock Data**: Extend `tests/fixtures/testData.js`
4. **Mock Behavior**: Modify `tests/mocks/engineMock.js`

### Environment Configuration

```javascript
// tests/setup.js
global.TEST_CONFIG = {
  TEST_PORT: 3002,
  ENGINE_PORT: 9012,
  JWT_SECRET: 'test_secret'
};
```

## 🚨 Troubleshooting

### Common Issues:

1. **Port Conflicts**: Tests use ports 3002 and 9012
2. **File Permissions**: Ensure write access for temp files
3. **Mock Engine**: Verify mock engine starts before tests
4. **Environment Variables**: Check test environment setup

### Solutions:

```bash
# Kill processes on test ports
lsof -ti:3002 | xargs kill -9
lsof -ti:9012 | xargs kill -9

# Clean test artifacts
rm -f test-*.json endpoint-*.json *-tags.json

# Reset test environment
npm run test:ci
```

## 📝 Contributing

When adding new tests:

1. Follow existing naming conventions
2. Include both success and error cases
3. Add appropriate test data to fixtures
4. Update mock engine if needed
5. Document any new test patterns

## 🎯 Future Enhancements

- **Performance Tests**: Load testing for concurrent requests
- **Security Tests**: Authentication and authorization edge cases
- **API Contract Tests**: OpenAPI specification validation
- **End-to-End Tests**: Full application workflow with real Python engine
- **Snapshot Testing**: API response structure validation