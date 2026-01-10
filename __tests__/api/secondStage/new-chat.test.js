/**
 * Tests for POST /api/secondStage/new-chat
 * New chat session creation endpoint
 */

import { POST as newChatHandler } from '../../../../src/app/api/secondStage/new-chat/route';
import { createMockRequest, createTestUser } from '../../utils/test-helpers';

jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser();
  }),
}));

jest.mock('../../../lib/SECONDARY_db', () => ({
  createNewChat: jest.fn(async ({ userId, title }) => {
    return {
      chatId: 'chat_' + Math.random().toString(36).substr(2, 9),
      userId,
      title: title || 'New Chat',
      messageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),
}));

describe('POST /api/secondStage/new-chat', () => {
  let createNewChat;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    const db = require('../../../lib/SECONDARY_db');
    createNewChat = db.createNewChat;
  });

  it('should create new chat session', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {},
    });

    const response = await newChatHandler(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('chatId');
    expect(data).toHaveProperty('createdAt');
  });

  it('should initialize with default title', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {},
    });

    await newChatHandler(req);

    expect(createNewChat).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Chat',
      })
    );
  });

  it('should accept custom title', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        title: 'Biology Homework',
      },
    });

    await newChatHandler(req);

    expect(createNewChat).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Biology Homework',
      })
    );
  });

  it('should require authentication', async () => {
    const authModule = require('../../../lib/SECONDARY_authPlaceholder');
    authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

    const req = createMockRequest({
      method: 'POST',
      body: {},
    });

    const response = await newChatHandler(req);

    expect(response.status).toBe(401);
  });

  it('should return chatId in response', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {},
    });

    const response = await newChatHandler(req);
    const data = await response.json();

    expect(data.chatId).toBeDefined();
    expect(typeof data.chatId).toBe('string');
  });

  it('should pass userId to database', async () => {
    const user = createTestUser();
    const req = createMockRequest({
      method: 'POST',
      body: {},
    });

    await newChatHandler(req);

    expect(createNewChat).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
      })
    );
  });
});
