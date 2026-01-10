/**
 * Tests for POST /api/secondStage/chat
 * Main chat endpoint with context management
 */

import { POST as chatPostHandler, GET as chatGetHandler } from '../../../../src/app/api/secondStage/chat/route';
import {
  createMockRequest,
  createTestUser,
  MockInferenceClient,
} from '../../utils/test-helpers';

// Mock dependencies
jest.mock('../../../lib/SECONDARY_providers', () => ({
  callProvider: jest.fn(async ({ provider, messages, stream, systemPrompt }) => {
    if (stream) {
      return {
        stream: true,
        iterator: new MockInferenceClient('token').chatCompletionStream({
          messages,
        }),
      };
    }
    return 'This is a test response based on the context provided.';
  }),
}));

jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser();
  }),
}));

jest.mock('../../../lib/SECONDARY_db', () => ({
  getMessageHistory: jest.fn(async ({ userId, chatId }) => {
    return [
      {
        role: 'system',
        content: 'You are a helpful tutor...',
        sequenceNumber: 0,
      },
    ];
  }),
  saveMessage: jest.fn(async ({ userId, chatId, role, content }) => {
    return {
      _id: 'msg_' + Math.random().toString(36).substr(2, 9),
      userId,
      chatId,
      role,
      content,
      sequenceNumber: 1,
      createdAt: new Date(),
    };
  }),
  updateChatTitle: jest.fn(async () => {}),
  generateChatTitle: jest.fn((message) => message.split(' ').slice(0, 7).join(' ')),
}));

describe('POST /api/secondStage/chat', () => {
  let callProvider;
  let getMessageHistory;
  let saveMessage;
  let updateChatTitle;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    const providers = require('../../../lib/SECONDARY_providers');
    const db = require('../../../lib/SECONDARY_db');
    
    callProvider = providers.callProvider;
    getMessageHistory = db.getMessageHistory;
    saveMessage = db.saveMessage;
    updateChatTitle = db.updateChatTitle;
  });

  it('should send message and receive response', async () => {
    const user = createTestUser();
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
        provider: 'huggingface',
        stream: false,
      },
    });

    const response = await chatPostHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('chatId');
    expect(data).toHaveProperty('messageCount');
    expect(data).toHaveProperty('provider', 'huggingface');
  });

  it('should load message history before sending', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
      },
    });

    await chatPostHandler(req);

    expect(getMessageHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 'chat_123',
      })
    );
  });

  it('should save user message', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
      },
    });

    await chatPostHandler(req);

    expect(saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 'chat_123',
        role: 'user',
        content: 'What is photosynthesis?',
      })
    );
  });

  it('should save assistant response', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
      },
    });

    await chatPostHandler(req);

    expect(saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 'chat_123',
        role: 'assistant',
        content: expect.any(String),
      })
    );
  });

  it('should generate title on first message', async () => {
    getMessageHistory.mockResolvedValueOnce([
      { role: 'system', content: 'You are a helpful tutor...', sequenceNumber: 0 },
    ]);

    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
      },
    });

    await chatPostHandler(req);

    expect(updateChatTitle).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 'chat_123',
        title: expect.stringContaining('What is photosynthesis'),
      })
    );
  });

  it('should not generate title on subsequent messages', async () => {
    getMessageHistory.mockResolvedValueOnce([
      { role: 'system', content: 'You are a helpful tutor...', sequenceNumber: 0 },
      { role: 'user', content: 'What is X?', sequenceNumber: 1 },
      { role: 'assistant', content: 'X is...', sequenceNumber: 2 },
    ]);

    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'Tell me more about X',
      },
    });

    await chatPostHandler(req);

    expect(updateChatTitle).not.toHaveBeenCalled();
  });

  it('should require authentication', async () => {
    const authModule = require('../../../lib/SECONDARY_authPlaceholder');
    authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'Hello',
      },
    });

    const response = await chatPostHandler(req);

    expect(response.status).toBe(401);
  });

  it('should require chatId and prompt', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        // missing chatId
        prompt: 'Hello',
      },
    });

    const response = await chatPostHandler(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should send full message history to provider', async () => {
    getMessageHistory.mockResolvedValueOnce([
      { role: 'system', content: 'System...', sequenceNumber: 0 },
      { role: 'user', content: 'First message', sequenceNumber: 1 },
      { role: 'assistant', content: 'Response', sequenceNumber: 2 },
    ]);

    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'Follow-up question',
      },
    });

    await chatPostHandler(req);

    // Verify full context sent
    expect(callProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ content: 'First message' }),
          expect.objectContaining({ content: 'Response' }),
          expect.objectContaining({ content: 'Follow-up question' }),
        ]),
      })
    );
  });

  it('should support custom system prompt', async () => {
    const customPrompt = 'You are a specialist in biology.';
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
        systemPrompt: customPrompt,
      },
    });

    await chatPostHandler(req);

    expect(callProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: customPrompt,
      })
    );
  });

  it('should handle streaming responses', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'What is photosynthesis?',
        stream: true,
      },
    });

    const response = await chatPostHandler(req);

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('should return context in response', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        chatId: 'chat_123',
        prompt: 'Hello',
      },
    });

    const response = await chatPostHandler(req);
    const data = await response.json();

    expect(data.chatId).toBe('chat_123');
    expect(data.content).toBeDefined();
  });
});

describe('GET /api/secondStage/chat', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should retrieve message history', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat?chatId=chat_123',
    });

    // Add searchParams
    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat?chatId=chat_123');

    const response = await chatGetHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('messages');
    expect(Array.isArray(data.messages)).toBe(true);
  });

  it('should require chatId parameter', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat');

    const response = await chatGetHandler(req);

    expect(response.status).toBe(400);
  });

  it('should require authentication', async () => {
    const authModule = require('../../../lib/SECONDARY_authPlaceholder');
    authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chat?chatId=chat_123',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chat?chatId=chat_123');

    const response = await chatGetHandler(req);

    expect(response.status).toBe(401);
  });
});
