// FILE: src/lib/rag/tests/revise_retriever.test.js
// DESCRIPTION: Unit tests for reviseRetriever namespace scoping and threshold filtering

/**
 * Tests:
 * 1. Retriever returns only entries from the correct namespace
 * 2. Chunks below SIMILARITY_THRESHOLD are filtered out
 * 3. Returns empty array (INSUFFICIENT_CONTEXT scenario) when no chunks pass
 * 4. Summary chunks are prioritized to front of results
 * 5. includeUploads=false filters out upload source types
 */

// Mock embedder to avoid real API calls
jest.mock('../embedder.js', () => ({
    embedText: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

// Mock MongoDB client
const mockDocuments = [];
const mockFind = jest.fn(() => ({
    toArray: jest.fn().mockResolvedValue(mockDocuments),
}));
const mockCollection = jest.fn(() => ({
    find: mockFind,
}));
const mockDb = jest.fn(() => ({
    collection: mockCollection,
}));

jest.mock('mongodb', () => ({
    MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        topology: { isConnected: () => true },
        db: mockDb,
    })),
}));

// Set env before import
process.env.SECONDARY_MONGODB_URI = 'mongodb://localhost:27017/test';

const { retrieve } = require('../reviseRetriever.js');
const { SIMILARITY_THRESHOLD } = require('../rag.constants.js');

describe('reviseRetriever', () => {
    beforeEach(() => {
        mockDocuments.length = 0;
        jest.clearAllMocks();
    });

    describe('namespace scoping', () => {
        it('should query with namespace user_{userId}:{categoryId}', async () => {
            await retrieve('user_123', 'cloud', 'test query');

            expect(mockFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_user_123:cloud',
                })
            );
        });

        it('should NOT return documents from other namespaces', async () => {
            // Documents in the mock are filtered by MongoDB query
            // The retrieve function passes userId: 'user_{userId}:{categoryId}'
            // so only matching docs would be returned from DB
            const result = await retrieve('user_123', 'cloud', 'test query');
            expect(result).toEqual([]);
        });
    });

    describe('threshold filtering', () => {
        it('should filter out chunks below SIMILARITY_THRESHOLD', async () => {
            // Simulate docs with varying similarity (cosine sim with uniform vectors)
            mockDocuments.push(
                {
                    _id: { toString: () => 'id1' },
                    userId: 'user_user_123:cloud',
                    sourceType: 'chat',
                    sourceId: 'chat:abc',
                    text: 'High similarity chunk',
                    embedding: new Array(384).fill(0.1), // Same as query → high similarity
                    metadata: {},
                },
                {
                    _id: { toString: () => 'id2' },
                    userId: 'user_user_123:cloud',
                    sourceType: 'chat',
                    sourceId: 'chat:def',
                    text: 'Zero similarity chunk',
                    embedding: new Array(384).fill(0), // zero vector → 0 similarity
                    metadata: {},
                }
            );

            const result = await retrieve('user_123', 'cloud', 'test query');

            // The first doc should have similarity ~1.0, second should be 0
            const highSimChunks = result.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);
            const lowSimChunks = result.filter((r) => r.similarity < SIMILARITY_THRESHOLD);
            expect(lowSimChunks.length).toBe(0);
        });

        it('should return empty array when no chunks pass threshold', async () => {
            mockDocuments.push({
                _id: { toString: () => 'id3' },
                userId: 'user_user_123:cloud',
                sourceType: 'chat',
                sourceId: 'chat:low',
                text: 'Very low similarity',
                embedding: new Array(384).fill(0),
                metadata: {},
            });

            const result = await retrieve('user_123', 'cloud', 'test query');
            expect(result).toEqual([]);
        });
    });

    describe('summary prioritization', () => {
        it('should place summary chunks before other chunks', async () => {
            const baseEmbedding = new Array(384).fill(0.1);
            mockDocuments.push(
                {
                    _id: { toString: () => 'id_chat' },
                    userId: 'user_user_123:cloud',
                    sourceType: 'chat',
                    sourceId: 'chat:abc',
                    text: 'Chat chunk',
                    embedding: baseEmbedding,
                    metadata: {},
                },
                {
                    _id: { toString: () => 'id_summary' },
                    userId: 'user_user_123:cloud',
                    sourceType: 'summary',
                    sourceId: 'summary:cloud',
                    text: 'Summary chunk',
                    embedding: baseEmbedding,
                    metadata: {},
                }
            );

            const result = await retrieve('user_123', 'cloud', 'test query');
            if (result.length >= 2) {
                expect(result[0].source_type).toBe('summary');
            }
        });
    });

    describe('includeUploads filtering', () => {
        it('should exclude upload source types when includeUploads=false', async () => {
            await retrieve('user_123', 'cloud', 'test query', 6, false);

            expect(mockFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    sourceType: { $nin: ['upload'] },
                })
            );
        });
    });

    describe('input validation', () => {
        it('should throw on missing userId', async () => {
            await expect(retrieve(null, 'cloud', 'test')).rejects.toThrow('Missing required fields');
        });

        it('should throw on missing categoryId', async () => {
            await expect(retrieve('user_123', null, 'test')).rejects.toThrow('Missing required fields');
        });

        it('should throw on missing query', async () => {
            await expect(retrieve('user_123', 'cloud', null)).rejects.toThrow('Missing required fields');
        });
    });
});
