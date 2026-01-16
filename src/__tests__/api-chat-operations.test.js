// FILE: src/__tests__/api-chat-operations.test.js
// DESCRIPTION: Tests for chat operation API endpoints (rename, delete, set-collection)

/**
 * These tests verify the API endpoints for chat operations.
 * They assume a test database setup and should be run with:
 *   npm test -- __tests__/api-chat-operations.test.js
 *
 * Note: These are integration tests that require the API server to be running.
 * For unit tests, mock the fetch calls.
 */

const BASE_URL = 'http://localhost:3000/api/secondStage';

describe('Chat Operations API', () => {
  let testChatId;
  const testUserId = 'test-user-123';

  // Setup: Create a test chat before running tests
  beforeAll(async () => {
    // Create test chat
    const res = await fetch(`${BASE_URL}/new-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserId}`,
      },
      body: JSON.stringify({ title: 'Test Chat for Operations' }),
    });

    if (!res.ok) {
      throw new Error('Failed to create test chat');
    }

    const data = await res.json();
    testChatId = data.chatId;
  });

  describe('POST /api/secondStage/chat_operations/rename', () => {
    it('should rename a chat', async () => {
      const newTitle = 'Renamed Test Chat';
      const res = await fetch(`${BASE_URL}/chat_operations/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: testChatId, title: newTitle }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(newTitle);
    });

    it('should return 400 for missing title', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: testChatId }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: testChatId, title: 'Test' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/secondStage/chat_operations/set-collection', () => {
    it('should move chat to collection', async () => {
      const collection = 'Test Collection';
      const res = await fetch(`${BASE_URL}/chat_operations/set-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: testChatId, collection }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.collection).toBe(collection);
    });

    it('should allow creating new collection on the fly', async () => {
      const collection = 'Brand New Collection';
      const res = await fetch(`${BASE_URL}/chat_operations/set-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: testChatId, collection }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.data.collection).toBe(collection);
    });

    it('should return 400 for missing collection', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/set-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: testChatId }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/secondStage/chat_operations/delete', () => {
    let chatToDelete;

    beforeAll(async () => {
      // Create a chat specifically for deletion test
      const res = await fetch(`${BASE_URL}/new-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ title: 'Chat to Delete' }),
      });

      const data = await res.json();
      chatToDelete = data.chatId;
    });

    it('should soft-delete a chat', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: chatToDelete }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.deletedAt).toBeDefined();
    });

    it('should return 404 for non-existent chat', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({ chatId: 'non-existent-id' }),
      });

      expect(res.status).toBe(404);
    });

    it('should return 400 for missing chatId', async () => {
      const res = await fetch(`${BASE_URL}/chat_operations/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/secondStage/chats', () => {
    it('should return list of chats with collection field', async () => {
      const res = await fetch(`${BASE_URL}/chats`, {
        headers: {
          'Authorization': `Bearer ${testUserId}`,
        },
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(Array.isArray(data.chats)).toBe(true);

      // Check that each chat has collection field
      data.chats.forEach((chat) => {
        expect(chat._id).toBeDefined();
        expect(chat.title).toBeDefined();
        expect(chat.collection).toBeDefined();
      });
    });

    it('should default collection to "Unknown" for chats without collection', async () => {
      const res = await fetch(`${BASE_URL}/chats`, {
        headers: {
          'Authorization': `Bearer ${testUserId}`,
        },
      });

      const data = await res.json();
      const hasUnknown = data.chats.some((c) => c.collection === 'Unknown');
      expect(hasUnknown).toBe(true);
    });
  });
});
