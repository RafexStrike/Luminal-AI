// src/app/api/saveNotesToExistingCollection/route.js

import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const database = client.db("Notes");
    const notesCollection = database.collection("notes");

    const body = await request.json();
    const { collectionId, title, content } = body;

    if (!collectionId || !title || !content) {
      return NextResponse.json(
        { error: "collectionId, title, and content are required" },
        { status: 400 }
      );
    }

    const newNote = {
      collectionId: new ObjectId(collectionId),
      title,
      content,
      createdAt: new Date(),
    };

    const result = await notesCollection.insertOne(newNote);

    return NextResponse.json(
      {
        message: "Note saved successfully",
        noteId: result.insertedId,
        note: newNote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving note:", error);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }
}
