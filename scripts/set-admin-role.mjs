// FILE: scripts/set-admin-role.mjs
// DESCRIPTION: Set admin role for admin@luminal.com

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "luminalDB";

async function setAdminRole() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(dbName);
    const usersCollection = db.collection("user");

    const result = await usersCollection.updateOne(
      { email: "admin@luminal.com" },
      { $set: { role: "admin" } }
    );

    if (result.matchedCount > 0) {
      console.log("✅ Admin role set for admin@luminal.com");
    } else {
      console.log("❌ Admin user not found. Please create it first via login.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setAdminRole();
