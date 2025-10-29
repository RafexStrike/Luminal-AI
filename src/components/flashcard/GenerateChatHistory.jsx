// src/components/flashcard/GenerateResources.jsx

"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { generateResourcesForRevision } from "@/lib/generateResourcesForRevision";

// Utility function to truncate a string
const truncateMessage = (message, wordLimit = 4) => {
  if (!message) return "";
  const words = message.split(/\s+/);
  if (words.length <= wordLimit) {
    return message;
  }
  return words.slice(0, wordLimit).join(" ") + "...";
};

export default function GenerateResources() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch("/api/getChatIDandTitle");
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        console.log("Fetched data:", data);
        setCollections(data);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    }
    fetchCollection();
  }, []);

  useEffect(() => {
    console.log("Updated collections state:", collections);
  }, [collections]);

  const handleGenerateResources = (id) => {
    async function fetchChats() {
      try {
        console.log(`Fetching chats for ID: ${id}`);

        const res = await fetch(`/api/chatsViaUniqueID?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch chats");
        const chatData = await res.json();
        console.log("Fetched chat data:", chatData);

        const generatedRevisionResources = await generateResourcesForRevision(
          chatData
        );

        console.log(
          "The resources that we got from the generatedResourcesForRevision utility function is:",
          generatedRevisionResources
        );
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    }
    fetchChats();
  };

  return (
    <div>
      <h1>hello from GenerateResources.jsx</h1>
      <div className="grid gap-4">
        <div className="grid gap-3">
          {collections.map((collection) => {
            if (!collection.id) return null;

            // Get the truncated and full message
            const fullMessage =
              collection.firstMessage || `ID: ${collection.id}`;
            const displayMessage = truncateMessage(fullMessage, 4);

            return (
              <Button
                key={collection.id}
                onClick={() => handleGenerateResources(collection.id)}
                title={fullMessage}
              >
                {displayMessage}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
