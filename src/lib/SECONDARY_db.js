// FILE: src/lib/SECONDARY_db.js
// DESCRIPTION: MongoDB database abstraction for stage-2 (chats, summaries, flashcards, notes)

import { MongoClient } from 'mongodb';

/**
 * Database Abstraction for Stage-2 Feature
 * 
 * Environment Variable:
 *   process.env.SECONDARY_MONGODB_URI
 *   Example: "mongodb+srv://user:pass@cluster.mongodb.net/stage2_db?retryWrites=true&w=majority"
 * 
 * Collections:
 *   - stage2_chats: { _id, userId, title, messages: [], createdAt, updatedAt }
 *   - stage2_summaries: { _id, userId, chatId, messageIds, content, type (normal/incremental), createdAt }
 *   - stage2_flashcards: { _id, userId, chatId, messageIds, cards: [{q, a, difficulty, tags}], createdAt }
 *   - stage2_quizzes: { _id, userId, chatId, messageIds, questions: [{question, options, answerIndex, explanation}], createdAt }
 *   - stage2_notes: { _id, userId, content, createdAt, updatedAt }
 */

let mongoClient = null;

async function getMongoClient() {
  // TODO: Replace with real connection string from env
  const uri = process.env.SECONDARY_MONGODB_URI;
  
  if (!uri) {
    throw new Error('SECONDARY_MONGODB_URI environment variable not set');
  }

  if (mongoClient && mongoClient.topology?.isConnected()) {
    return mongoClient;
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  return mongoClient;
}

/**
 * saveChat({ userId, title, messages })
 * Creates or updates a chat session
 * Returns: { _id, ...document }
 */
export async function saveChat({ userId, title, messages = [] }) {
  if (!userId) throw new Error('userId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_chats');

  const doc = {
    userId,
    title: title || 'Untitled Chat',
    messages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * getChat({ userId, chatId })
 * Retrieves a chat session by ID
 * Returns: { _id, userId, title, messages, createdAt, updatedAt } or null
 */
export async function getChat({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_chats');

  const { ObjectId } = await import('mongodb');
  const result = await collection.findOne({
    _id: new ObjectId(chatId),
    userId,
  });

  return result || null;
}

/**
 * updateChatMessages({ userId, chatId, messages })
 * Appends or replaces messages in a chat
 */
export async function updateChatMessages({ userId, chatId, messages }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_chats');

  const { ObjectId } = await import('mongodb');
  await collection.updateOne(
    { _id: new ObjectId(chatId), userId },
    {
      $set: {
        messages,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * saveSummary({ userId, chatId, messageIds, content, type })
 * Saves a generated summary (normal or incremental)
 * Returns: { _id, ...document }
 */
export async function saveSummary({ userId, chatId, messageIds = [], content, type = 'normal' }) {
  if (!userId || !chatId || !content) throw new Error('userId, chatId, content required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_summaries');

  const doc = {
    userId,
    chatId,
    messageIds,
    content,
    type,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * getSummaries({ userId, chatId })
 * Retrieves all summaries for a chat
 * Returns: array of summary documents
 */
export async function getSummaries({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_summaries');

  const results = await collection
    .find({ userId, chatId })
    .sort({ createdAt: -1 })
    .toArray();

  return results;
}

/**
 * saveFlashcards({ userId, chatId, messageIds, cards })
 * Saves generated flashcards
 * cards: array of { q, a, difficulty, tags }
 * Returns: { _id, ...document }
 */
export async function saveFlashcards({ userId, chatId, messageIds = [], cards = [] }) {
  if (!userId || !chatId || !cards) throw new Error('userId, chatId, cards required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_flashcards');

  const doc = {
    userId,
    chatId,
    messageIds,
    cards,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * getFlashcards({ userId, chatId })
 * Retrieves flashcard sets for a chat
 * Returns: array of flashcard documents
 */
export async function getFlashcards({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_flashcards');

  const results = await collection
    .find({ userId, chatId })
    .sort({ createdAt: -1 })
    .toArray();

  return results;
}

/**
 * saveQuizzes({ userId, chatId, messageIds, questions })
 * Saves generated quiz questions
 * questions: array of { question, options: [], answerIndex, explanation }
 */
export async function saveQuizzes({ userId, chatId, messageIds = [], questions = [] }) {
  if (!userId || !chatId || !questions) throw new Error('userId, chatId, questions required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_quizzes');

  const doc = {
    userId,
    chatId,
    messageIds,
    questions,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * getQuizzes({ userId, chatId })
 * Retrieves quiz sets for a chat
 * Returns: array of quiz documents
 */
export async function getQuizzes({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_quizzes');

  const results = await collection
    .find({ userId, chatId })
    .sort({ createdAt: -1 })
    .toArray();

  return results;
}

/**
 * saveNotes({ userId, content, chatId })
 * Saves or updates user notes (global or per-chat if chatId provided)
 */
export async function saveNotes({ userId, content, chatId = null }) {
  if (!userId || !content) throw new Error('userId and content required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_notes');

  // Build query filter - use chatId if provided, otherwise update global notes
  const filter = chatId 
    ? { userId, chatId }
    : { userId, chatId: null };

  const result = await collection.updateOne(
    filter,
    {
      $set: {
        content,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        userId,
        chatId: chatId || null,
      },
    },
    { upsert: true }
  );

  return result;
}

/**
 * getNotes({ userId, chatId })
 * Retrieves user notes (global if no chatId, or per-chat if chatId provided)
 */
export async function getNotes({ userId, chatId = null }) {
  if (!userId) throw new Error('userId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_notes');

  // Build query filter - use chatId if provided, otherwise get global notes
  const filter = chatId 
    ? { userId, chatId }
    : { userId, chatId: null };

  const result = await collection.findOne(filter);
  return result || { userId, content: '', createdAt: new Date(), updatedAt: new Date() };
}

/**
 * ============================================
 * MESSAGE-LEVEL STORAGE FUNCTIONS
 * ============================================
 * 
 * Store messages individually for flexibility and querying
 * Collection: stage2_messages
 * Schema: { _id, chatId, userId, role, content, createdAt, sequenceNumber }
 */

/**
 * saveMessage({ userId, chatId, role, content })
 * Saves a single message to the database
 * Returns: { _id, ...document }
 */
export async function saveMessage({ userId, chatId, role, content }) {
  if (!userId || !chatId || !role || !content) {
    throw new Error('userId, chatId, role, and content are required');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_messages');

  // Get sequence number for this chat (for ordering)
  const lastMessage = await collection
    .findOne(
      { chatId, userId },
      { sort: { sequenceNumber: -1 }, projection: { sequenceNumber: 1 } }
    );

  const sequenceNumber = (lastMessage?.sequenceNumber || 0) + 1;

  const doc = {
    userId,
    chatId,
    role, // 'system' | 'user' | 'assistant'
    content,
    sequenceNumber,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * getMessageHistory({ userId, chatId })
 * Retrieves all messages for a chat, ordered by sequence
 * Used to build the full context for the LLM
 * Returns: array of message documents
 */
export async function getMessageHistory({ userId, chatId }) {
  if (!userId || !chatId) throw new Error('userId and chatId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_messages');

  const messages = await collection
    .find({ userId, chatId })
    .sort({ sequenceNumber: 1 })
    .toArray();

  return messages;
}

/**
 * createNewChat({ userId, title })
 * Creates a new chat session with a system message
 * Returns: { chatId, title, createdAt }
 */
export async function createNewChat({ userId, title = null }) {
  if (!userId) throw new Error('userId required');

  const client = await getMongoClient();
  const db = client.db();
  const chatsCollection = db.collection('stage2_chats');
  const messagesCollection = db.collection('stage2_messages');

  // Generate a unique chatId (using MongoDB ObjectId as string)
  const { ObjectId } = await import('mongodb');
  const chatId = new ObjectId().toString();

  // Create chat document
  const chatDoc = {
    _id: chatId,
    userId,
    title: title || 'New Chat',
    messageCount: 0, // Track message count for efficiency
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await chatsCollection.insertOne(chatDoc);

  // Initialize with system message
  const systemMessage = {
    userId,
    chatId,
    role: 'system',
    content: 'You are a helpful tutor. Explain concepts clearly and provide examples when helpful.',
    sequenceNumber: 0,
    createdAt: new Date(),
  };

  await messagesCollection.insertOne(systemMessage);

  return { chatId, title: chatDoc.title, createdAt: chatDoc.createdAt };
}

/**
 * updateChatTitle({ userId, chatId, title })
 * Updates the title of a chat (e.g., after generating from first user message)
 */
export async function updateChatTitle({ userId, chatId, title }) {
  if (!userId || !chatId || !title) {
    throw new Error('userId, chatId, and title are required');
  }

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_chats');

  const { ObjectId } = await import('mongodb');
  await collection.updateOne(
    { _id: chatId, userId },
    {
      $set: {
        title,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * getChatList({ userId })
 * Retrieves all chat sessions for a user (for sidebar)
 * Returns: array of { _id, title, createdAt, updatedAt, messageCount }
 */
export async function getChatList({ userId }) {
  if (!userId) throw new Error('userId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_chats');

  // const chats = await collection
  //   .find({ userId })
  //   .sort({ updatedAt: -1 })
  //   .projection({ title: 1, createdAt: 1, updatedAt: 1, messageCount: 1 })
  //   .toArray();

  const chats = await collection
  .find(
    { userId },
    {
      projection: {
        title: 1,
        createdAt: 1,
        updatedAt: 1,
        messageCount: 1,
      },
    }
  )
  .sort({ updatedAt: -1 })
  .toArray();

  
  return chats;
}

/**
 * generateChatTitle(userMessage)
 * Generates a title from the first 5-7 words of the user's first message
 * Helper utility for chat title generation
 */
export function generateChatTitle(userMessage) {
  const words = userMessage.trim().split(/\s+/).slice(0, 7).join(' ');
  return words || 'New Chat';
}
