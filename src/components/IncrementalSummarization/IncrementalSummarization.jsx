// src/components/increamentalSummarizaton/increamentalSummarizaton.jsx
import React, { useState } from "react";

export default function IncrementalSummarization({ selectedMessages }) {

  const [summary, setSummary] = useState("");

  console.log(
    "selected messages from IncrementalSummarization.jsx",
    selectedMessages
  );

  const handleGeneratingIncrementalSummary = async () => {
    try {
      // Convert messages into array of paragraphs (array of strings)
      const arrayOfParagraphs = selectedMessages.map((msg) =>
        msg.content || JSON.stringify(msg)
      );

      console.log("Sending arrayOfParagraphs:", arrayOfParagraphs);

      const res = await fetch("http://localhost:5000/api/generateIncrementalSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrayOfParagraphs }),
      });

      if (!res.ok) {
        throw new Error(`LLM API returned ${res.status}`);
      }

      const data = await res.json();

      console.log("Incremental summary received:", data.summary);

      setSummary(data.summary);
    } catch (error) {
      console.log(
        "Error in IncrementalSummarization.jsx while generating incremental summary:",
        error
      );
    }
  };

  return (
    <div>
      incrementalSummarization

      <button
        className="border p-2 border-blue-900 mt-2"
        onClick={handleGeneratingIncrementalSummary}
      >
        Generate Incremental Summary
      </button>

      {summary && (
        <div className="mt-4 p-4 border rounded-lg bg-muted">
          <h4 className="font-bold mb-2">Incremental Summary:</h4>
          <p className="text-sm">{summary}</p>
        </div>
      )}
    </div>
  );
}
