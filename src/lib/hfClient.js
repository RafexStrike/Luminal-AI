// src/lib/hfClient.js
import { InferenceClient } from '@huggingface/inference';

let client;

/**
 * Returns a singleton InferenceClient configured with HF_TOKEN.
 * Must be used only on the server.
 */
export function getHfClient() {
  if (!client) {
    if (!process.env.HF_TOKEN) {
      throw new Error('HF_TOKEN not set in environment');
    }
    client = new InferenceClient(process.env.HF_TOKEN);
  }
  return client;
}
