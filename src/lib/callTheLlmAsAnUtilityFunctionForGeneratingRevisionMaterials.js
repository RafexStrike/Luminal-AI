// src/lib/callTheLlmAsAnUtilityFunctionForGeneratingRevisionMaterials.js

import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

/**
 * Ask the LLM to generate exactly 10 flashcards and exactly 10 MCQs from conversationText.
 * The LLM MUST return a single valid JSON object and NOTHING ELSE.
 *
 * Expected schema (strict):
 * {
 *   "revisionItems": [
 *     { "type": "flashcard", "question": "string", "answer": "string" },        // exactly 10 of these
 *     ...
 *     { "type": "mcq", "question": "string", "options": ["A","B","C","D"], "correctOptionIndex": 0, "correctAnswer": "A" } // exactly 10 of these
 *   ]
 * }
 */
export async function askLUMINAL(conversationText) {
  try {
    if (!conversationText) {
      throw new Error("Conversation text is required.");
    }

    const messages = [
      {
        role: "system",
        content: `You are a strict JSON-outputting assistant whose only job is to convert the given conversation into study materials.

INSTRUCTIONS (follow EXACTLY):
1) Produce a SINGLE valid JSON object and NOTHING ELSE. Do not include any explanatory text, markers, backticks, or markdown — only the JSON.
2) The JSON must follow this exact structure:
{
  "revisionItems": [
    // first 10 items MUST be flashcards:
    { "type": "flashcard", "question": "string", "answer": "string" },
    ... (10 flashcards total)
    // then 10 items MUST be mcqs:
    { "type": "mcq", "question": "string", "options": ["string","string","string","string"], "correctOptionIndex": 0, "correctAnswer": "string" },
    ... (10 mcqs total)
  ]
}
3) TOTAL items: exactly 20 (10 flashcard objects then 10 mcq objects). No more, no less.
4) Each MCQ MUST have exactly 4 options. correctOptionIndex must be an integer in [0,3]. correctAnswer must exactly equal options[correctOptionIndex].
5) Use only information present in the conversationText. Do NOT hallucinate facts. If the conversation lacks the necessary info for a particular question or answer, set the value to the string: "insufficient_information".
6) Keep each question and each answer concise (ideally under ~30 words).
7) Do not include nulls or extra fields. Do not include IDs, timestamps, or metadata.
8) If you understand, produce the JSON directly following these rules.

IMPORTANT: The conversation will be provided after this system instruction. Generate the requested 10 flashcards and 10 MCQs strictly following the schema above.`
      },
      {
        role: "user",
        content: `Here is the conversation (use ONLY this content to create the materials):\n\n${conversationText}\n\nNow output the single JSON object as specified.`
      }
    ];

    let out = "";
// NousResearch/Hermes-3-Llama-3.1-8B
// deepseek-ai/DeepSeek-V3.2-Exp
    const stream = hf.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        out += chunk.choices[0].delta.content || "";
      }
    }

    console.log("Raw LLM output (first 1000 chars):", out.slice(0, 1000));

    // --- Simplified, clean JSON parsing ---
    let parsed;
    try {
      // handle if model outputs extra text before/after JSON
      const jsonStart = out.indexOf("{");
      const jsonEnd = out.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsed = JSON.parse(out.slice(jsonStart, jsonEnd + 1));
      } else {
        throw new Error("No valid JSON object found in output");
      }
    } catch (err) {
      console.error("Failed to parse LLM JSON:", err);
      parsed = {
        revisionItems: [
          { type: "raw_text", content: out.slice(0, 2000) } // fallback
        ]
      };
    }

    // Defensive check: ensure revisionItems is an array
    if (!parsed || !Array.isArray(parsed.revisionItems)) {
      if (Array.isArray(parsed)) {
        parsed = { revisionItems: parsed };
      } else {
        parsed = { revisionItems: [] };
      }
    }

    return parsed;
  } catch (err) {
    console.error("Error in askLUMINAL:", err);
    return { error: err.message };
  }
}
