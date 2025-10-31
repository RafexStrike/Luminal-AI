// src/components/normalSummarization/normalSummarization.jsx
import React, { useState } from "react";

export default function NormalSummarization({ selectedMessages }) {

    const [response, setResponse] = useState("");

  console.log(
    "selected messages from normalSummarization.jsx",
    selectedMessages
  );

  // const handleGeneratingNormalSummary = async (selectedMessages) => {

  //   try {
  //     const res = await fetch(
  //       "http://localhost:5000/api/generateNormalSummary",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ prompt: selectedMessages }),
  //       }
  //     );

  //     if (!res.ok) {
  //       throw new Error(`LLM API returned ${res.status}`);
  //     }

  //     const data = await res.json();

  //     setResponse(data.reply);

  //     return data.reply;
  //   } catch (error) {
  //     console.log(
  //       "Sorry, there has been an error in  src/components/normalSummarization/normalSummarization.jsx, the error is:",
  //       error
  //     );
  //   }
  // };
  const handleGeneratingNormalSummary = async (selectedMessages) => {
  try {
    // Convert messages to a formatted string
    const messagesText = selectedMessages
      .map((msg, idx) => `Message ${idx + 1}: ${msg.content || JSON.stringify(msg)}`)
      .join('\n\n');

    const res = await fetch(
      "http://localhost:5000/api/generateNormalSummary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: messagesText }), // Send as string
      }
    );

    if (!res.ok) {
      throw new Error(`LLM API returned ${res.status}`);
    }

    const data = await res.json();
    setResponse(data.reply);
    return data.reply;
  } catch (error) {
    console.log("Error in normalSummarization:", error);
  }
};
  
  return (
    <div>
      normalSummarization
      <button
        className="border p-2 border-purple-900"
        onClick={()=>{handleGeneratingNormalSummary(selectedMessages)}}
      >
        Generate Normal Summary
      </button>
      {response && (
        <div className="mt-4 p-4 border rounded-lg bg-muted">
          <h4 className="font-bold mb-2">AI Response:</h4>
          <p className="text-sm">{response}</p>
        </div>
      )}
    </div>
  );
}
