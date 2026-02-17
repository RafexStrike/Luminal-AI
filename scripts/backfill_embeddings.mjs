
import { MongoClient } from 'mongodb';
import { embedText } from '../src/lib/rag/embedder.js';

const uri = process.env.SECONDARY_MONGODB_URI;
if (!uri) {
    console.error("No SECONDARY_MONGODB_URI set");
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        console.log('Connecting to DB...');
        await client.connect();
        const db = client.db();

        const embeddingsColl = db.collection('rag_embeddings');
        // Correct collection names from SECONDARY_db.js
        const chatsColl = db.collection('stage2_chats');
        const messagesColl = db.collection('stage2_messages');

        // 1. Map ChatId -> Category (Collection)
        console.log('Mapping chat categories...');
        const chats = await chatsColl.find({}, { projection: { _id: 1, collection: 1 } }).toArray();
        const chatCategoryMap = {};
        chats.forEach(c => {
            chatCategoryMap[c._id.toString()] = c.collection || 'unknown';
        });
        console.log(`Loaded ${chats.length} chats.`);

        // 2. Backfill existing embeddings with missing category
        console.log('Backfilling existing embeddings...');
        const embeddings = await embeddingsColl.find({}).toArray();
        let updatedCount = 0;

        for (const doc of embeddings) {
            if (doc.metadata && doc.metadata.category) continue; // skip if already has category

            let category = 'unknown';
            // Try to find chatId in metadata or sourceId
            const chatId = doc.metadata?.chatId || doc.sourceId?.split(':')[0]; // heuristic

            // If we can map it, use it
            // For flashcards/quizzes, sourceId might be savedId:idx, where savedId is not chatId.
            // We need a better way if metadata.chatId is missing.
            // But for now, let's try our best.

            // Actually, flashcards/quizzes don't store chatId in embedding metadata currently (until my recent fix).
            // So for old ones, we might be out of luck unless we look up the flashcard/quiz doc itself.
            // Let's keep it simple: if we can't find it, we default to 'unknown'.

            if (chatCategoryMap[chatId]) {
                category = chatCategoryMap[chatId];
            }

            await embeddingsColl.updateOne(
                { _id: doc._id },
                { $set: { 'metadata.category': category } }
            );
            updatedCount++;
        }
        console.log(`Updated ${updatedCount} embeddings with category.`);

        // 3. Embed existing chats that are missing from embeddings
        console.log('Embedding missing chat messages...');
        // Fetch all user/assistant messages (skip system)
        const messages = await messagesColl.find({ role: { $ne: 'system' } }).toArray();
        let newEmbeddingsCount = 0;

        for (const msg of messages) {
            const chatId = msg.chatId;
            if (!chatId) continue;

            // Check if already embedded
            const exists = await embeddingsColl.findOne({ sourceId: msg._id.toString() });
            if (exists) continue;

            const category = chatCategoryMap[chatId] || 'unknown';
            const userId = msg.userId || 'anonymous'; // This might be issue if msg doesn't have userId

            // We need userId to store it. If msg doesn't have it, we might need to look up chat.
            // Assuming messages have userId structure based on schema.

            try {
                const text = msg.content;
                if (!text || text.length < 5) continue; // skip very short msgs

                console.log(`Embedding msg ${msg._id}...`);
                const vector = await embedText(text);

                await embeddingsColl.insertOne({
                    userId: userId,
                    sourceType: 'chat',
                    sourceId: msg._id.toString(),
                    text: text,
                    embedding: vector,
                    metadata: {
                        chatId: chatId,
                        category: category,
                        role: msg.role
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                newEmbeddingsCount++;
            } catch (err) {
                console.error(`Failed to embed msg ${msg._id}:`, err.message);
            }
        }

        console.log(`Created ${newEmbeddingsCount} new chat embeddings.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.close();
    }
}

run();
