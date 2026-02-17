
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
        await client.connect();
        const db = client.db();
        const collection = db.collection('rag_embeddings');

        // Create a dummy flashcard embedding
        const cardText = "Q: What is cloud computing?\nA: the delivery of computing services including servers, storage, databases, networking, software, analytics, and intelligence over the Internet.";
        console.log("Embedding flashcard...");
        const vector = await embedText(cardText);

        // Use a known user ID from the logs: 69609228c529a11c428ed508
        const userId = "69609228c529a11c428ed508";

        await collection.insertOne({
            userId: userId,
            sourceType: 'flashcard',
            sourceId: 'manual_seed_1',
            text: cardText,
            embedding: vector,
            metadata: {
                category: 'Cloud',
                difficulty: 'easy',
                tags: ['cloud', 'intro']
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("Seeded 1 flashcard for user " + userId + " in category Cloud");

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
