// FILE: scripts/seed_admin.mjs
// DESCRIPTION: Seed script to create admin and demo users in MongoDB

import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "luminalDB";

if (!mongoUri) {
  console.error("❌ Error: MONGODB_URI environment variable is not set");
  process.exit(1);
}

async function seedAdminUsers() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");

    const db = client.db(dbName);
    const usersCollection = db.collection("user");

    // Check if users table/collection exists, if not create it
    const collections = await db.listCollections().toArray();
    const userCollectionExists = collections.some((col) => col.name === "user");

    if (!userCollectionExists) {
      console.log("📋 Creating 'user' collection...");
      await db.createCollection("user");
    }

    const now = new Date();
    const adminEmail = "admin@luminal.com";
    const adminPassword = "admin@123"; // Default admin password
    const demoEmail = "rafi@rafi.com";
    const demoPassword = "rafi123";

    // Hash passwords
    const saltRounds = 10;
    const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
    const hashedDemoPassword = await bcrypt.hash(demoPassword, saltRounds);

    // Check if admin already exists
    const adminExists = await usersCollection.findOne({ email: adminEmail });

    if (!adminExists) {
      const adminUser = {
        email: adminEmail,
        name: "Admin User",
        emailVerified: true,
        image: null,
        password: hashedAdminPassword,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      };

      await usersCollection.insertOne(adminUser);
      console.log("✓ Admin user created:", adminEmail);
      console.log(`  └─ Password: ${adminPassword}`);
    } else {
      console.log("ℹ Admin user already exists:", adminEmail);
      // Update password and role for existing admin
      await usersCollection.updateOne(
        { email: adminEmail },
        {
          $set: {
            password: hashedAdminPassword,
            role: "admin",
            emailVerified: true,
            updatedAt: now,
          },
        }
      );
      console.log("  └─ Updated admin password and role");
      console.log(`  └─ New password: ${adminPassword}`);
    }

    // Check if demo user already exists
    const demoExists = await usersCollection.findOne({ email: demoEmail });

    if (!demoExists) {
      const demoUser = {
        email: demoEmail,
        name: "Demo User",
        emailVerified: true,
        image: null,
        password: hashedDemoPassword,
        role: "user",
        createdAt: now,
        updatedAt: now,
      };

      await usersCollection.insertOne(demoUser);
      console.log("✓ Demo user created:", demoEmail);
      console.log(`  └─ Password: ${demoPassword}`);
    } else {
      console.log("ℹ Demo user already exists:", demoEmail);
      // Update password and role for existing demo user
      await usersCollection.updateOne(
        { email: demoEmail },
        {
          $set: {
            password: hashedDemoPassword,
            role: "user",
            emailVerified: true,
            updatedAt: now,
          },
        }
      );
      console.log("  └─ Updated demo user password and role");
      console.log(`  └─ New password: ${demoPassword}`);
    }

    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("✓ MongoDB connection closed");
  }
}

seedAdminUsers();
