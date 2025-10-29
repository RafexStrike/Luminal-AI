"use client";
import { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditorContext } from "@tiptap/react";

export default function ExistingCollectionDialog({ open, onOpenChange }) {
  const [collections, setCollections] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const { editor } = useContext(EditorContext);

  // Fetch collections *only* when dialog opens
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    fetch("/api/notesCollection")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => mounted && setCollections(data))
      .catch((err) => {
        console.error(err);
      });
    return () => (mounted = false);
  }, [open]);

  async function handleSave(collectionId) {
    if (!editor) return;
    setSavingId(collectionId);
    try {
      const html = editor.getHTML();
      const title = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).slice(0, 5).join(" ") || "Untitled Note";

      const res = await fetch("/api/saveNotesToExistingCollection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId, title, content: html }),
      });
      if (!res.ok) throw new Error(await res.text());
      // success: close dialog
      onOpenChange(false);
    } catch (err) {
      console.error("save failed", err);
      alert("Failed to save note");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a collection</DialogTitle>
          <DialogDescription>Select a collection to save the notes</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {collections.length === 0 ? (
            <div>No collections found.</div>
          ) : (
            collections.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-2">
                <div>{c.notesCollectionName || c._id}</div>
                <Button onClick={() => handleSave(c._id)} disabled={!!savingId}>
                  {savingId === c._id ? "Saving..." : "Save"}
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
