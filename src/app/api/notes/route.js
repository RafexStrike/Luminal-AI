import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  const client = await clientPromise;
  const database = client.db("Notes");
  const notesCollection = database.collection("savedNotesCollection")
  const notes = database.collection("savedNotes")
  const body = await request.json();

  const collectionID = body.id;
}

import { ObjectId } from "mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Note ID is required" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("Notes");
    const notesCollection = db.collection("notes");

    const note = await notesCollection.findOne({ _id: new ObjectId(id) });

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ content: note.content }, { status: 200 });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}