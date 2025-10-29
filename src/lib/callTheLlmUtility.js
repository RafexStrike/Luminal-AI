// src/lib/callTheLlmUtility.js

export async function askLLM(prompt) {
  try {
    const res = await fetch("http://localhost:3000/api/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({prompt: prompt}),
    });

    if (!res.ok) {
      throw new Error(`LLM API returned ${res.status}`);
    }

    const data = await res.json();

    return data.reply;
  } catch (error) {
    console.error("Error in askLLM:", error);
    // throw new Error(
    //   `Network error occured. Throwing error from " src/lib/callTheLlmUtility.js -> catch(error)"`
    // );
  }
}
