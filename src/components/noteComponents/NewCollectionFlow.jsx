"use client";
import { useState, useContext, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EditorContext } from "@tiptap/react";

export default function NewCollectionDialog({ open, onOpenChange }) {
  const [newCollectionName, setNewCollectionName] = useState("New Collection");
  const [loading, setLoading] = useState(false);
  const { editor } = useContext(EditorContext);

  useEffect(() => {
    if (!open) setNewCollectionName("New Collection");
  }, [open]);

  async function handleCreate(e) {
    e?.preventDefault();
    if (!editor) return;
    setLoading(true);

    try {
      // Step 1️⃣: Create a new collection
      const createRes = await fetch("/api/notesCollection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesCollectionName: newCollectionName }),
      });

      if (!createRes.ok) throw new Error(await createRes.text());
      const createdCollection = await createRes.json();

      console.log(createdCollection)

      // Optional safety: make sure the server returned the collection ID
      const collectionId = createdCollection._id || createdCollection.insertedId;

      console.log(collectionId)
      if (!collectionId) throw new Error("No collection ID returned from server.");

      // Step 2️⃣: Save the note content into that collection
      const html = editor.getHTML();
      const title =
        html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).slice(0, 5).join(" ") ||
        "Untitled Note";

      const saveRes = await fetch("/api/saveNotesToExistingCollection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          title,
          content: html,
        }),
      });

      if (!saveRes.ok) throw new Error(await saveRes.text());

      // ✅ Both steps done successfully
      alert("Note saved successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create or save note:", err);
      alert("Failed to create collection or save note.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>Give the new collection name</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="name-1">Name</Label>
            <Input
              id="name-1"
              name="name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create & Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
