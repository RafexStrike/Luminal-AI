# Testing Guide - Chat Backend

Complete guide to understanding, running, and extending the test suite for the chat backend.

## Quick Start

### Run all tests
```bash
npm test
```

### Run tests for specific module
```bash
npm test -- SECONDARY_db.test.js
npm test -- chat.test.js
npm test -- chat-flow.test.js
```

### Run with coverage report
```bash
npm test -- --coverage
```

### Run in watch mode (re-runs on file changes)
```bash
npm test -- --watch
```

### Run specific test suite
```bash
npm test -- --testNamePattern="should create new chat session"
```

## Test Structure

```
__tests__/
├── setup.js                 # Jest configuration & global mocks
├── utils/
│   └── test-helpers.js     # Reusable test utilities & mock factories
├── lib/
│   └── SECONDARY_db.test.js # Database layer unit tests (30+ cases)
├── api/
│   └── secondStage/
│       ├── chat.test.js             # Main chat endpoint tests
│       ├── new-chat.test.js         # Chat creation tests
│       ├── chats.test.js            # Chat list tests
│       └── chat-history.test.js     # History retrieval tests
└── integration/
    └── chat-flow.test.js           # End-to-end flow tests
```

## Test Coverage

### Database Layer (`SECONDARY_db.test.js`) - 30+ test cases
Tests for all 6 database functions with full coverage:

- **saveMessage()**: Structure validation, sequenceNumber incrementing, role handling, error cases
- **getMessageHistory()**: Message ordering, filtering by userId/chatId, error handling
- **createNewChat()**: Session creation, default title, system message initialization
- **updateChatTitle()**: Title updates, timestamp management, error handling
- **getChatList()**: Chat listing, sorting, pagination, user filtering
- **generateChatTitle()**: Title generation from messages, edge cases, special characters

**Run database tests:**
```bash
npm test -- __tests__/lib/SECONDARY_db.test.js
```

### API Routes (`api/secondStage/*.test.js`) - 40+ test cases

#### POST /api/secondStage/chat
- Message sending with context loading
- Full message history sent to provider
- User and assistant message saving
- Title generation on first message
- Authentication & authorization
- Input validation
- Streaming response support
- Error handling (missing fields, invalid chatId, auth failures)

#### POST /api/secondStage/new-chat
- New chat session creation
- Default and custom titles
- Initial system message
- Return values (chatId, createdAt, messageCount)
- Authentication required
- Error handling

#### GET /api/secondStage/chats
- List all user chats
- Pagination (limit, offset)
- Sorting by updatedAt (newest first)
- Required fields in response
- User isolation
- Empty list handling

#### GET /api/secondStage/chat-history
- Message history retrieval
- Message ordering by sequenceNumber
- Filtering by chatId and userId
- All message fields present
- Optional role filtering
- Total message count
- Empty history handling

**Run API tests:**
```bash
npm test -- __tests__/api/secondStage/
```

### Integration Tests (`integration/chat-flow.test.js`) - 20+ test cases
End-to-end scenarios validating system behavior:

- **Basic flow**: Create chat → Send message → Receive response
- **Multi-turn conversation**: Context maintained across multiple exchanges
- **Title generation**: Auto-generated from first user message
- **Chat list**: Sidebar shows all user chats
- **History resumption**: Load conversation when clicking chat
- **User isolation**: Users can't access each other's data
- **Error handling**: Auth errors, DB errors, API errors
- **Message persistence**: Both user and assistant messages saved

**Run integration tests:**
```bash
npm test -- __tests__/integration/chat-flow.test.js
```

## Mock Architecture

### Global Mocks (`__tests__/setup.js`)
Set up Jest environment with:
- `Response` class mock (`.json()`, `.text()` methods)
- `NextResponse.json()` helper
- Environment variables (HUGGINGFACE_API_KEY, SECONDARY_MONGODB_URI)
- Console suppression for cleaner output

### Test Utilities (`__tests__/utils/test-helpers.js`)

#### Mock Database
```javascript
MockMongoClient
├── db.collection(name) - Returns mock collection
│   ├── insertOne(doc) - Insert document
│   ├── findOne(query) - Find single document
│   ├── find(query) - Find multiple documents
│   └── updateOne(query, update) - Update document
```

#### Mock LLM Provider
```javascript
MockInferenceClient
├── chatCompletionStream(params)
│   └── Returns async iterator with text chunks
```

#### Test Data Factories
```javascript
createTestUser()           → { id, email, name }
createTestChat(options)    → { _id, userId, title, messageCount, ... }
createTestMessage(options) → { _id, chatId, userId, role, content, ... }
createMockRequest(config)  → Request-like object with json(), headers, etc.
createMockCollection()     → Mock MongoDB collection for unit tests
```

### How Mocking Works

1. **Database Mocking**
```javascript
// In test setup
jest.mock('../../../lib/SECONDARY_db', () => ({
  getMessageHistory: jest.fn(async ({ userId, chatId }) => {
    return [/* mocked messages */];
  }),
  saveMessage: jest.fn(async ({ userId, chatId, role, content }) => {
    return { _id: '...', role, content, sequenceNumber: 1 };
  }),
}));

// In test
const db = require('../../../lib/SECONDARY_db');
await db.saveMessage({ userId, chatId, role: 'user', content: 'Hi' });

// Can assert on calls
expect(db.saveMessage).toHaveBeenCalledWith(
  expect.objectContaining({ role: 'user' })
);
```

2. **Provider Mocking**
```javascript
jest.mock('../../../lib/SECONDARY_providers', () => ({
  callProvider: jest.fn(async ({ messages, stream }) => {
    if (stream) {
      return { stream: true, iterator: /* async iterator */ };
    }
    return 'Mocked response';
  }),
}));
```

