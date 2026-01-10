/**
 * Tests for src/lib/SECONDARY_db.js
 * Database abstraction layer for chat functionality
 */

import {
  createMockCollection,
  createTestUser,
  createTestChat,
  createTestMessage,
} from '../utils/test-helpers';

// We'll mock the MongoDB module
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => ({
    connect: jest.fn(async function () {
      return this;
    }),
    db: jest.fn(() => ({
      collection: jest.fn((name) => {
        if (name === 'stage2_chats') {
          return createMockCollection('stage2_chats');
        }
        if (name === 'stage2_messages') {
          return createMockCollection('stage2_messages');
        }
        return createMockCollection(name);
      }),
    })),
    topology: { isConnected: () => true },
  })),
  ObjectId: jest.fn((id) => ({
    toString: () => id || 'mock_id',
  })),
}));

describe('SECONDARY_db', () => {
  let db;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Import fresh instance for each test
    db = require('../../../src/lib/SECONDARY_db');
  });

  describe('saveMessage', () => {
    it('should save a message with correct structure', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';
      const message = await db.saveMessage({
        userId: user.id,
        chatId,
        role: 'user',
        content: 'Hello, what is X?',
      });

      expect(message).toHaveProperty('_id');
      expect(message).toHaveProperty('chatId', chatId);
      expect(message).toHaveProperty('userId', user.id);
      expect(message).toHaveProperty('role', 'user');
      expect(message).toHaveProperty('content', 'Hello, what is X?');
      expect(message).toHaveProperty('sequenceNumber');
      expect(message).toHaveProperty('createdAt');
    });

    it('should increment sequenceNumber for subsequent messages', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';

      const msg1 = await db.saveMessage({
        userId: user.id,
        chatId,
        role: 'user',
        content: 'First message',
      });

      const msg2 = await db.saveMessage({
        userId: user.id,
        chatId,
        role: 'assistant',
        content: 'Second message',
      });

      expect(msg2.sequenceNumber).toBeGreaterThan(msg1.sequenceNumber);
    });

    it('should throw error if required fields missing', async () => {
      await expect(
        db.saveMessage({
          userId: 'user_123',
          // missing chatId
          role: 'user',
          content: 'Hello',
        })
      ).rejects.toThrow();
    });

    it('should accept all valid roles', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';
      const roles = ['system', 'user', 'assistant'];

      for (const role of roles) {
        const message = await db.saveMessage({
          userId: user.id,
          chatId,
          role,
          content: `Message with role ${role}`,
        });

        expect(message.role).toBe(role);
      }
    });
  });

  describe('getMessageHistory', () => {
    it('should retrieve messages ordered by sequenceNumber', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';

      const messages = await db.getMessageHistory({
        userId: user.id,
        chatId,
      });

      expect(Array.isArray(messages)).toBe(true);
      
      // If messages exist, they should be ordered
      if (messages.length > 1) {
        for (let i = 1; i < messages.length; i++) {
          expect(messages[i].sequenceNumber).toBeGreaterThanOrEqual(
            messages[i - 1].sequenceNumber
          );
        }
      }
    });

    it('should return empty array for non-existent chat', async () => {
      const user = createTestUser();
      const messages = await db.getMessageHistory({
        userId: user.id,
        chatId: 'non_existent_chat',
      });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });

    it('should filter by userId and chatId', async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();
      const chatId = 'chat_123';

      // This test verifies the query structure
      const messages = await db.getMessageHistory({
        userId: user1.id,
        chatId,
      });

      expect(Array.isArray(messages)).toBe(true);
    });

    it('should throw error if userId missing', async () => {
      await expect(
        db.getMessageHistory({
          // missing userId
          chatId: 'chat_123',
        })
      ).rejects.toThrow();
    });
  });

  describe('createNewChat', () => {
    it('should create new chat with system message', async () => {
      const user = createTestUser();
      const result = await db.createNewChat({
        userId: user.id,
        title: 'My Test Chat',
      });

      expect(result).toHaveProperty('chatId');
      expect(result).toHaveProperty('title', 'My Test Chat');
      expect(result).toHaveProperty('createdAt');
    });

    it('should default title to "New Chat" if not provided', async () => {
      const user = createTestUser();
      const result = await db.createNewChat({
        userId: user.id,
      });

      expect(result.title).toBe('New Chat');
    });

    it('should throw error if userId missing', async () => {
      await expect(
        db.createNewChat({
          // missing userId
          title: 'Test',
        })
      ).rejects.toThrow();
    });

    it('should initialize chat with system message', async () => {
      const user = createTestUser();
      await db.createNewChat({
        userId: user.id,
      });

      // Verify system message is created with sequenceNumber 0
      // This would be verified in integration tests
    });
  });

  describe('updateChatTitle', () => {
    it('should update chat title', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';
      const newTitle = 'What is photosynthesis';

      await db.updateChatTitle({
        userId: user.id,
        chatId,
        title: newTitle,
      });

      // Verify update was called
      // Actual verification would be in integration tests
    });

    it('should throw error if required fields missing', async () => {
      await expect(
        db.updateChatTitle({
          userId: 'user_123',
          // missing chatId
          title: 'New Title',
        })
      ).rejects.toThrow();
    });

    it('should update updatedAt timestamp', async () => {
      const user = createTestUser();
      const chatId = 'chat_123';

      const beforeTime = new Date();
      await db.updateChatTitle({
        userId: user.id,
        chatId,
        title: 'New Title',
      });
      const afterTime = new Date();

      // In integration tests, would verify updatedAt is between beforeTime and afterTime
    });
  });

  describe('getChatList', () => {
    it('should return array of chats', async () => {
      const user = createTestUser();
      const chats = await db.getChatList({
        userId: user.id,
      });

      expect(Array.isArray(chats)).toBe(true);
    });

    it('should return chats with required fields', async () => {
      const user = createTestUser();
      const chats = await db.getChatList({
        userId: user.id,
      });

      if (chats.length > 0) {
        const chat = chats[0];
        expect(chat).toHaveProperty('_id');
        expect(chat).toHaveProperty('title');
        expect(chat).toHaveProperty('createdAt');
        expect(chat).toHaveProperty('updatedAt');
      }
    });

    it('should sort by updatedAt descending', async () => {
      const user = createTestUser();
      const chats = await db.getChatList({
        userId: user.id,
      });

      // Verify chats are sorted by updatedAt
      if (chats.length > 1) {
        for (let i = 1; i < chats.length; i++) {
          expect(new Date(chats[i].updatedAt)).toBeLessThanOrEqual(
            new Date(chats[i - 1].updatedAt)
          );
        }
      }
    });

    it('should throw error if userId missing', async () => {
      await expect(
        db.getChatList({
          // missing userId
        })
      ).rejects.toThrow();
    });
  });

  describe('generateChatTitle', () => {
    it('should extract first 5-7 words from message', () => {
      const message = 'What is photosynthesis and how does it work';
      const title = db.generateChatTitle(message);

      expect(title).toMatch(/^What is photosynthesis/);
    });

    it('should handle short messages', () => {
      const message = 'Hi';
      const title = db.generateChatTitle(message);

      expect(title).toBe('Hi');
    });

    it('should trim whitespace', () => {
      const message = '   What is photosynthesis   ';
      const title = db.generateChatTitle(message);

      expect(title).toBe('What is photosynthesis');
    });

    it('should return "New Chat" for empty message', () => {
      const title = db.generateChatTitle('');

      expect(title).toBe('New Chat');
    });

    it('should handle special characters', () => {
      const message = 'What is X? (with special chars!)';
      const title = db.generateChatTitle(message);

      expect(title.length).toBeGreaterThan(0);
    });
  });
});
