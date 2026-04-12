// FILE: scripts/bind-rag-data.mjs
// DESCRIPTION: Bind RAG embeddings and related data from old rafi user to new rafi@luminal.com

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "luminalDB";

// Old orphaned user ID that had the original rafi data
const oldUserId = "69609228c529a11c428ed508";

async function bindRagData() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(dbName);
    const usersCollection = db.collection("user");

    // Find the new rafi@luminal.com user
    const rafiUser = await usersCollection.findOne({ email: "rafi@luminal.com" });

    if (!rafiUser) {
      console.log("❌ ERROR: rafi@luminal.com user not found!");
      return;
    }

    const newRafiUserId = rafiUser._id.toString();
    console.log(`🔍 Binding RAG data to: ${newRafiUserId}\n`);

    // RAG-related collections in luminalDB
    const luminalRagCollections = [
      "rag_embeddings",
      "rag_chunks",
      "rag_documents",
      "rag_vectors",
    ];

    // RAG-related collections in ragDB (revise system)
    const ragDbCollections = [
      "revise_sessions",
      "revise_chat_history",
    ];

    console.log("🔄 Searching and binding RAG data...\n");

    let totalUpdated = 0;

    // Check luminalDB for standard RAG collections
    console.log(`📦 Checking database: ${dbName}`);
    for (const collName of luminalRagCollections) {
      const collections = await db.listCollections().toArray();
      const collExists = collections.some(c => c.name === collName);

      if (!collExists) {
        continue;
      }

      const collection = db.collection(collName);
      const result = await collection.updateMany(
        { userId: oldUserId },
        { $set: { userId: newRafiUserId, updatedAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        console.log(`  ✓ ${collName}: ${result.modifiedCount} documents bound`);
        totalUpdated += result.modifiedCount;
      } else if (collExists) {
        console.log(`  ℹ️  ${collName}: No documents to migrate`);
      }
    }

    // Check ragDB for revise system collections
    console.log(`📦 Checking database: ragDB`);
    const ragDB = client.db("ragDB");
    for (const collName of ragDbCollections) {
      const collections = await ragDB.listCollections().toArray();
      const collExists = collections.some(c => c.name === collName);

      if (!collExists) {
        continue;
      }

      const collection = ragDB.collection(collName);
      const result = await collection.updateMany(
        { userId: oldUserId },
        { $set: { userId: newRafiUserId, updatedAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        console.log(`  ✓ ${collName}: ${result.modifiedCount} documents bound`);
        totalUpdated += result.modifiedCount;
      } else if (collExists) {
        console.log(`  ℹ️  ${collName}: No documents to migrate`);
      }
    }

    console.log(`\n✅ RAG data binding complete! Total: ${totalUpdated} documents\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

bindRagData();