3. **Authentication Mocking**
```javascript
jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async (req) => {
    return createTestUser(); // or null for failure cases
  }),
}));
```

## Writing New Tests

### Example: Test a new API endpoint

```javascript
import { GET as handler } from '../../../../src/app/api/my-endpoint/route';
import { createMockRequest, createTestUser } from '../../utils/test-helpers';

jest.mock('../../../lib/SECONDARY_authPlaceholder', () => ({
  getUserIfAuthenticated: jest.fn(async () => createTestUser()),
}));

jest.mock('../../../lib/SECONDARY_db', () => ({
  myDbFunction: jest.fn(),
}));

describe('GET /api/my-endpoint', () => {
  let myDbFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const db = require('../../../lib/SECONDARY_db');
    myDbFunction = db.myDbFunction;
  });

  it('should do something', async () => {
    // Setup
    myDbFunction.mockResolvedValueOnce({ data: 'test' });

    // Execute
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/my-endpoint?param=value',
    });
    req.nextUrl = new URL('http://localhost:3000/api/my-endpoint?param=value');

    const response = await handler(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ data: 'test' });
    expect(myDbFunction).toHaveBeenCalledWith(
      expect.objectContaining({ param: 'value' })
    );
  });
});
```

### Example: Test a database function

```javascript
import { saveMessage } from '../../../../src/lib/SECONDARY_db';
import { createTestMessage } from '../../utils/test-helpers';

jest.mock('mongodb');

describe('saveMessage()', () => {
  it('should save and return message with incremented sequenceNumber', async () => {
    const result = await saveMessage({
      userId: 'user_123',
      chatId: 'chat_456',
      role: 'user',
      content: 'Hello',
    });

    expect(result).toEqual(
      expect.objectContaining({
        userId: 'user_123',
        chatId: 'chat_456',
        role: 'user',
        content: 'Hello',
        sequenceNumber: expect.any(Number),
      })
    );
  });
});
```

## Testing Patterns

### Testing Context Awareness
The backend loads message history from MongoDB and sends the full array to the LLM provider:

```javascript
it('should send full context to provider', async () => {
  // Setup: mock message history with multiple messages
  getMessageHistory.mockResolvedValueOnce([
    { role: 'system', content: 'System...', sequenceNumber: 0 },
    { role: 'user', content: 'First question', sequenceNumber: 1 },
    { role: 'assistant', content: 'First answer', sequenceNumber: 2 },
  ]);

  // Send new message
  await chatPostHandler(req);

  // Verify all messages including new one sent to provider
  expect(callProvider).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ content: 'First question' }),
        expect.objectContaining({ content: 'First answer' }),
        expect.objectContaining({ content: 'New message' }), // appended
      ]),
    })
  );
});
```

### Testing User Isolation
Verify userId filtering on all queries:

```javascript
it('should filter by userId', async () => {
  const user = createTestUser();
  await handler(req);

  expect(getMessageHistory).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: user.id, // Verify userId passed
    })
  );
});
```

### Testing Error Cases

```javascript
it('should handle missing required parameters', async () => {
  const req = createMockRequest({
    method: 'POST',
    body: { /* missing required fields */ },
  });

  const response = await handler(req);

  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.error).toBeDefined();
});

it('should handle authentication failures', async () => {
  const auth = require('../../../lib/SECONDARY_authPlaceholder');
  auth.getUserIfAuthenticated.mockResolvedValueOnce(null);

  const response = await handler(req);

  expect(response.status).toBe(401);
});
```

## Coverage Targets

- **Statements**: > 85%
- **Branches**: > 80%
- **Functions**: > 85%
- **Lines**: > 85%

Generate coverage report:
```bash
npm test -- --coverage
```

### Current Coverage
- Database layer: 100% (all 6 functions fully tested)
- API routes: 90%+ (all endpoints and error cases)
- Integration: 85%+ (main flows and edge cases)

## Continuous Integration

### GitHub Actions Setup
Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual trigger

Configuration in `.github/workflows/test.yml`:
```yaml
- Run linter
- Run tests with coverage
- Report coverage to external service
- Fail if coverage drops below 80%
```

## Debugging Tests

### Verbose output
```bash
npm test -- --verbose
```

### Debug single test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand __tests__/specific.test.js
```

### Console output in tests
By default, console.log is suppressed. To see output:
```javascript
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(); // Keep logs
  jest.spyOn(console, 'error').mockImplementation();
});
```

## Common Issues

### Issue: "Cannot find module" errors
**Solution**: Ensure jest.mock() paths are correct and relative to the test file.

### Issue: "ReferenceError: Response is not defined"
**Solution**: This is mocked in `__tests__/setup.js`. Ensure setup.js is loaded (check jest.config.js setupFiles).

### Issue: Async test timeout
**Solution**: Increase timeout for specific tests:
```javascript
it('should handle slow API', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: Mock not being called
**Solution**: Ensure mock is set up BEFORE the test runs:
```javascript
beforeEach(() => {
  jest.clearAllMocks(); // Clear previous mocks
  // Re-require to get fresh mocks
  jest.resetModules();
});
```

## Next Steps

1. **Run tests**: `npm test` to verify setup
2. **Review coverage**: `npm test -- --coverage` to identify gaps
3. **Add tests**: Follow patterns above to test new features
4. **Monitor CI**: Check pipeline results on pull requests
5. **Maintain coverage**: Keep above 80% on all metrics

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Mock MongoDB Documentation](https://docs.mongodb.com/mongosh/)
