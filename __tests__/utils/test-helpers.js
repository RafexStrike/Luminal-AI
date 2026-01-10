/**
 * Test utilities and mock helpers
 */

import { MongoClient, ObjectId } from 'mongodb';

/**
 * Mock MongoDB Client for testing
 */
export class MockMongoClient {
  constructor() {
    this.db = {
      collection: jest.fn((name) => ({
        insertOne: jest.fn(async (doc) => ({
          insertedId: new ObjectId(),
        })),
        findOne: jest.fn(async () => null),
        find: jest.fn(() => ({
          sort: jest.fn(() => ({
            projection: jest.fn(() => ({
              toArray: jest.fn(async () => []),
            })),
            toArray: jest.fn(async () => []),
          })),
          toArray: jest.fn(async () => []),
        })),
        updateOne: jest.fn(async () => ({})),
        deleteOne: jest.fn(async () => ({})),
      })),
    };
    this.topology = {
      isConnected: () => true,
    };
  }

  async connect() {
    return this;
  }

  async close() {}
}

/**
 * Create mock request object
 */
export function createMockRequest(options = {}) {
  const {
    method = 'GET',
    body = {},
    query = {},
    headers = {},
    cookies = {},
    user = { id: 'user123', email: 'test@example.com' },
  } = options;

  return {
    method,
    url: options.url || 'http://localhost:3000/api/test',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: jest.fn(async () => body),
    query,
    cookies,
    user,
    _parsedBody: body,
  };
}

/**
 * Create test user
 */
export function createTestUser(overrides = {}) {
  return {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

/**
 * Create test chat
 */
export function createTestChat(userId, overrides = {}) {
  const chatId = new ObjectId().toString();
  return {
    _id: chatId,
    userId,
    title: 'Test Chat',
    messageCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create test message
 */
export function createTestMessage(chatId, userId, overrides = {}) {
  return {
    _id: new ObjectId(),
    chatId,
    userId,
    role: 'user',
    content: 'Test message',
    sequenceNumber: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock HuggingFace InferenceClient
 */
export class MockInferenceClient {
  constructor(token) {
    this.token = token;
  }

  async chatCompletionStream(options) {
    const { messages } = options;
    
    // Simulate streaming response
    const chunks = [
      { choices: [{ delta: { content: 'This ' } }] },
      { choices: [{ delta: { content: 'is ' } }] },
      { choices: [{ delta: { content: 'a ' } }] },
      { choices: [{ delta: { content: 'test ' } }] },
      { choices: [{ delta: { content: 'response.' } }] },
    ];

    // Return async iterator
    return {
      [Symbol.asyncIterator]() {
        let index = 0;
        return {
          async next() {
            if (index < chunks.length) {
              return { value: chunks[index++], done: false };
            }
            return { done: true };
          },
        };
      },
    };
  }
}

/**
 * Wait for async operations
 */
export async function waitFor(condition, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Create mock MongoDB collection
 */
export function createMockCollection(name) {
  return {
    insertOne: jest.fn(async (doc) => ({
      insertedId: doc._id || new ObjectId(),
    })),
    insertMany: jest.fn(async (docs) => ({
      insertedIds: docs.map((d) => d._id || new ObjectId()),
    })),
    findOne: jest.fn(async () => null),
    find: jest.fn(function () {
      return {
        sort: jest.fn(function () {
          return this;
        }),
        projection: jest.fn(function () {
          return this;
        }),
        skip: jest.fn(function () {
          return this;
        }),
        limit: jest.fn(function () {
          return this;
        }),
        toArray: jest.fn(async () => []),
      };
    }),
    updateOne: jest.fn(async () => ({
      modifiedCount: 1,
    })),
    updateMany: jest.fn(async () => ({
      modifiedCount: 1,
    })),
    deleteOne: jest.fn(async () => ({
      deletedCount: 1,
    })),
    countDocuments: jest.fn(async () => 0),
  };
}

/**
 * Mock authentication
 */
export async function mockGetUserIfAuthenticated(user) {
  return user || createTestUser();
}

/**
 * Compare messages (ignoring timestamps)
 */
export function messagesEqual(msg1, msg2) {
  return (
    msg1.role === msg2.role &&
    msg1.content === msg2.content &&
    msg1.sequenceNumber === msg2.sequenceNumber
  );
}

export default {
  MockMongoClient,
  createMockRequest,
  createTestUser,
  createTestChat,
  createTestMessage,
  MockInferenceClient,
  waitFor,
  createMockCollection,
  mockGetUserIfAuthenticated,
  messagesEqual,
};
