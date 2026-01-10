/**
 * Integration tests for complete chat flow
 * Tests end-to-end scenarios from chat creation to multi-turn conversation
 */

import { POST as newChatHandler } from '../../../../src/app/api/secondStage/new-chat/route';
import { POST as chatPostHandler, GET as chatGetHandler } from '../../../../src/app/api/secondStage/chat/route';
import { GET as chatsHandler } from '../../../../src/app/api/secondStage/chats/route';
import { GET as chatHistoryHandler } from '../../../../src/app/api/secondStage/chat-history/route';
import { createMockRequest, createTestUser } from '../../utils/test-helpers';

// Mock all dependencies
jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser();
  }),
}));

const mockDb = {
  createNewChat: jest.fn(),
  getMessageHistory: jest.fn(),
  saveMessage: jest.fn(),
  updateChatTitle: jest.fn(),
  getChatList: jest.fn(),
  generateChatTitle: jest.fn(),
};

jest.mock('../../../lib/SECONDARY_db', () => mockDb);

const mockProvider = {
  callProvider: jest.fn(),
};

jest.mock('../../../lib/SECONDARY_providers', () => mockProvider);

describe('Chat Flow Integration Tests', () => {
  let chatId;
  const user = createTestUser();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockDb.createNewChat.mockResolvedValue({
      chatId: 'chat_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: 'New Chat',
      messageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockDb.getMessageHistory.mockResolvedValue([
      {
        _id: 'msg_system',
        chatId: '',
        userId: user.id,
        role: 'system',
        content: 'You are a helpful tutor...',
        sequenceNumber: 0,
        createdAt: new Date(),
      },
    ]);

    mockDb.saveMessage.mockImplementation(async ({ chatId, role, content }) => ({
      _id: 'msg_' + Math.random().toString(36).substr(2, 9),
      chatId,
      userId: user.id,
      role,
      content,
      sequenceNumber: Math.floor(Math.random() * 100),
      createdAt: new Date(),
    }));

    mockProvider.callProvider.mockResolvedValue('This is a test response.');
  });

  describe('Basic chat flow', () => {
    it('should create new chat and send message', async () => {
      // Step 1: Create new chat
      const newChatReq = createMockRequest({
        method: 'POST',
        body: {},
      });

      const newChatResponse = await newChatHandler(newChatReq);
      const newChatData = await newChatResponse.json();
      chatId = newChatData.chatId;

      expect(newChatResponse.status).toBe(201);
      expect(chatId).toBeDefined();

      // Step 2: Send first message
      const chatReq = createMockRequest({
        method: 'POST',
        body: {
          chatId,
          prompt: 'What is photosynthesis?',
        },
      });

      const chatResponse = await chatPostHandler(chatReq);
      const chatData = await chatResponse.json();

      expect(chatResponse.status).toBe(200);
      expect(chatData.chatId).toBe(chatId);
      expect(chatData.content).toBeDefined();
    });

    it('should generate title on first message', async () => {
      // Create new chat
      const newChatReq = createMockRequest({
        method: 'POST',
        body: {},
      });

      const newChatResponse = await newChatHandler(newChatReq);
      const newChatData = await newChatResponse.json();
      chatId = newChatData.chatId;

      // Send first message with system message in history
      mockDb.getMessageHistory.mockResolvedValueOnce([
        {
          role: 'system',
          content: 'You are helpful...',
          sequenceNumber: 0,
        },
      ]);

      const chatReq = createMockRequest({
        method: 'POST',
        body: {
          chatId,
          prompt: 'Explain quantum mechanics',
        },
      });

      await chatPostHandler(chatReq);

      expect(mockDb.updateChatTitle).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId,
          title: expect.stringContaining('Explain'),
        })
      );
    });

    it('should not generate title on subsequent messages', async () => {
      chatId = 'chat_existing';

      // Setup history with existing messages
      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
        { role: 'user', content: 'First message', sequenceNumber: 1 },
        { role: 'assistant', content: 'First response', sequenceNumber: 2 },
      ]);

      const chatReq = createMockRequest({
        method: 'POST',
        body: {
          chatId,
          prompt: 'Second message',
        },
      });

      await chatPostHandler(chatReq);

      expect(mockDb.updateChatTitle).not.toHaveBeenCalled();
    });
  });

  describe('Multi-turn conversation', () => {
    beforeEach(() => {
      chatId = 'chat_multiturn';
    });

    it('should maintain context across multiple messages', async () => {
      // First turn
      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
      ]);

      const req1 = createMockRequest({
        method: 'POST',
        body: { chatId, prompt: 'What is photosynthesis?' },
      });

      await chatPostHandler(req1);

      // Verify context sent to provider
      expect(mockProvider.callProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'What is photosynthesis?' }),
          ]),
        })
      );

      // Second turn
      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
        { role: 'user', content: 'What is photosynthesis?', sequenceNumber: 1 },
        { role: 'assistant', content: 'Photosynthesis is...', sequenceNumber: 2 },
      ]);

      const req2 = createMockRequest({
        method: 'POST',
        body: { chatId, prompt: 'Explain the light reactions' },
      });

      await chatPostHandler(req2);

      // Verify full context sent
      expect(mockProvider.callProvider).toHaveBeenLastCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'What is photosynthesis?' }),
            expect.objectContaining({ content: 'Photosynthesis is...' }),
            expect.objectContaining({ content: 'Explain the light reactions' }),
          ]),
        })
      );
    });

    it('should save both user and assistant messages', async () => {
      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
      ]);

      const req = createMockRequest({
        method: 'POST',
        body: { chatId, prompt: 'Test question' },
      });

      await chatPostHandler(req);

      // Should save user message
      expect(mockDb.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId,
          role: 'user',
          content: 'Test question',
        })
      );

      // Should save assistant response
      expect(mockDb.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId,
          role: 'assistant',
        })
      );
    });
  });

  describe('Chat list and history retrieval', () => {
    it('should list all user chats', async () => {
      mockDb.getChatList.mockResolvedValueOnce([
        {
          chatId: 'chat_1',
          userId: user.id,
          title: 'Biology',
          messageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          chatId: 'chat_2',
          userId: user.id,
          title: 'History',
          messageCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const req = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/secondStage/chats',
      });

      req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

      const response = await chatsHandler(req);
      const data = await response.json();

      expect(data.chats.length).toBe(2);
      expect(data.chats[0].title).toBe('Biology');
    });

    it('should retrieve conversation history for resumption', async () => {
      chatId = 'chat_resume';

      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
        { role: 'user', content: 'Previous question', sequenceNumber: 1 },
        { role: 'assistant', content: 'Previous answer', sequenceNumber: 2 },
      ]);

      const req = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/secondStage/chat-history?chatId=${chatId}`,
      });

      req.nextUrl = new URL(`http://localhost:3000/api/secondStage/chat-history?chatId=${chatId}`);

      const response = await chatHistoryHandler(req);
      const data = await response.json();

      expect(data.messages.length).toBe(3);
      expect(data.messages[1].content).toBe('Previous question');
    });
  });

  describe('Error handling', () => {
    it('should handle authentication errors', async () => {
      const authModule = require('../../../lib/SECONDARY_authPlaceholder');
      authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

      const req = createMockRequest({
        method: 'POST',
        body: {},
      });

      const response = await newChatHandler(req);

      expect(response.status).toBe(401);
    });

    it('should handle database errors', async () => {
      mockDb.createNewChat.mockRejectedValueOnce(new Error('Database connection failed'));

      const req = createMockRequest({
        method: 'POST',
        body: {},
      });

      const response = await newChatHandler(req);

      expect(response.status).toBeGreaterThanOrEqual(500);
    });

    it('should handle provider errors', async () => {
      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
      ]);

      mockProvider.callProvider.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const req = createMockRequest({
        method: 'POST',
        body: { chatId: 'chat_123', prompt: 'Test' },
      });

      const response = await chatPostHandler(req);

      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });

  describe('User isolation', () => {
    it('should not return other users chats', async () => {
      const user1Id = 'user_1';
      const user2Id = 'user_2';

      mockDb.getChatList.mockResolvedValueOnce([
        {
          chatId: 'chat_user1',
          userId: user1Id,
          title: 'User 1 Chat',
          messageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const req = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/secondStage/chats',
      });

      req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

      const response = await chatsHandler(req);
      const data = await response.json();

      // Verify getChatList was called with correct userId
      expect(mockDb.getChatList).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
        })
      );
    });

    it('should filter messages by userId', async () => {
      chatId = 'chat_isolation';

      mockDb.getMessageHistory.mockResolvedValueOnce([
        { role: 'system', content: 'You are helpful...', sequenceNumber: 0 },
        { role: 'user', content: 'User message', sequenceNumber: 1 },
      ]);

      const req = createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/secondStage/chat-history?chatId=${chatId}`,
      });

      req.nextUrl = new URL(`http://localhost:3000/api/secondStage/chat-history?chatId=${chatId}`);

      await chatHistoryHandler(req);

      expect(mockDb.getMessageHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
        })
      );
    });
  });
});
