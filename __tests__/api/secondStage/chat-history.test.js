/**
 * Tests for GET /api/secondStage/chat-history
 * Load conversation history endpoint
 */

import { GET as chatHistoryHandler } from '../../../../src/app/api/secondStage/chat-history/route';
import { createMockRequest, createTestUser, createTestMessage } from '../../utils/test-helpers';

jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser();
  }),
}));

jest.mock('../../../lib/SECONDARY_db', () => ({
  getMessageHistory: jest.fn(async ({ userId, chatId }) => {
    return [
      createTestMessage({
        role: 'system',
        content: 'You are a helpful tutor...',
        sequenceNumber: 0,
      }),
      createTestMessage({
        role: 'user',
        content: 'What is photosynthesis?',
        sequenceNumber: 1,
      }),
      createTestMessage({
        role: 'assistant',
        content: 'Photosynthesis is the process...',
        sequenceNumber: 2,
      }),
      createTestMessage({
        role: 'user',
        content: 'Can you explain the light reactions?',
        sequenceNumber: 3,
      }),
      createTestMessage({
        role: 'assistant',
        content: 'The light reactions occur in the thylakoid membrane...',
        sequenceNumber: 4,
      }),
    ];
  }),
}));

describe('GET /api/secondStage/chat-history', () => {
  let getMessageHistory;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    const db = require('../../../lib/SECONDARY_db');
    getMessageHistory = db.getMessageHistory;
  });

  it('should retrieve message history', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.length).toBeGreaterThan(0);
  });

  it('should return messages in order', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    const messages = data.messages;
    for (let i = 0; i < messages.length - 1; i++) {
      expect(messages[i].sequenceNumber).toBeLessThanOrEqual(messages[i + 1].sequenceNumber);
    }
  });

  it('should include all message fields', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    const message = data.messages[0];
    expect(message).toHaveProperty('role');
    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('sequenceNumber');
    expect(message).toHaveProperty('createdAt');
  });

  it('should require chatId parameter', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history');

    const response = await chatHistoryHandler(req);

    expect(response.status).toBe(400);
  });

  it('should require authentication', async () => {
    const authModule = require('../../../lib/SECONDARY_authPlaceholder');
    authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    const response = await chatHistoryHandler(req);

    expect(response.status).toBe(401);
  });

  it('should filter by chatId', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_xyz',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_xyz');

    await chatHistoryHandler(req);

    expect(getMessageHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 'chat_xyz',
      })
    );
  });

  it('should filter by userId', async () => {
    const user = createTestUser();
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    await chatHistoryHandler(req);

    expect(getMessageHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
      })
    );
  });

  it('should return empty array if chat has no messages', async () => {
    getMessageHistory.mockResolvedValueOnce([]);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_empty',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_empty');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    expect(data.messages).toEqual([]);
  });

  it('should support filtering by role', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123&role=user',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123&role=user');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    const messages = data.messages;
    const hasNonUserMessages = messages.some(m => m.role !== 'user');
    expect(hasNonUserMessages).toBe(false);
  });

  it('should return total message count', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat-history?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat-history?chatId=chat_123');

    const response = await chatHistoryHandler(req);
    const data = await response.json();

    expect(data).toHaveProperty('totalCount');
    expect(data.totalCount).toEqual(data.messages.length);
  });
});
