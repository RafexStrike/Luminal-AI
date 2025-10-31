// /components/TestSummary.jsx
"use client";

import { useState } from "react";

export default function TestSummary() {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary("");

    // Build a simple array (single message for now)
    const messages = [{"role":"user","content":"Explain quantum computing simply"}];

    try {
      const res = await fetch("http://localhost:3002/api/generateNormalSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({messages}),
      });

      const data = await res.json();
      console.log(data)
      setSummary(data.summary || JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setSummary("Error calling backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Test Summary</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message to summarize"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Summarizing..." : "Get Summary"}
        </button>
      </form>

      {summary && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <strong>Summary:</strong>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
