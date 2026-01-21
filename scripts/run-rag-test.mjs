import { processWithRAG } from '../src/lib/rag/index.js';

async function run(){
  try{
    const res = await processWithRAG({
      userId: '69609228c529a11c428ed508',
      prompt: 'Explain spaced repetition',
      ragConfig: { sources: ['flashcard'], topK:5, threshold: 0.3 }
    });

    console.log('processWithRAG result:', res);
  }catch(err){
    console.error('processWithRAG error:', err);
  }
}

run();
