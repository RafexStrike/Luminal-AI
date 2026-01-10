/**
 * Tests for GET /api/secondStage/chats
 * List all chats endpoint (for sidebar)
 */

import { GET as chatsHandler } from '../../../../src/app/api/secondStage/chats/route';
import { createMockRequest, createTestUser, createTestChat } from '../../utils/test-helpers';

jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser();
  }),
}));

jest.mock('../../../lib/SECONDARY_db', () => ({
  getChatList: jest.fn(async ({ userId, limit, offset }) => {
    return [
      createTestChat({ title: 'Biology Revision', messageCount: 5 }),
      createTestChat({ title: 'History Essay', messageCount: 3 }),
      createTestChat({ title: 'Math Help', messageCount: 8 }),
    ];
  }),
}));

describe('GET /api/secondStage/chats', () => {
  let getChatList;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    const db = require('../../../lib/SECONDARY_db');
    getChatList = db.getChatList;
  });

  it('should return list of chats', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    const response = await chatsHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.chats)).toBe(true);
    expect(data.chats.length).toBeGreaterThan(0);
  });

  it('should include required chat fields', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    const response = await chatsHandler(req);
    const data = await response.json();

    const chat = data.chats[0];
    expect(chat).toHaveProperty('chatId');
    expect(chat).toHaveProperty('title');
    expect(chat).toHaveProperty('messageCount');
    expect(chat).toHaveProperty('updatedAt');
  });

  it('should sort by updatedAt descending', async () => {
    const chat1 = createTestChat({ title: 'Chat 1', updatedAt: new Date('2024-01-01') });
    const chat2 = createTestChat({ title: 'Chat 2', updatedAt: new Date('2024-01-03') });
    const chat3 = createTestChat({ title: 'Chat 3', updatedAt: new Date('2024-01-02') });

    getChatList.mockResolvedValueOnce([chat2, chat3, chat1]);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    const response = await chatsHandler(req);
    const data = await response.json();

    const dates = data.chats.map(c => new Date(c.updatedAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('should support pagination with limit', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats?limit=5',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats?limit=5');

    await chatsHandler(req);

    expect(getChatList).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 5,
      })
    );
  });

  it('should support pagination with offset', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats?offset=10',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats?offset=10');

    await chatsHandler(req);

    expect(getChatList).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 10,
      })
    );
  });

  it('should require authentication', async () => {
    const authModule = require('../../../lib/SECONDARY_authPlaceholder');
    authModule.getUserIfAuthenticated.mockResolvedValueOnce(null);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    const response = await chatsHandler(req);

    expect(response.status).toBe(401);
  });

  it('should filter by userId', async () => {
    const user = createTestUser();
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    await chatsHandler(req);

    expect(getChatList).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
      })
    );
  });

  it('should return empty array if no chats', async () => {
    getChatList.mockResolvedValueOnce([]);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/secondStage/chats',
    });

    req.nextUrl = new URL('http://localhost:3000/api/secondStage/chats');

    const response = await chatsHandler(req);
    const data = await response.json();

    expect(data.chats).toEqual([]);
  });
});
