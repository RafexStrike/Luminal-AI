import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "luminalDB";

export async function GET(request) {
  try {
    const userId = request.headers.get("X-User-ID");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db(dbName);
    const usersCollection = db.collection("user");

    // Convert userId string to ObjectId if it's a valid ObjectId
    let query = { _id: userId };
    try {
      query = { _id: new ObjectId(userId) };
    } catch (e) {
      // If it's not a valid ObjectId, use it as a string
      query = { _id: userId };
    }

    const user = await usersCollection.findOne(query);
    await client.close();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      role: user.role || "user",
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
