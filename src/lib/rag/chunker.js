// FILE: src/lib/rag/chunker.js
// DESCRIPTION: Splits long documents into meaningful chunks for embedding
// PURPOSE: Converts flashcards, notes, quiz questions into appropriately-sized text chunks
//          for efficient embedding and retrieval
//
// Strategy:
// - Flashcards: Combine question + answer into single chunk
// - Notes: Split by paragraph or fixed token count
// - Quizzes: Combine question with explanation
// - Preserve context and metadata in chunks

/**
 * Chunk flashcard data for embedding
 *
 * @param {Object} flashcard - { question, answer, tags, difficulty, ... }
 * @returns {Array<Object>} Array of chunks, each with { text, metadata }
 */
export function chunkFlashcard(flashcard) {
  if (!flashcard || !flashcard.question) {
    throw new Error('Flashcard must have at least a "question" field');
  }

  const { question, answer = '', tags = [], difficulty = 'medium' } = flashcard;

  // Combine Q&A into one chunk for flashcards (they're designed to be atomic)
  const text = answer ? `Q: ${question}\nA: ${answer}` : `Q: ${question}`;

  return [
    {
      text,
      metadata: {
        type: 'flashcard',
        tags: tags.join(', '),
        difficulty,
        isQuestion: !answer,
      },
    },
  ];
}

/**
 * Chunk note data for embedding
 *
 * @param {string} noteContent - The full note text
 * @param {number} maxChunkSize - Target characters per chunk (default: 500)
 * @param {Object} metadata - Additional metadata to attach
 *
 * @returns {Array<Object>} Array of chunks
 */
export function chunkNote(noteContent, maxChunkSize = 500, metadata = {}) {
  if (!noteContent || typeof noteContent !== 'string') {
    throw new Error('noteContent must be a non-empty string');
  }

  // Split by paragraphs first (double newline)
  const paragraphs = noteContent.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds max size, save current chunk and start new one
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: { ...metadata, type: 'note' },
      });
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: { ...metadata, type: 'note' },
    });
  }

  return chunks.length > 0 ? chunks : [{ text: noteContent, metadata }];
}

/**
 * Chunk quiz question for embedding
 *
 * @param {Object} question - { question, options, answerIndex, explanation }
 * @returns {Array<Object>} Array of chunks
 */
export function chunkQuizQuestion(question) {
  if (!question || !question.question) {
    throw new Error('Question must have a "question" field');
  }

  const {
    question: questionText,
    options = [],
    answerIndex = null,
    explanation = '',
  } = question;

  // Combine question + correct answer + explanation
  let text = `Q: ${questionText}`;

  if (options.length > 0) {
    text += '\nOptions:\n';
    options.forEach((opt, idx) => {
      const marker = idx === answerIndex ? '✓' : '•';
      text += `${marker} ${opt}\n`;
    });
  }

  if (explanation) {
    text += `\nExplanation: ${explanation}`;
  }

  return [
    {
      text,
      metadata: {
        type: 'quiz',
        hasExplanation: !!explanation,
      },
    },
  ];
}

/**
 * Chunk video transcript for embedding
 * Splits longer transcripts into meaningful segments
 *
 * @param {string} transcript - The full transcript text
 * @param {Object} metadata - Video metadata (title, duration, etc.)
 * @returns {Array<Object>} Array of chunks
 */
export function chunkVideoTranscript(transcript, metadata = {}) {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Transcript must be a non-empty string');
  }

  // Split by sentences or paragraphs, targeting 300-500 chars per chunk
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();

    if (currentChunk.length + trimmed.length > 400 && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: { ...metadata, type: 'video' },
      });
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: { ...metadata, type: 'video' },
    });
  }

  return chunks.length > 0 ? chunks : [{ text: transcript, metadata }];
}

/**
 * Generic chunker for any document type
 * Routes to specific chunker based on document type
 *
 * @param {Object} document - { type, content, metadata }
 * @returns {Array<Object>} Array of chunks
 */
export function chunkDocument(document) {
  if (!document || !document.type || !document.content) {
    throw new Error('Document must have "type" and "content" fields');
  }

  const { type, content, metadata = {} } = document;

  switch (type) {
    case 'flashcard':
      return chunkFlashcard(content);

    case 'note':
      return chunkNote(content, 500, metadata);

    case 'quiz':
      return chunkQuizQuestion(content);

    case 'video':
      return chunkVideoTranscript(content, metadata);

    default:
      // Generic text chunking
      return chunkNote(content, 500, { ...metadata, type });
  }
}

/**
 * Calculate approximate token count (rough estimate)
 * Uses word count * 1.3 as heuristic
 *
 * @param {string} text - Text to count
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
}
