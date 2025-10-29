"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateResourcesForRevision } from "@/lib/generateResourcesForRevision";

// ✂️ Utility to shorten text
const truncateMessage = (message, wordLimit = 6) => {
  if (!message) return "";
  const words = message.split(/\s+/);
  return words.length <= wordLimit
    ? message
    : words.slice(0, wordLimit).join(" ") + "...";
};

export default function FlashcardPage() {
  const [collections, setCollections] = useState([]); // 🗂 Chat history from DB
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🧠 Fetch chat list (sidebar data)
  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch("/api/getChatIDandTitle");
        if (!res.ok) throw new Error("Failed to fetch chat list");
        const data = await res.json();
        console.log("✅ Chat list fetched:", data);
        setCollections(data);
      } catch (err) {
        console.error("Error fetching chat list:", err);
      }
    }
    fetchCollection();
  }, []);

  // 🧩 When clicking a chat in sidebar
  const handleChatClick = async (id) => {
    try {
      setLoading(true);
      console.log(`🗨 Fetching messages for chat ID: ${id}`);

      const res = await fetch(`/api/chatsViaUniqueID?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch chat messages");
      const chatData = await res.json();
      console.log("💬 Chat data:", chatData);

      const generatedRevisionResources = await generateResourcesForRevision(
        chatData
      );
      console.log("📚 Generated resources:", generatedRevisionResources);

      // Extract only flashcards (if your LLM mixes MCQs + flashcards)
      const allItems = generatedRevisionResources.revisionItems || [];

      // starts......
      // Convert `front`/`back` to `question`/`answer`
      const flashcards = allItems.map((item) => ({
        question: item.front || item.question,
        answer: item.back || item.answer,
      }));
      // ends.......
      // const flashcards = allItems.filter(
      //   (item) => item.type === "flashcard" || item.answer
      // );

      setSelectedTopic({
        id,
        flashcards,
      });

      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error("❌ Error loading revision resources:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Navigation
  const nextCard = () => {
    if (selectedTopic && currentIndex < selectedTopic.flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 🧭 Sidebar - Chat History */}
      <div className="w-1/4 border-r bg-muted p-4">
        <h2 className="text-xl font-bold mb-4">Chat History</h2>
        <ScrollArea className="h-[calc(100vh-100px)] pr-2">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          ) : (
            // Reverse the collections so latest appears first
            [...collections].reverse().map((collection) => (
              <Card
                key={collection.id}
                className={`mb-2 cursor-pointer transition ${
                  selectedTopic?.id === collection.id
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted-foreground/10"
                }`}
                onClick={() => handleChatClick(collection.id)}
              >
                <CardHeader>
                  <CardTitle className="text-sm">
                    {truncateMessage(collection.firstMessage, 6)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {collection.dateCreated || "No date"}
                  </p>
                </CardHeader>
              </Card>
            ))
          )}
        </ScrollArea>
      </div>

      {/* 🧠 Flashcard Viewer */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {loading ? (
          <p className="text-muted-foreground text-lg">
            Generating flashcards...
          </p>
        ) : selectedTopic && selectedTopic.flashcards?.length > 0 ? (
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + (showAnswer ? "-answer" : "-question")}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  className="cursor-pointer shadow-lg min-h-[220px] flex items-center justify-center"
                  onClick={() => setShowAnswer((prev) => !prev)}
                >
                  <CardContent className="p-8 text-center text-lg font-medium">
                    {showAnswer
                      ? selectedTopic.flashcards[currentIndex]?.answer
                      : selectedTopic.flashcards[currentIndex]?.question}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={prevCard}
                disabled={currentIndex === 0}
                variant="outline"
              >
                Prev
              </Button>
              <Button
                onClick={nextCard}
                disabled={currentIndex === selectedTopic.flashcards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-lg text-center max-w-md">
            Select a chat from the sidebar to generate flashcards for review.
          </p>
        )}
      </div>
    </div>
  );
}
