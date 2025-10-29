import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let out = "";
    const stream = hf.chatCompletionStream({
      model: "NousResearch/Hermes-3-Llama-3.1-8B",
      messages: [{ role: "user", content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        out += chunk.choices[0].delta.content || "";
      }
    }

    return NextResponse.json({ reply: out });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to get AI response", details: err.message },
      { status: 500 }
    );
  }
}
