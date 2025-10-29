"use client";

import React, { useState } from "react";
import { askLLM } from "@/lib/callTheLlmUtility";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from "lucide-react"; 


export default function ModalForCallingTheLLM() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(prompt);
    console.log("sending the prompt to the LLM...");
    const res = await askLLM(prompt);
    setResponse(res);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {" "}
          <Bot className="mr-1/2 h-4 w-4" /> Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ask AI</DialogTitle>
          <DialogDescription>
            Ask anything to the AI and get a response
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Your Question</Label>
            <Input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your question here..."
            />
          </div>

          <Button type="submit" className="w-full">
            Ask AI
          </Button>
        </form>

        {response && (
          <div className="mt-4 p-4 border rounded-lg bg-muted">
            <h4 className="font-bold mb-2">AI Response:</h4>
            <p className="text-sm">{response}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
