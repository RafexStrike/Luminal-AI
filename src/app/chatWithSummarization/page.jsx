"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatComposer from "@/components/chat/ChatComposer";

export default function ChatPage() {
  const [chatUniqueID, setChatUniqueID] = useState(Date.now());
 
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");


  const saveChatDataToDatabase = async (data) => {
    try {
      const dataToSend = await fetch("/api/getAndPostChatData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log(
        "Sorry. Failed to connect with mongodb. The error is: ",
        error
      );
    }
  };


  // normal text message send
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    const newUserMessage = {
      id: chatUniqueID,
      content: message,
      sender: "user",
      timestamp: new Date(),
    };
 
    saveChatDataToDatabase(newUserMessage);

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message }),
      });
      const data = await res.json();
      const newBotMessage = {
        id: chatUniqueID,
        content: data.reply || "No response",
        sender: "bot",
        timestamp: new Date(),
      };
      saveChatDataToDatabase(newBotMessage);
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: chatUniqueID,
          content: "Error contacting AI: " + err.message,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-base-100">
      <ChatSidebar
        conversations={[]}
        activeConversation={1}
        onConversationSelect={() => {}}
        onNewChat={() => {
          setChatUniqueID(Date.now());
        }}
      />
      <div className="flex flex-col flex-1">
        <ChatWindow messages={messages} />

        <ChatComposer
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
