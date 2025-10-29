import React from "react";
import { askLLM } from "@/lib/callTheLlmUtility";

export default function TestComponetForUsingLlmUtilityFunction() {
  const prompt = "hey, how are you today?";
  const response = askLLM(prompt);
  return (
    <div>
      <h2>we are sending to the llm, hey, how are you today?</h2>
      <h3>{response}</h3>
    </div>
  );
}
