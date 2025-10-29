import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("ChatDataRafi");
    const chatsCollection = database.collection("ChatsData");

    console.log("Connected to ChatDataRafi -> ChatsData");

    // DEBUG: check total documents
    const allDocs = await chatsCollection.find({}).toArray();
    console.log("Total documents in collection:", allDocs.length);
    console.log("Sample documents:", allDocs.slice(0, 3));

    // Aggregation to get first message per unique ID
    const uniqueChats = await chatsCollection
      .aggregate([
        {
          $match: { id: { $exists: true } }, // match any document with an id
        },
        {
          $sort: { timestamp: 1 }, // earliest messages first
        },
        {
          $group: {
            _id: "$id", // group by id
            firstMessage: { $first: "$content" }, // take first content
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            firstMessage: 1,
          },
        },
      ])
      .toArray();

    console.log("Unique chats count:", uniqueChats.length);

    return NextResponse.json(uniqueChats);
  } catch (error) {
    console.error("Error in /api/getChatIDandTitle:", error);
    return NextResponse.json(
      { error: "Failed to fetch unique chat IDs" },
      { status: 500 }
    );
  }
}
