// FILE: src/lib/rag/embedder.js
// DESCRIPTION: HuggingFace embedding client with local fallback
// PURPOSE: Converts text queries and documents into vector embeddings
//
// Strategy: Try HuggingFace API first, fall back to local TF-IDF if API fails

/**
 * Generate a simple but effective local embedding using TF-IDF
 * This is used as fallback when the API is unavailable
 */
function generateLocalEmbedding(text) {
  // Create a consistent 384-dimensional vector (matching HF embedding size)
  const vector = new Array(384).fill(0);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];

  if (words.length === 0) {
    return vector;
  }

  // Hash each word and distribute across vector space
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;

    // Simple hash function
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Distribute hash across multiple positions
    const idx1 = Math.abs(hash) % 384;
    const idx2 = Math.abs(hash * 31) % 384;
    const idx3 = Math.abs(hash * 97) % 384;

    vector[idx1] += 1;
    vector[idx2] += 0.5;
    vector[idx3] += 0.25;
  }

  // Normalize the vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map((v) => v / magnitude);
  }

  return vector;
}

/**
 * Attempt to embed using HuggingFace API with retries
 */
async function attemptEmbedWithAPI(text, model, apiKey, retries = 2, timeout = 15000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[Embedder] API Attempt ${attempt + 1}/${retries}`);

      // Use the official InferenceClient which handles router/provider logic
      const { InferenceClient } = await import('@huggingface/inference');
      const client = new InferenceClient(apiKey);

      // Set a timer in case the client call hangs
      let timer;
      const callPromise = client.featureExtraction({
        model,
        inputs: text,
        provider: 'auto',
      });

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Embedder API timeout')), timeout);
      });

      const data = await Promise.race([callPromise, timeoutPromise]);
      clearTimeout(timer);

      // The client.featureExtraction returns an array of numbers for a single input
      const embedding = Array.isArray(data) ? data : data?.[0];

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding response from InferenceClient');
      }

      console.log(`[Embedder] API Success on attempt ${attempt + 1}`);
      return { embedding, source: 'api' };
    } catch (error) {
      // Attempt to surface provider errors if available
      let msg = error?.message || String(error);
      try {
        if (error?.httpResponse) {
          const status = error.httpResponse.status || error.httpResponse?.statusCode || 'unknown';
          const body = error.httpResponse.data || error.httpResponse.body || error.httpResponse;
          msg = `HTTP ${status} - ${JSON.stringify(body).slice(0, 200)}`;
        }
      } catch (e) {
        // ignore
      }

      console.warn(`[Embedder] API attempt ${attempt + 1} failed:`, msg);

      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  return null; // API failed
}

/**
 * Embed a single text string
 * First tries HuggingFace API, falls back to local embedding if API unavailable
 */
export async function embedText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.warn('[Embedder] No HuggingFace API key, using local embedding');
  }

  const model = 'sentence-transformers/all-MiniLM-L6-v2';

  // Try API first if key is available
  if (apiKey) {
    try {
      const result = await attemptEmbedWithAPI(text, model, apiKey, 2, 15000);
      if (result) {
        return result.embedding;
      }
    } catch (error) {
      console.warn('[Embedder] API failed:', error.message);
    }
  }

  // Fall back to local embedding
  console.log('[Embedder] Using local embedding as fallback');
  return generateLocalEmbedding(text);
}

/**
 * Embed multiple texts in batch
 */
export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;

  // Try API first
  if (apiKey) {
    try {
      console.log('[Embedder] Batch embedding via InferenceClient');
      const { InferenceClient } = await import('@huggingface/inference');
      const client = new InferenceClient(apiKey);

      const timeoutMs = 15000;
      let timer;
      const callPromise = client.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: texts,
        provider: 'auto',
      });

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Batch embedder timeout')), timeoutMs);
      });

      const data = await Promise.race([callPromise, timeoutPromise]);
      clearTimeout(timer);

      // Expect an array of embeddings
      if (Array.isArray(data) && data.length > 0) {
        console.log('[Embedder] Batch embedding via API successful');
        return data;
      }
    } catch (error) {
      let msg = error?.message || String(error);
      try {
        if (error?.httpResponse) {
          const status = error.httpResponse.status || error.httpResponse?.statusCode || 'unknown';
          const body = error.httpResponse.data || error.httpResponse.body || error.httpResponse;
          msg = `HTTP ${status} - ${JSON.stringify(body).slice(0,200)}`;
        }
      } catch (e) {}
      console.warn('[Embedder] Batch API failed:', msg);
    }
  }

  // Fall back to local embedding for each text
  console.log('[Embedder] Using local embeddings for batch as fallback');
  return texts.map((text) => generateLocalEmbedding(text));
}
