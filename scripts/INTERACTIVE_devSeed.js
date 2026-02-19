// FILE: scripts/INTERACTIVE_devSeed.js
// DESCRIPTION: Seeds a demo interactive spec for local development frontend testing
// RESPONSIBILITY: Print a sample spec to console. Nothing else.
//
// Usage:
//   node scripts/INTERACTIVE_devSeed.js

const SAMPLE_SPEC = {
    type: 'interactive_explainer',
    version: '1.0',
    title: 'How RAG Works',
    summary: 'A step-through pipeline showing how Retrieval-Augmented Generation works.',
    steps: [
        {
            id: 'embed',
            label: 'Embed Query',
            description: 'The user query is converted to a dense vector using an embedding model.',
            visual_state: 'idle',
        },
        {
            id: 'retrieve',
            label: 'Retrieve Chunks',
            description: 'Top-K nearest neighbour chunks are fetched from the vector store.',
            visual_state: 'idle',
        },
        {
            id: 'augment',
            label: 'Augment Prompt',
            description: 'Retrieved chunks are injected into the LLM prompt as context.',
            visual_state: 'idle',
        },
        {
            id: 'generate',
            label: 'Generate Answer',
            description: 'The LLM generates a grounded answer using the augmented prompt.',
            visual_state: 'idle',
        },
    ],
    knowledge_base: [
        { id: 'k1', text: 'RAG stands for Retrieval-Augmented Generation.' },
        { id: 'k2', text: 'Embeddings map text into a high-dimensional vector space.' },
        { id: 'k3', text: 'Vector stores enable approximate nearest-neighbour search.' },
    ],
    controls: {
        showNext: true,
        autoplay: false,
    },
    assets: {},
};

console.log('INTERACTIVE: seeded sample spec');
console.log(JSON.stringify(SAMPLE_SPEC, null, 2));
