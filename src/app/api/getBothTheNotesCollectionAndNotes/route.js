// src/app/api/getBothTheNotesCollectionAndNotes/route.js
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("Notes");

    const collectionsColl = db.collection("savedNotesCollection");
    const notesColl = db.collection("notes");

    const collections = await collectionsColl.find({}).toArray();
    console.log("✅ Found collections:", collections.length);

    const result = await Promise.all(
      collections.map(async (col) => {
        const colIdStr = col._id?.toString();

        // log every collection name and id
        console.log("🔹 Processing collection:", col.notesCollectionName, colIdStr);

        const queries = [{ collectionId: colIdStr }];
        try {
          queries.push({ collectionId: new ObjectId(colIdStr) });
        } catch (e) {}

        const notes = await notesColl
          .find({ $or: queries })
          .sort({ createdAt: -1 })
          .toArray();

        console.log(`   └─ Found ${notes.length} notes for this collection`);

        const mappedNotes = notes.map((n) => ({
          id: n._id?.toString(),
          title:
            n.title ||
            (n.content
              ? stripHtml(n.content).split(/\s+/).slice(0, 6).join(" ").trim() ||
                "Untitled Note"
              : "Untitled Note"),
        }));

        return {
          collectionId: colIdStr,
          collectionName:
            col.notesCollectionName ||
            col.name ||
            "Untitled Collection",
          notes: mappedNotes,
        };
      })
    );

    console.log("✅ Final result:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Error in getBothTheNotesCollectionAndNotes route:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
