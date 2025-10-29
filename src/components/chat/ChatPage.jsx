"use client";
import { useState } from "react";
import UploadButton from "@/components/chat/UploadButton";
import UploadModal from "@/components/chat/UploadModal";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatComposer from "@/components/chat/ChatComposer";
import { uploadVideoAndSummarize } from "@/lib/uploadVideo";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoUpload = async (file) => {
    // Call our helper
    const data = await uploadVideoAndSummarize(file);

    if (data.summary) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: `Summary: ${data.summary}`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } else if (data.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: `Error: ${data.error}`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex flex-col flex-1">
        <div className="flex justify-end p-4">
          <UploadButton onClick={() => setIsModalOpen(true)} />
        </div>
        <ChatWindow messages={messages} />
        {/* <ChatComposer  /> */}
        <ChatComposer
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
        />
      </div>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleVideoUpload}
      />
    </div>
  );
}
