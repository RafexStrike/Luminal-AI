
import { MongoClient } from 'mongodb';

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

        console.log("=== Counting by Source Type ===");
        const counts = await collection.aggregate([
            { $group: { _id: "$sourceType", count: { $sum: 1 } } }
        ]).toArray();
        console.log(counts);

        console.log("\n=== Sample Flashcards ===");
        const flashcards = await collection.find({ sourceType: 'flashcard' }).limit(5).toArray();
        flashcards.forEach(doc => {
            console.log(`ID: ${doc._id}, SourceId: ${doc.sourceId}`);
            console.log(`Metadata:`, doc.metadata);
            console.log('---');
        });

        console.log("\n=== Sample Chats ===");
        const chats = await collection.find({ sourceType: 'chat' }).limit(5).toArray();
        chats.forEach(doc => {
            console.log(`ID: ${doc._id}, SourceId: ${doc.sourceId}`);
            console.log(`Metadata:`, doc.metadata);
            console.log('---');
        });

        console.log("\n=== Checking 'Cloud' Category ===");
        const cloudDocs = await collection.find({ 'metadata.category': 'Cloud' }).count();
        console.log(`Total docs in 'Cloud': ${cloudDocs}`);

        if (cloudDocs > 0) {
            const types = await collection.distinct('sourceType', { 'metadata.category': 'Cloud' });
            console.log(`Types available in 'Cloud':`, types);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
