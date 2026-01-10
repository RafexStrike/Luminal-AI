/**
 * Tests for SECONDARY_providers.js
 * HuggingFace Inference API integration
 */

import { callProvider } from '../../../src/lib/SECONDARY_providers';

jest.mock('@huggingface/inference');

describe('SECONDARY_providers - HuggingFace Integration', () => {
  let mockInferenceClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the InferenceClient
    const { InferenceClient } = require('@huggingface/inference');
    mockInferenceClient = {
      chatCompletionStream: jest.fn(),
      chatCompletion: jest.fn(),
    };
    InferenceClient.mockImplementation(() => mockInferenceClient);
  });

  describe('Non-streaming mode', () => {
    it('should call HuggingFace API with messages', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
      };

      mockInferenceClient.chatCompletion.mockResolvedValueOnce(mockResponse);

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'What is photosynthesis?' },
        ],
        stream: false,
      });

      expect(result).toBe('Test response');
      expect(mockInferenceClient.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'NousResearch/Hermes-3-Llama-3.1-8B',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'What is photosynthesis?' }),
          ]),
        })
      );
    });

    it('should include system prompt in messages', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
        systemPrompt: 'You are a biology expert',
        stream: false,
      });

      expect(mockInferenceClient.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are a biology expert',
            }),
          ]),
        })
      );
    });

    it('should handle empty messages array', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Hello, how can I help?' } }],
      });

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [],
        stream: false,
      });

      expect(result).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      mockInferenceClient.chatCompletion.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      await expect(
        callProvider({
          provider: 'huggingface',
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        })
      ).rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('Streaming mode', () => {
    it('should return streaming iterator', async () => {
      // Create mock async iterator
      const mockIterator = (async function* () {
        yield 'This is ';
        yield 'a streamed ';
        yield 'response';
      })();

      mockInferenceClient.chatCompletionStream.mockReturnValueOnce(mockIterator);

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Tell me a story' }],
        stream: true,
      });

      expect(result).toEqual(
        expect.objectContaining({
          stream: true,
          iterator: expect.anything(),
        })
      );
    });

    it('should handle streaming API calls', async () => {
      const mockIterator = (async function* () {
        yield { token: { text: 'Hello ' } };
        yield { token: { text: 'world' } };
      })();

      mockInferenceClient.chatCompletionStream.mockReturnValueOnce(mockIterator);

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Greet me' }],
        stream: true,
      });

      expect(result.stream).toBe(true);
      expect(result.iterator).toBeDefined();
    });

    it('should handle streaming errors', async () => {
      const mockIterator = (async function* () {
        throw new Error('Stream interrupted');
      })();

      mockInferenceClient.chatCompletionStream.mockReturnValueOnce(mockIterator);

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true,
      });

      // Iterator should be returned even if it will error
      expect(result.stream).toBe(true);
    });
  });

  describe('Message handling', () => {
    it('should preserve message order', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      const messages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Reply' },
        { role: 'user', content: 'Follow-up' },
      ];

      await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages,
        stream: false,
      });

      // Verify messages sent in same order
      const callArgs = mockInferenceClient.chatCompletion.mock.calls[0][0];
      expect(callArgs.messages.map(m => m.content)).toEqual([
        'System',
        'First',
        'Reply',
        'Follow-up',
      ]);
    });

    it('should handle various message roles', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      const messages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
        { role: 'assistant', content: 'Assistant message' },
      ];

      await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages,
        stream: false,
      });

      const callArgs = mockInferenceClient.chatCompletion.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(3);
      expect(callArgs.messages.map(m => m.role)).toEqual(['system', 'user', 'assistant']);
    });

    it('should handle messages with special characters', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      const specialMessages = [
        { role: 'user', content: 'What\'s the meaning of "hello"?' },
        { role: 'user', content: '这是中文的问题' },
        { role: 'user', content: 'Line1\nLine2\nLine3' },
      ];

      for (const msg of specialMessages) {
        await callProvider({
          provider: 'huggingface',
          apiKey: 'test-key',
          messages: [msg],
          stream: false,
        });

        const callArgs = mockInferenceClient.chatCompletion.mock.calls[
          mockInferenceClient.chatCompletion.mock.calls.length - 1
        ][0];
        expect(callArgs.messages[0]).toEqual(msg);
      }
    });
  });

  describe('Configuration', () => {
    it('should use correct model name', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      });

      const callArgs = mockInferenceClient.chatCompletion.mock.calls[0][0];
      expect(callArgs.model).toBe('NousResearch/Hermes-3-Llama-3.1-8B');
    });

    it('should use API key from config', async () => {
      const testApiKey = 'hf_test_key_12345';
      
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      await callProvider({
        provider: 'huggingface',
        apiKey: testApiKey,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      });

      // Verify the InferenceClient was initialized with the key
      const { InferenceClient } = require('@huggingface/inference');
      expect(InferenceClient).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: testApiKey,
        })
      );
    });

    it('should default to non-streaming if not specified', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Response' } }],
      });

      await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      // Should call chatCompletion (non-streaming), not chatCompletionStream
      expect(mockInferenceClient.chatCompletion).toHaveBeenCalled();
    });
  });

  describe('Response parsing', () => {
    it('should extract content from API response', async () => {
      const expectedContent = 'This is the extracted content';
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: expectedContent } }],
      });

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      });

      expect(result).toBe(expectedContent);
    });

    it('should handle empty response content', async () => {
      mockInferenceClient.chatCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: '' } }],
      });

      const result = await callProvider({
        provider: 'huggingface',
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      });

      expect(result).toBe('');
    });
  });

  describe('Error scenarios', () => {
    it('should handle API timeout', async () => {
      mockInferenceClient.chatCompletion.mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(
        callProvider({
          provider: 'huggingface',
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle authentication errors', async () => {
      mockInferenceClient.chatCompletion.mockRejectedValueOnce(
        new Error('Unauthorized: Invalid API key')
      );

      await expect(
        callProvider({
          provider: 'huggingface',
          apiKey: 'invalid-key',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle model not found', async () => {
      mockInferenceClient.chatCompletion.mockRejectedValueOnce(
        new Error('Model not found: InvalidModel')
      );

      await expect(
        callProvider({
          provider: 'huggingface',
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        })
      ).rejects.toThrow('Model not found');
    });

    it('should handle quota exceeded', async () => {
      mockInferenceClient.chatCompletion.mockRejectedValueOnce(
        new Error('You have exceeded your quota')
      );

      await expect(
        callProvider({
          provider: 'huggingface',
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false,
        })
      ).rejects.toThrow('exceeded your quota');
    });
  });
});
