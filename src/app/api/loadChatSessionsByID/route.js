//   /api/loadChatSessionByID
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("ChatsDataRafi");
    const collection = db.collection("ChatsData");

    const uniqueIds = await collection.distinct("id");

    return new Response(JSON.stringify(uniqueIds), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error fetching sessions", { status: 500 });
  }
}
