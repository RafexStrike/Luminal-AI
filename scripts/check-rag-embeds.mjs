import { listEmbeddings, retrieveSimilar } from '../src/lib/rag/vectorStore.js';
import { embedText } from '../src/lib/rag/embedder.js';
import { RAG_CONTENT_TYPES } from '../src/lib/rag/content-types.js';

const testUser = process.env.TEST_USER_ID || '69609228c529a11c428ed508';
const query = process.env.TEST_QUERY || 'Explain spaced repetition';

async function run() {
  try {
    console.log('Listing embeddings for user:', testUser);
    const embeds = await listEmbeddings({ userId: testUser, limit: 20 });
    console.log(`Found ${embeds.length} stored embeddings (metadata and counts):`);
    console.log(embeds.slice(0,5));

    const qEmb = await embedText(query);
    console.log('Query embedding length:', Array.isArray(qEmb) ? qEmb.length : typeof qEmb);

    const results = await retrieveSimilar({
      userId: testUser,
      queryEmbedding: qEmb,
      sourceTypes: RAG_CONTENT_TYPES,
      topK: 5,
      threshold: 0.0,
    });

    console.log('RetrieveSimilar returned', results.length, 'documents:');
    results.slice(0,5).forEach((r, i) => {
      console.log(i+1, r.sourceType, 'similarity:', r.similarity.toFixed(4), 'text:', r.text?.slice(0,120));
    });

  } catch (err) {
    console.error('Error checking embeddings:', err);
  }
}

run();
