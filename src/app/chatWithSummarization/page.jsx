"use client";

import { useState } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatComposer from "@/components/chat/ChatComposer";

import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
    <SidebarProvider className="flex h-screen bg-base-100">
      <Sidebar>
        <ChatSidebar
          conversations={[]}
          activeConversation={1}
          onConversationSelect={() => {}}
          onNewChat={() => {
            setChatUniqueID(Date.now());
          }}
        />
      </Sidebar>

      <main className="flex flex-col flex-1">
        <SidebarTrigger />
        <div className="flex flex-1">
          <div className="w-1/2 flex flex-col m-2 border-r  border-purple-400">
            <ChatWindow messages={messages} />

            <ChatComposer
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="w-1/2 border-r flex">
            <div className="w-1/2 border-r border-purple-300 p-4">
              <h2 className="font-bold text-lg mb-2">Normal Summarization</h2>
            </div>

            <div className="w-1/2 p-4">
              <h2 className="font-bold text-lg mb-2">
                Increamental Summarization
              </h2>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
