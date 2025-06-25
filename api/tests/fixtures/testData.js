// tests/fixtures/testData.js

/**
 * Test data and fixtures for API testing
 */

const sampleOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sample Pet Store API',
    description: 'A simple example API for testing the import functionality',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'https://api.petstore.example.com/v1',
      description: 'Production server'
    }
  ],
  paths: {
    '/pets': {
      get: {
        summary: 'List all pets',
        description: 'Returns a list of all pets in the store',
        operationId: 'listPets',
        tags: ['pets', 'public'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of pets to return',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'A list of pets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Pet' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Add a new pet',
        description: 'Creates a new pet in the store',
        operationId: 'createPet',
        tags: ['pets', 'admin'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NewPet' }
            }
          }
        },
        responses: {
          '201': { description: 'Pet created successfully' },
          '400': { description: 'Invalid pet data' }
        }
      }
    },
    '/pets/{petId}': {
      get: {
        summary: 'Get a pet by ID',
        description: 'Returns a single pet by its ID',
        operationId: 'getPetById',
        tags: ['pets', 'public'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'ID of the pet to retrieve',
            schema: {
              type: 'integer',
              format: 'int64'
            }
          }
        ],
        responses: {
          '200': { description: 'Pet found' },
          '404': { description: 'Pet not found' }
        }
      }
    }
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer', format: 'int64' },
          name: { type: 'string' },
          tag: { type: 'string' }
        }
      },
      NewPet: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          tag: { type: 'string' }
        }
      }
    }
  }
};

const validUserData = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User'
};

const invalidUserData = {
  validEmail: {
    ...validUserData,
    email: 'test@example.com'
  },
  invalidEmail: {
    ...validUserData,
    email: 'invalid-email'
  },
  shortPassword: {
    ...validUserData,
    password: '123'
  },
  missingFields: {
    email: 'test@example.com',
    password: 'password123'
    // Missing firstName, lastName
  }
};

const loginCredentials = {
  valid: {
    username: 'testuser',
    password: 'password123'
  },
  validEmail: {
    email: 'test@example.com',
    password: 'password123'
  },
  invalid: {
    username: 'wronguser',
    password: 'wrongpassword'
  },
  missing: {
    // Missing username/email and password
  }
};

const sampleEndpoints = [
  {
    id: 'endpoint_1',
    path: '/pets',
    method: 'GET',
    summary: 'List all pets',
    description: 'Returns a list of all pets in the store',
    tags: ['pets', 'public']
  },
  {
    id: 'endpoint_2',
    path: '/pets',
    method: 'POST',
    summary: 'Add a new pet',
    description: 'Creates a new pet in the store',
    tags: ['pets', 'admin']
  },
  {
    id: 'endpoint_3',
    path: '/pets/{petId}',
    method: 'GET',
    summary: 'Get a pet by ID',
    description: 'Returns a single pet by its ID',
    tags: ['pets', 'public']
  }
];

const tagOperations = {
  addTags: {
    valid: {
      path: '/pets',
      method: 'GET',
      tags: ['public', 'readonly', 'v1']
    },
    invalidFormat: {
      path: '/pets',
      method: 'GET',
      tags: 'not-an-array'
    },
    missingPath: {
      method: 'GET',
      tags: ['test']
    },
    missingMethod: {
      path: '/pets',
      tags: ['test']
    }
  },
  removeTags: {
    valid: {
      path: '/pets',
      method: 'GET',
      tags: ['v1']
    }
  },
  replaceTags: {
    valid: {
      path: '/pets',
      method: 'GET',
      tags: ['api', 'secure', 'production']
    },
    empty: {
      path: '/pets',
      method: 'GET',
      tags: []
    }
  }
};

const errorCases = {
  malformedJson: 'invalid json string',
  unknownEndpoint: {
    endpoint_id: 'nonexistent',
    path: '/nonexistent',
    method: 'GET'
  },
  missingEndpointId: {
    path: '/pets',
    method: 'GET'
    // Missing endpoint_id
  }
};

/**
 * Helper function to create temporary test files
 */
const createTempApiFile = (filename, apiSpec = sampleOpenApiSpec) => {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, JSON.stringify(apiSpec, null, 2));
  
  return filePath;
};

/**
 * Helper function to clean up temporary files
 */
const cleanupTempFile = (filePath) => {
  const fs = require('fs');
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
  }
};

/**
 * Generate test endpoints with varying complexities
 */
const generateTestEndpoints = (count = 10) => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const paths = ['/users', '/products', '/orders', '/admin', '/public'];
  const tagSets = [
    ['public', 'readonly'],
    ['admin', 'write'],
    ['user', 'authenticated'],
    ['system', 'internal'],
    ['api', 'v1']
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `test_endpoint_${i}`,
    path: `${paths[i % paths.length]}/${i}`,
    method: methods[i % methods.length],
    summary: `Test endpoint ${i}`,
    description: `Description for test endpoint ${i}`,
    tags: tagSets[i % tagSets.length]
  }));
};

module.exports = {
  sampleOpenApiSpec,
  validUserData,
  invalidUserData,
  loginCredentials,
  sampleEndpoints,
  tagOperations,
  errorCases,
  createTempApiFile,
  cleanupTempFile,
  generateTestEndpoints
};