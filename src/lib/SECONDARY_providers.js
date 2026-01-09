// FILE: src/lib/SECONDARY_providers.js
// DESCRIPTION: Provider-agnostic LLM adapter skeleton for OpenAI, HuggingFace, Groq

/**
 * Main adapter function to call any LLM provider.
 * Accepts provider name, API key, messages array, and streaming flag.
 * Returns streaming response or full JSON response.
 * 
 * Flow:
 *   - route handler calls callProvider({ provider, apiKey, messages, stream, systemPrompt })
 *   - this function routes to the appropriate provider adapter
 *   - provider adapter makes HTTP request and returns Response (stream) or JSON
 */

export async function callProvider({ provider, apiKey, messages, stream = false, systemPrompt = '' }) {
  // TODO: Validate provider and apiKey before making requests
  
  switch (provider) {
    case 'openai':
      return await callOpenAI({ apiKey, messages, stream, systemPrompt });
    case 'huggingface':
      return await callHuggingFace({ apiKey, messages, stream, systemPrompt });
    case 'groq':
      return await callGroq({ apiKey, messages, stream, systemPrompt });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * OpenAI adapter
 * Requires: apiKey from environment variable
 * Endpoint: https://api.openai.com/v1/chat/completions
 */
async function callOpenAI({ apiKey, messages, stream, systemPrompt }) {
  // TODO: Insert real OpenAI API key from env
  const apiKeyToUse = apiKey || process.env.OPENAI_API_KEY;
  if (!apiKeyToUse) throw new Error('OpenAI API key not provided');

  const payload = {
    model: 'gpt-4', // TODO: make configurable
    messages: [
      { role: 'system', content: systemPrompt || 'You are a helpful tutor.' },
      ...messages
    ],
    stream: stream,
    temperature: 0.7,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeyToUse}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  if (stream) {
    // Return streaming response (ReadableStream)
    return response;
  } else {
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * HuggingFace adapter
 * Requires: apiKey from environment variable
 * Endpoint: https://api-inference.huggingface.co/models/{model}/v1/chat/completions
 */
async function callHuggingFace({ apiKey, messages, stream, systemPrompt }) {
  // TODO: Insert real HuggingFace API key from env
  const apiKeyToUse = apiKey || process.env.HUGGINGFACE_API_KEY;
  if (!apiKeyToUse) throw new Error('HuggingFace API key not provided');

  const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-2-7b-chat-hf';
  const payload = {
    messages: [
      { role: 'system', content: systemPrompt || 'You are a helpful tutor.' },
      ...messages
    ],
    stream: stream,
  };

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
  }

  if (stream) {
    return response;
  } else {
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * Groq adapter
 * Requires: apiKey from environment variable
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */
async function callGroq({ apiKey, messages, stream, systemPrompt }) {
  // TODO: Insert real Groq API key from env
  const apiKeyToUse = apiKey || process.env.GROQ_API_KEY;
  if (!apiKeyToUse) throw new Error('Groq API key not provided');

  const payload = {
    model: 'mixtral-8x7b-32768', // TODO: make configurable
    messages: [
      { role: 'system', content: systemPrompt || 'You are a helpful tutor.' },
      ...messages
    ],
    stream: stream,
    temperature: 0.7,
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKeyToUse}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  if (stream) {
    return response;
  } else {
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

/**
 * Helper: chunk a string into streaming chunks (for providers that don't support native streaming)
 * Simulates streaming by splitting content and yielding chunks with delays
 */
export async function* simulateStreamChunks(content, chunkSize = 10) {
  for (let i = 0; i < content.length; i += chunkSize) {
    yield content.slice(i, i + chunkSize);
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Helper: parse streaming SSE response from OpenAI/Groq
 * Yields text chunks as they arrive
 */
export async function* parseStreamSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) yield content;
          } catch (e) {
            // Silently skip unparseable lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
