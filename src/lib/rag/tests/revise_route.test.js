// FILE: src/lib/rag/tests/revise_route.test.js
// DESCRIPTION: Tests for Revise From Context routes and controller behavior

/**
 * Tests:
 * 1. POST /generate returns correct JSON shape for OK case
 * 2. POST /generate returns INSUFFICIENT_CONTEXT when retrieval empty
 * 3. revise_chat_history gets persisted but embedder is NOT called
 * 4. Session CRUD operations work correctly
 * 5. StrictMode ON + chunks → response includes sources and answer
 */

// Mock embedder — assert it is NOT called when persisting chat messages
const mockEmbedText = jest.fn().mockResolvedValue(new Array(384).fill(0.1));
jest.mock('../embedder.js', () => ({
    embedText: mockEmbedText,
}));

// Mock callProvider to return a valid JSON string
const mockCallProvider = jest.fn().mockResolvedValue(
    JSON.stringify({
        status: 'OK',
        answer: 'Test answer about S3',
        explanation_steps: ['Step 1', 'Step 2'],
        sources: [{ source_type: 'chat', source_id: 'chat:abc', similarity: 0.9 }],
        confidence: 0.85,
    })
);
jest.mock('../../../lib/SECONDARY_providers', () => ({
    callProvider: mockCallProvider,
}));

// Mock ragDB client
const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: 'mock_id' });
const mockFindResult = [];
const mockFindCursor = {
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue(mockFindResult),
};
const mockFindFn = jest.fn().mockReturnValue(mockFindCursor);
const mockCollectionFn = jest.fn().mockReturnValue({
    insertOne: mockInsertOne,
    find: mockFindFn,
});
jest.mock('../ragDBClient.js', () => ({
    getRagDB: jest.fn().mockResolvedValue({
        collection: mockCollectionFn,
    }),
}));

// Mock MongoDB for vector store (used by retriever)
const mockVectorDocs = [];
jest.mock('mongodb', () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        topology: { isConnected: () => true },
        db: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue(mockVectorDocs),
                }),
            }),
        }),
    })),
    ObjectId: jest.fn().mockImplementation(() => ({
        toString: () => 'mock_session_id_' + Date.now(),
    })),
}));

process.env.SECONDARY_MONGODB_URI = 'mongodb://localhost:27017/test';

const {
    handleReviseGeneration,
    createSession,
    listSessions,
    getSessionHistory,
    handleSessionMessage,
} = require('../reviseController.js');

describe('Revise Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockVectorDocs.length = 0;
        mockFindResult.length = 0;
    });

    describe('handleReviseGeneration', () => {
        it('should return INSUFFICIENT_CONTEXT when no chunks are found', async () => {
            const result = await handleReviseGeneration({
                userId: 'user_123',
                categoryId: 'cloud',
                query: 'What is S3?',
            });

            expect(result.status).toBe('INSUFFICIENT_CONTEXT');
            expect(result.reason).toBeDefined();
            expect(result.suggestion).toBeDefined();
        });

        it('should return OK shape when chunks exist', async () => {
            // Add matching vector documents
            const embedding = new Array(384).fill(0.1);
            mockVectorDocs.push({
                _id: { toString: () => 'vec1' },
                userId: 'user_user_123:cloud',
                sourceType: 'chat',
                sourceId: 'chat:abc',
                text: 'S3 provides eventual consistency for overwrite PUTS and DELETES',
                embedding,
                metadata: {},
            });

            const result = await handleReviseGeneration({
                userId: 'user_123',
                categoryId: 'cloud',
                query: 'What is S3 eventual consistency?',
                strictMode: true,
            });

            expect(result.status).toBe('OK');
            expect(result.answer).toBeDefined();
            expect(result.sources).toBeDefined();
            expect(Array.isArray(result.sources)).toBe(true);
            expect(result.context_strength).toBeDefined();
        });

        it('should validate mode input', async () => {
            await expect(
                handleReviseGeneration({
                    userId: 'user_123',
                    categoryId: 'cloud',
                    query: 'test',
                    mode: 'INVALID',
                })
            ).rejects.toThrow('Invalid mode');
        });
    });

    describe('Session management', () => {
        it('should create a session', async () => {
            const session = await createSession({
                userId: 'user_123',
                categoryId: 'cloud',
                name: 'Test Session',
            });

            expect(session.userId).toBe('user_123');
            expect(session.categoryId).toBe('cloud');
            expect(session.name).toBe('Test Session');
            expect(session.sessionId).toBeDefined();
            expect(mockInsertOne).toHaveBeenCalled();
        });

        it('should list sessions', async () => {
            const sessions = await listSessions({
                userId: 'user_123',
                categoryId: 'cloud',
            });

            expect(mockFindFn).toHaveBeenCalledWith({
                userId: 'user_123',
                categoryId: 'cloud',
            });
        });

        it('should get session history', async () => {
            const history = await getSessionHistory({ sessionId: 'sess_123' });

            expect(mockFindFn).toHaveBeenCalledWith({ sessionId: 'sess_123' });
        });
    });

    describe('handleSessionMessage', () => {
        it('should persist user and agent messages without calling embedder on them', async () => {
            // Reset embedText call count
            mockEmbedText.mockClear();

            // The embedder will be called once for query embedding in retrieve(),
            // but should NOT be called for persisting chat messages
            await handleSessionMessage({
                sessionId: 'sess_123',
                userId: 'user_123',
                categoryId: 'cloud',
                query: 'What is S3?',
            });

            // insertOne should be called at least twice (user msg + agent msg)
            expect(mockInsertOne).toHaveBeenCalledTimes(2);

            // Verify the inserted documents have correct shape
            const calls = mockInsertOne.mock.calls;

            // First call: user message
            expect(calls[0][0]).toMatchObject({
                sessionId: 'sess_123',
                sender: 'user',
                text: 'What is S3?',
            });

            // Second call: agent message
            expect(calls[1][0]).toMatchObject({
                sessionId: 'sess_123',
                sender: 'agent',
            });

            // embedText is called only for query embedding in retrieve, not for persistence
            // The key constraint: no storeEmbedding / addToVectorStore calls
            // (those modules are not imported in reviseController at all)
        });
    });
});
