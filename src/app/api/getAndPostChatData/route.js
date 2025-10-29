// app/api/getAndPostChatData/route.js
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

// Handle GET /api/getAndPostChatData
export async function GET() {
  const client = await clientPromise;
  const database = client.db("ChatDataRafi");
  const ChatsData = await database.collection("ChatsData").find({}).toArray();
  return NextResponse.json(ChatsData);
}

// Handle POST /api/getAndPostChatData
export async function POST(request) {
  const client = await clientPromise;
  const database = client.db("ChatDataRafi");
  const body = await request.json();

  await database.collection("ChatsData").insertOne(body);

  return NextResponse.json({ message: "User added" }, { status: 201 });
}
