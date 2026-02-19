// FILE: src/lib/generateIncrementalSummary/jsonMerger.js
// DESCRIPTION: Merges multiple JSON objects into a single coherent structure using HuggingFace

import { InferenceClient } from '@huggingface/inference';

export async function jsonMerger(arrayOfJsons) {
  console.log('===jsonMerger.js function HIT');

  try {
    console.log('creating a inference client');
    const hf = new InferenceClient(process.env.HF_TOKEN);

    const llmMessages = [
      {
        role: 'system',
        content: `You are an intelligent JSON merger. 
Your goal is to take all the JSONs from the array and merge them.

Follow these rules strictly:

1. Identify the core ideas, main topics, and key details from the text.
2. Merge them into a clear single JSON structure.`,
      },
      {
        role: 'user',
        content: JSON.stringify(arrayOfJsons, null, 2),
      },
    ];

    console.log('Starting the api call to huggingface from jsonMerger.js');

    let output = '';

    const stream = hf.chatCompletionStream({
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: llmMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('Stream created in jsonMerger.js, processing chunks...');

    for await (const chunk of stream) {
      if (chunk.choices?.length) {
        const content = chunk.choices[0].delta.content || '';
        output += content;
      }
    }

    console.log('Stream completed in jsonMerger.js. Output length:', output.length);

    if (!output || output.trim().length === 0) {
      console.log('ERROR from jsonMerger.js: Empty output from model');
      throw new Error('Model returned empty response');
    }

    console.log('Sending response from jsonMerger.js');
    return output;
  } catch (error) {
    console.error('Error in jsonMerger.js:', error);
    throw error;
  }
}
