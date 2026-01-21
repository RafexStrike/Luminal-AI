import { embedText, embedTexts } from '../src/lib/rag/embedder.js';

async function run() {
  try {
    console.log('Running embed tests (no HF key expected)');
    const v = await embedText('This is a test sentence for embedding');
    console.log('embedText length:', Array.isArray(v) ? v.length : typeof v);

    const batch = await embedTexts(['one', 'two', 'three']);
    console.log('embedTexts lengths:', batch.map((b) => (Array.isArray(b) ? b.length : typeof b)));
  } catch (err) {
    console.error('Embed test error:', err);
    process.exit(1);
  }
}

run();
