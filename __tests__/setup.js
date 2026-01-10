/**
 * Test setup and configuration
 * Runs before all tests
 */

// Mock environment variables
process.env.SECONDARY_MONGODB_URI = 'mongodb://localhost:27017/youlearn-test';
process.env.HUGGINGFACE_API_KEY = 'hf_test_token_12345';

// Mock Next.js Response
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async text() {
    return String(this.body);
  }
};

// Mock NextResponse
global.NextResponse = {
  json: (data, init = {}) => {
    return new Response(JSON.stringify(data), {
      ...init,
      status: init.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  },
};

// Suppress console output in tests unless in debug mode
const originalError = console.error;
const originalWarn = console.warn;

if (!process.env.DEBUG_TESTS) {
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
