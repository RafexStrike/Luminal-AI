// app/api/messages/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/dbConnect";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("capstoneDB");
    const chatsCollection = db.collection("chatCOL");

    const messages = await chatsCollection.find().toArray();
    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json(
      { error: "DB error", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { message } = await req.json();
    const client = await clientPromise;
    const db = client.db("capstoneDB");
    const chatsCollection = db.collection("chatCOL");

    const result = await chatsCollection.insertOne({ message });
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (err) {
    return NextResponse.json(
      { error: "DB error", details: err.message },
      { status: 500 }
    );
  }
}
