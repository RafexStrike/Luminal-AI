// FILE: src/__tests__/collection-utils.test.js
// DESCRIPTION: Unit tests for collection utility functions

import { groupByCollection, getCollectionNames } from '../lib/collection-utils';

describe('collection-utils', () => {
  describe('groupByCollection', () => {
    it('should group chats by collection', () => {
      const chats = [
        { _id: '1', title: 'Chat 1', collection: 'Physics' },
        { _id: '2', title: 'Chat 2', collection: 'Physics' },
        { _id: '3', title: 'Chat 3', collection: 'Chemistry' },
        { _id: '4', title: 'Chat 4', collection: 'Unknown' },
      ];

      const result = groupByCollection(chats);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Chemistry');
      expect(result[0].count).toBe(1);
      expect(result[1].name).toBe('Physics');
      expect(result[1].count).toBe(2);
      expect(result[2].name).toBe('Unknown');
      expect(result[2].count).toBe(1);
    });

    it('should handle empty array', () => {
      const result = groupByCollection([]);
      expect(result).toEqual([]);
    });

    it('should default to "Unknown" for missing collection field', () => {
      const chats = [
        { _id: '1', title: 'Chat 1' },
        { _id: '2', title: 'Chat 2', collection: 'Physics' },
      ];

      const result = groupByCollection(chats);

      expect(result).toHaveLength(2);
      const unknown = result.find((g) => g.name === 'Unknown');
      expect(unknown).toBeDefined();
      expect(unknown.count).toBe(1);
    });

    it('should place "Unknown" collection last', () => {
      const chats = [
        { _id: '1', title: 'Chat 1', collection: 'Unknown' },
        { _id: '2', title: 'Chat 2', collection: 'Physics' },
        { _id: '3', title: 'Chat 3', collection: 'Chemistry' },
      ];

      const result = groupByCollection(chats);

      expect(result[result.length - 1].name).toBe('Unknown');
    });

    it('should sort collections alphabetically (except Unknown)', () => {
      const chats = [
        { _id: '1', title: 'Chat 1', collection: 'Zebra' },
        { _id: '2', title: 'Chat 2', collection: 'Alpha' },
        { _id: '3', title: 'Chat 3', collection: 'Beta' },
      ];

      const result = groupByCollection(chats);

      expect(result[0].name).toBe('Alpha');
      expect(result[1].name).toBe('Beta');
      expect(result[2].name).toBe('Zebra');
    });
  });

  describe('getCollectionNames', () => {
    it('should extract unique collection names', () => {
      const chats = [
        { _id: '1', collection: 'Physics' },
        { _id: '2', collection: 'Chemistry' },
        { _id: '3', collection: 'Physics' },
      ];

      const result = getCollectionNames(chats);

      expect(result).toHaveLength(2);
      expect(result).toContain('Physics');
      expect(result).toContain('Chemistry');
    });

    it('should place "Unknown" last in sorted list', () => {
      const chats = [
        { _id: '1', collection: 'Physics' },
        { _id: '2', collection: 'Unknown' },
        { _id: '3', collection: 'Chemistry' },
      ];

      const result = getCollectionNames(chats);

      expect(result[result.length - 1]).toBe('Unknown');
    });

    it('should handle empty array', () => {
      const result = getCollectionNames([]);
      expect(result).toEqual([]);
    });
  });
});
