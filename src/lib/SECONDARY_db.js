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
 * saveNotes({ userId, content })
 * Saves or updates user notes
 */
export async function saveNotes({ userId, content }) {
  if (!userId || !content) throw new Error('userId and content required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_notes');

  const result = await collection.updateOne(
    { userId },
    {
      $set: {
        content,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return result;
}

/**
 * getNotes({ userId })
 * Retrieves user notes
 */
export async function getNotes({ userId }) {
  if (!userId) throw new Error('userId required');

  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection('stage2_notes');

  const result = await collection.findOne({ userId });
  return result || { userId, content: '', createdAt: new Date(), updatedAt: new Date() };
}
