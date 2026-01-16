// FILE: src/lib/collection-utils.js
// DESCRIPTION: Utilities for grouping chats by collection

/**
 * groupByCollection(chats)
 * Groups chats by their collection tag
 * @param {Array} chats - Array of chat objects with collection property
 * @returns {Array} Array of { name, chats } objects, sorted by name with 'Unknown' last
 */
export function groupByCollection(chats = []) {
  const map = new Map();

  chats.forEach((chat) => {
    const collectionName = chat.collection || 'Unknown';
    if (!map.has(collectionName)) {
      map.set(collectionName, []);
    }
    map.get(collectionName).push(chat);
  });

  // Convert to array and sort
  const groups = Array.from(map.entries()).map(([name, chatList]) => ({
    name,
    chats: chatList,
    count: chatList.length,
  }));

  // Sort: user-created collections alphabetically, then 'Unknown' last
  groups.sort((a, b) => {
    if (a.name === 'Unknown') return 1;
    if (b.name === 'Unknown') return -1;
    return a.name.localeCompare(b.name);
  });

  return groups;
}

/**
 * getCollectionNames(chats)
 * Extracts unique collection names from chats
 * @param {Array} chats - Array of chat objects
 * @returns {Array} Sorted array of unique collection names
 */
export function getCollectionNames(chats = []) {
  const names = new Set();
  chats.forEach((chat) => {
    names.add(chat.collection || 'Unknown');
  });

  const arr = Array.from(names);
  // Sort with 'Unknown' last
  arr.sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return a.localeCompare(b);
  });

  return arr;
}
