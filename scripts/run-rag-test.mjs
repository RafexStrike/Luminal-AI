import { processWithRAG } from '../src/lib/rag/index.js';
import { RAG_CONTENT_TYPES } from '../src/lib/rag/content-types.js';

async function run(){
  try{
    const res = await processWithRAG({
      userId: '69609228c529a11c428ed508',
      prompt: 'Explain spaced repetition',
      ragConfig: { sources: RAG_CONTENT_TYPES, topK:5, threshold: 0.3 }
    });

    console.log('processWithRAG result:', res);
  }catch(err){
    console.error('processWithRAG error:', err);
  }
}

run();
