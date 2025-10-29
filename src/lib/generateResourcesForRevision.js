// src/lib/generateResourcesForRevision.js
import { askLUMINAL } from "./callTheLlmAsAnUtilityFunctionForGeneratingRevisionMaterials";

export async function generateResourcesForRevision(chatData) {
  if (!chatData || chatData.length === 0) {
    console.error("Error: No chat data provided.");
    return null;
  }

  const conversationText = chatData
    .map(chat => `${chat.sender}: ${chat.content}`)
    .join("\n---\n");

  console.log("Conversation prepared for resource generation:", conversationText);

  try {
    const res = await fetch("/api/generateRevisionResources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationText }),
    });

    if (!res.ok) throw new Error("Failed to generate revision data");

    const data = await res.json();
    console.log("AI Generated Resources:", data);
    return {
      revisionItems: data.revisionItems || [],
      status: "ready_to_store",
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating resources:", error);
    return { revisionItems: [], error: error.message };
  }
}

