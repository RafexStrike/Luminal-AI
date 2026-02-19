// FILE: src/lib/generateIncrementalSummary/jsonToTextConverter.js
// DESCRIPTION: Converts merged JSON structure back to readable plain text using HuggingFace

import { InferenceClient } from '@huggingface/inference';

export async function jsonToText(mergedJson) {
  console.log('=== jsonToTextConverter.js function HIT ===');

  try {
    console.log('creating a inference client');
    const hf = new InferenceClient(process.env.HF_TOKEN);

    const llmMessages = [
      {
        role: 'system',
        content: `You are an intelligent JSON-to-text converter.
Your goal is to take a structured JSON object and convert it into clear, concise, and readable plain text.

Follow these rules strictly:

1. Extract all the important information from the JSON.
2. Organize it into a well-structured, flowing paragraph or bullet points as appropriate.
3. Ensure the text is coherent and easy to understand.
4. Do not include any JSON formatting or code in the output.`,
      },
      {
        role: 'user',
        content: `Please convert this JSON into clear plain text:\n\n${mergedJson}`,
      },
    ];

    console.log('Starting the api call to huggingface from jsonToTextConverter.js');

    let output = '';

    const stream = hf.chatCompletionStream({
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: llmMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('Stream created in jsonToTextConverter.js, processing chunks...');

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        const content = chunk.choices[0].delta.content || '';
        output += content;
      }
    }

    console.log('Stream completed in jsonToTextConverter.js. Output length:', output.length);

    if (!output || output.trim().length === 0) {
      console.log('ERROR from jsonToTextConverter.js: Empty output from model');
      throw new Error('Model returned empty response');
    }

    console.log('Sending response from jsonToTextConverter.js');
    return output;
  } catch (error) {
    console.error('Error in jsonToTextConverter.js:', error);
    throw error;
  }
}
