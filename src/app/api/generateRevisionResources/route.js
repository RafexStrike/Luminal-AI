import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req) {
  try {
    const { conversationText } = await req.json();

    if (!conversationText) {
      return NextResponse.json({ error: "conversationText required" }, { status: 400 });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates structured study materials (flashcards) as a single JSON object with a 'revisionItems' array.",
      },
      {
        role: "user",
        content: `Here is a conversation:\n${conversationText}\n\nGenerate the JSON data now.`,
      },
    ];

    let out = "";
    const stream = hf.chatCompletionStream({
      model: "NousResearch/Hermes-3-Llama-3.1-8B",
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        out += chunk.choices[0].delta.content || "";
      }
    }

    console.log("Raw AI output:", out);

    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch {
      parsed = { revisionItems: [{ type: "raw_text", content: out }] };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error in /api/generateRevisionResources:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
