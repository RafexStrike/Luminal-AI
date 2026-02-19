// FILE: src/lib/generateIncrementalSummary/textToJsonConverter.js
// DESCRIPTION: Converts plain text to JSON structure using HuggingFace

import { InferenceClient } from '@huggingface/inference';

export async function textToJson(text) {
  console.log('=== textToJsonConverter.js function HIT ===');

  try {
    console.log('creating a inference client');
    const hf = new InferenceClient(process.env.HF_TOKEN);

    const llmMessages = [
      {
        role: 'system',
        content: `You are an intelligent text-to-JSON converter. 
Your goal is to read a given text and extract only its most important information, ignoring filler or redundant parts.

Your output must always be a valid, well-formatted JSON object. 
Do not include explanations, reasoning steps, or any text outside the JSON.

Follow these rules strictly:

1. Identify the core ideas, main topics, and key details from the text.
2. Organize them in a clear JSON structure.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    console.log('Starting the api call to huggingface from textToJsonConverter.js');

    let output = '';

    const stream = hf.chatCompletionStream({
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: llmMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('Stream created in textToJsonConverter.js, processing chunks...');

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        const content = chunk.choices[0].delta.content || '';
        output += content;
      }
    }

    console.log('Stream completed in textToJsonConverter.js. Output length:', output.length);

    if (!output || output.trim().length === 0) {
      console.log('ERROR from textToJsonConverter.js: Empty output from model');
      throw new Error('Model returned empty response');
    }

    console.log('Sending response from textToJsonConverter.js');
    return output;
  } catch (error) {
    console.error('Error in textToJsonConverter.js:', error);
    throw error;
  }
}
