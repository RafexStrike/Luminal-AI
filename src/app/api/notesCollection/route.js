// src/app/api/notesCollection/route.js

import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const client = await clientPromise;
  const database = client.db("Notes");
  const savedNotes = await database
    .collection("savedNotesCollection")
    .find({})
    .toArray();

  return NextResponse.json(savedNotes);
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("Notes");
    const { notesCollectionName } = await request.json();

    // Insert a new collection
    const result = await db.collection("savedNotesCollection").insertOne({
      name: notesCollectionName,
      createdAt: new Date(),
    });

    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error creating collection:", error);
    return new NextResponse("Failed to create collection", { status: 500 });
  }
}
