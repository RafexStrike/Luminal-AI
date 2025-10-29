import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  const client = await clientPromise;
  const database = client.db("ChatDataRafi");
  const ChatsData = await database.collection("ChatsData");

  // --- get the query parameter ?id=1759123536081
  const { searchParams } = new URL(request.url);
  const sessionId = Number(searchParams.get("id")); // convert from string → number

  // --- find all chats with same id and sender = "bot"
  const chats = await ChatsData.find({
    id: sessionId,
    sender: "bot",
  }).toArray();

  return NextResponse.json(chats);
}
