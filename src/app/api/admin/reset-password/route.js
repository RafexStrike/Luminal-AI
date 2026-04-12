// FILE: src/app/api/admin/reset-password/route.js
// DESCRIPTION: Admin endpoint to reset user passwords (requires admin auth token)

import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    const adminToken = process.env.ADMIN_RESET_TOKEN;

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400 }
      );
    }

    const mongoUri = process.env.MONGODB_URI;
    const client = new MongoClient(mongoUri);

    try {
      await client.connect();
      const db = client.db(process.env.DB_NAME || "luminalDB");
      const usersCollection = db.collection("user");

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with new password
      const result = await usersCollection.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Password reset for ${email}`,
        }),
        { status: 200 }
      );
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
