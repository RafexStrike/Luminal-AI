/* _   _                          _   _____                                              _   
| | | |                        | | /  __ \                                            | |  
| | | |_ __  _   _ ___  ___  __| | | /  \/ ___  _ __ ___  _ __   ___  _ __   ___ _ __ | |_ 
| | | | '_ \| | | / __|/ _ \/ _` | | |    / _ \| '_ ` _ \| '_ \ / _ \| '_ \ / _ \ '_ \| __|
| |_| | | | | |_| \__ \  __/ (_| | | \__/\ (_) | | | | | | |_) | (_) | | | |  __/ | | | |_ 
 \___/|_| |_|\__,_|___/\___|\__,_|  \____/\___/|_| |_| |_| .__/ \___/|_| |_|\___|_| |_|\__|
                                                         | |                               
                                                         |_|                               
 */
// note: this component is unused...............
// ******note: this component is unused!
// src/components/noteComponents/ShowExistingCollectionList.jsx

"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, useContext } from "react";
import { EditorContext } from "@tiptap/react";

export function ShowExistingCollectionModal() {
  const [collections, setCollections] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const { editor } = useContext(EditorContext);

  // Fetch all collections
  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch("/api/notesCollection");
        if (!res.ok)
          throw new Error(
            "Failed to fetch data. Giving error from ShowExistingCollection.jsx"
          );
        const data = await res.json();
        console.log(
          "Fetched data in ShowExistingCollection.jsx component:",
          data
        );
        setCollections(data);
      } catch (error) {
        console.error(
          "Error fetching collections (ShowExistingCollection.jsx):",
          error
        );
      }
    }
    fetchCollection();
  }, []);

  // Function to remove HTML tags and create a short title
  const extractTitleFromHTML = (html) => {
    // Remove HTML tags
    const textOnly = html.replace(/<[^>]*>/g, " ").trim();

    // Split into words and take first 5
    const words = textOnly.split(/\s+/).slice(0, 5).join(" ");

    // If text is empty, fallback
    return words || "Untitled Note";
  };

  // Function to handle saving
   async function handleSavingOnExistingCollections(collectionId) {
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
    <div className="grid gap-4">
      <div className="grid gap-3">
        {collections.map((collection) => (
          <Button
            key={collection._id}
            onClick={() => handleSavingOnExistingCollections(collection._id)}
          >
            {collection.notesCollectionName || collection._id}
          </Button>
        ))}
      </div>
    </div>
  );
}
