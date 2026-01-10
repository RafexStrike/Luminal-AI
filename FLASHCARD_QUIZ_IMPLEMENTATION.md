# Flashcard & Quiz Feature Implementation

## Overview
Complete flashcard and quiz generation feature has been successfully implemented in the Luminal AI learning platform. Users can now generate interactive flashcards and multiple-choice quizzes from their chat conversations.

## Architecture

### Components

#### 1. **SECONDARY_ChatWindow.jsx**
- Located: [src/components/SECONDARY_ChatWindow.jsx](src/components/SECONDARY_ChatWindow.jsx)
- **New Features:**
  - Three action buttons in message selection bar:
    - "Generate Summary" (existing, enhanced)
    - "Generate Flashcards" (new)
    - "Generate Quizzes" (new)
  - Message selection checkboxes for assistant messages
  - Three new handler functions:

**New Handler Functions:**

```javascript
const handleGenerateFlashcards = async () => {
  // Calls POST /api/secondStage/flashcards
  // Generates flashcard sets from selected messages
  // Shows success alert with count
};

const handleGenerateQuizzes = async () => {
  // Calls POST /api/secondStage/quizzes
  // Generates MCQ question sets from selected messages
  // Shows success alert with count
};
```

#### 2. **SECONDARY_FlashcardsPanel.jsx**
- Located: [src/components/SECONDARY_FlashcardsPanel.jsx](src/components/SECONDARY_FlashcardsPanel.jsx)
- **Features:**
  - Displays flashcard sets for current chat
  - Click cards to flip and reveal answers
  - Shows difficulty level (easy/medium/hard)
  - Shows tags associated with each card
  - Export JSON button for each set
  - Copy individual cards to clipboard
  - Empty state with helpful message
  
**Card Structure:**
```javascript
{
  q: "Question text",
  a: "Answer text",
  difficulty: "easy" | "medium" | "hard",
  tags: ["topic1", "topic2"]
}
```

#### 3. **SECONDARY_QuizzesPanel.jsx**
- Located: [src/components/SECONDARY_QuizzesPanel.jsx](src/components/SECONDARY_QuizzesPanel.jsx)
- **Features:**
  - Displays quiz questions with 4 multiple-choice options
  - Users select answers and click "Check Answer"
  - Shows correctness feedback with green/red highlighting
  - Displays explanation for each question
  - Tracks score across all questions
  - Empty state when no quizzes generated

**Question Structure:**
```javascript
{
  question: "Question text",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answerIndex: 0,
  explanation: "Why this is the correct answer"
}
```

#### 4. **SECONDARY_ChatLayout.jsx**
- Located: [src/components/SECONDARY_ChatLayout.jsx](src/components/SECONDARY_ChatLayout.jsx)
- **Features:**
  - Tab-based navigation for Chat, Flashcards, Quizzes, Notes
  - Manages active tab state
  - Passes `refreshTrigger` to child components for automatic updates
  - Handles `onDataSaved()` callback to refresh panels

### API Routes

#### 1. **POST /api/secondStage/flashcards**
- File: [src/app/api/secondStage/flashcards/route.js](src/app/api/secondStage/flashcards/route.js)
- **Request:**
  ```javascript
  {
    chatId: string,
    messageIds: string[],
    provider: "openai" | "huggingface" | "groq",
    apiKey?: string
  }
  ```
- **Response:**
  ```javascript
  {
    cards: [
      { q, a, difficulty, tags },
      ...
    ],
    chatId: string,
    messageCount: number,
    savedId: string (if authenticated)
  }
  ```
- **Flow:**
  1. Validates input (chatId, messageIds)
  2. Gets authenticated user
  3. Builds message content from selected IDs
  4. Calls LLM provider with flashcard generation prompt
  5. Parses JSON response
  6. Saves to MongoDB (if authenticated)
  7. Returns cards array

#### 2. **GET /api/secondStage/flashcards**
- File: [src/app/api/secondStage/flashcards/route.js](src/app/api/secondStage/flashcards/route.js)
- **Query Params:**
  - `chatId`: string (required)
- **Response:**
  ```javascript
  {
    sets: [
      { _id, userId, chatId, cards: [...], createdAt },
      ...
    ]
  }
  ```
- **Flow:**
  1. Gets authenticated user
  2. Queries MongoDB for flashcard sets
  3. Filters by userId and chatId
  4. Sorts by createdAt (newest first)
  5. Returns sets array

#### 3. **POST /api/secondStage/quizzes**
- File: [src/app/api/secondStage/quizzes/route.js](src/app/api/secondStage/quizzes/route.js)
- **Request:**
  ```javascript
  {
    chatId: string,
    messageIds: string[],
    provider: "openai" | "huggingface" | "groq",
    apiKey?: string,
    questionCount?: number (default: 5)
  }
  ```
- **Response:**
  ```javascript
  {
    questions: [
      { question, options: [4], answerIndex, explanation },
      ...
    ],
    chatId: string,
    messageCount: number,
    savedId: string (if authenticated)
  }
  ```
- **Flow:**
  1. Validates input (chatId, messageIds)
  2. Gets authenticated user
  3. Builds message content from selected IDs
  4. Calls LLM provider with quiz generation prompt
  5. Parses JSON response
  6. Validates 4 options per question
  7. Saves to MongoDB (if authenticated)
  8. Returns questions array

#### 4. **GET /api/secondStage/quizzes**
- File: [src/app/api/secondStage/quizzes/route.js](src/app/api/secondStage/quizzes/route.js)
- **Query Params:**
  - `chatId`: string (required)
- **Response:**
  ```javascript
  {
    sets: [
      { _id, userId, chatId, questions: [...], createdAt },
      ...
    ]
  }
  ```
- **Flow:**
  1. Gets authenticated user
  2. Queries MongoDB for quiz sets
  3. Filters by userId and chatId
  4. Sorts by createdAt (newest first)
  5. Returns sets array

### Database Functions (SECONDARY_db.js)

#### Flashcard Functions
```javascript
export async function saveFlashcards({ userId, chatId, messageIds, cards })
// Saves generated flashcards to MongoDB
// Returns: { _id, userId, chatId, messageIds, cards, createdAt }

export async function getFlashcards({ userId, chatId })
// Retrieves all flashcard sets for a chat
// Returns: array of flashcard documents sorted by createdAt DESC
```

#### Quiz Functions
```javascript
export async function saveQuizzes({ userId, chatId, messageIds, questions })
// Saves generated quiz questions to MongoDB
// Returns: { _id, userId, chatId, messageIds, questions, createdAt }

export async function getQuizzes({ userId, chatId })
// Retrieves all quiz sets for a chat
// Returns: array of quiz documents sorted by createdAt DESC
```

### Collections in MongoDB

#### stage2_flashcards Collection
```javascript
{
  _id: ObjectId,
  userId: string,
  chatId: string,
  messageIds: string[],
  cards: [
    { q: string, a: string, difficulty: string, tags: string[] },
    ...
  ],
  createdAt: Date
}
```

#### stage2_quizzes Collection
```javascript
{
  _id: ObjectId,
  userId: string,
  chatId: string,
  messageIds: string[],
  questions: [
    { 
      question: string,
      options: [string, string, string, string],
      answerIndex: number,
      explanation: string
    },
    ...
  ],
  createdAt: Date
}
```

## User Workflow

### Generating Flashcards
1. User navigates to SecondStage page
2. Starts a conversation with AI tutor
3. In Chat tab, selects one or more assistant messages
4. A selection info bar appears with "Generate Flashcards" button
5. Clicks "Generate Flashcards"
6. API calls LLM to generate 10 flashcards from selected messages
7. Flashcards are saved to database
8. User switches to "Flashcards" tab to review
9. Clicks cards to reveal answers
10. Can export as JSON or copy individual cards

### Generating Quizzes
1. User navigates to SecondStage page
2. Starts a conversation with AI tutor
3. In Chat tab, selects one or more assistant messages
4. Clicks "Generate Quizzes" button
5. API calls LLM to generate 5 multiple-choice questions
6. Questions are saved to database
7. User switches to "Quizzes" tab
8. Selects answers and clicks "Check Answer"
9. Gets immediate feedback and explanation
10. Score is tracked and displayed

## LLM Provider Integration

The flashcard and quiz generation uses the `callProvider()` function from [src/lib/SECONDARY_providers.js](src/lib/SECONDARY_providers.js)

**Supported Providers:**
- OpenAI (gpt-4 model)
- HuggingFace (NousResearch/Hermes-3-Llama-3.1-8B)
- Groq (mixtral-8x7b-32768)

**System Prompts:**

Flashcards:
```
You are an expert tutor. Generate flashcards in JSON array format. 
Each card: {q: "question", a: "answer", difficulty: "easy|medium|hard", tags: ["tag1", "tag2"]}. 
Respond ONLY with JSON array, no markdown.
```

Quizzes:
```
You are an expert tutor. Generate multiple-choice questions in JSON array format. 
Each question: {question: "text", options: ["A", "B", "C", "D"], answerIndex: 0, explanation: "why A is correct"}. 
Respond ONLY with JSON array.
```

## Security & Authentication

- **Message Selection:** Only assistant messages can be selected (user messages are excluded)
- **User Validation:** All endpoints check for authenticated user via `getUserIfAuthenticated()`
- **Database Filtering:** All queries filter by `userId` to prevent data leakage
- **Anonymous Support:** Anonymous users can generate but not save (savedId will be null)

## Fixed Issues

1. **Auth Pages Suspense:** Fixed `useSearchParams()` warnings on login/signup pages by wrapping in Suspense boundary
2. **Build Success:** Project builds successfully with no errors (warnings only for CSS @property)

## Feature Highlights

✅ **Multiple Flashcard Sets:** Generate and store multiple flashcard sets per chat
✅ **Multiple Quiz Sets:** Generate and store multiple quiz sets per chat
✅ **Difficulty Levels:** Flashcards tagged with easy/medium/hard
✅ **Tags System:** Flashcards can have multiple tags for organization
✅ **Score Tracking:** Quiz scoring with feedback and explanations
✅ **Export Functionality:** Export flashcards as JSON
✅ **Copy to Clipboard:** Copy individual flashcard content
✅ **Responsive UI:** Beautiful, responsive design with Tailwind CSS
✅ **Automatic Refresh:** Tab content automatically updates when new content is generated
✅ **Empty States:** Helpful messages when no content available
✅ **Error Handling:** Graceful error messages and validation
✅ **Multiple LLM Providers:** Support for OpenAI, HuggingFace, Groq

## Configuration

### Environment Variables Required
- `OPENAI_API_KEY` - For OpenAI provider
- `HUGGINGFACE_API_KEY` - For HuggingFace provider
- `GROQ_API_KEY` - For Groq provider
- `SECONDARY_MONGODB_URI` - MongoDB connection string

### Default Settings
- Flashcards: 10 cards per generation
- Quizzes: 5 questions per generation
- Default Provider: OpenAI
- Default Model: gpt-4

## Testing Instructions

1. **Navigate to SecondStage:**
   - Login/Signup at `/auth/login` or `/auth/signup`
   - Navigate to `/secondStage`

2. **Start a Conversation:**
   - Type a question in the chat composer
   - Get AI response

3. **Generate Flashcards:**
   - Click checkbox on an assistant message (top-right)
   - Click "Generate Flashcards" button
   - Wait for processing
   - Switch to "Flashcards" tab
   - Click cards to reveal answers

4. **Generate Quizzes:**
   - Click checkboxes on assistant messages
   - Click "Generate Quizzes" button
   - Wait for processing
   - Switch to "Quizzes" tab
   - Answer questions and get feedback

## Future Enhancements

- [ ] Batch generation from multiple chats
- [ ] Custom flashcard/quiz settings (difficulty filters, card counts)
- [ ] Spaced repetition algorithm for flashcards
- [ ] Flashcard review statistics
- [ ] Quiz performance analytics
- [ ] Anki deck export
- [ ] Image support in flashcards
- [ ] Audio pronunciation for flashcards
- [ ] Collaborative flashcard sharing
- [ ] AI-powered difficulty assessment

## Troubleshooting

### Flashcards/Quizzes Not Generating
1. Check API key configuration for chosen provider
2. Verify MongoDB connection string is valid
3. Check browser console for error messages
4. Ensure at least one message is selected

### No Data Showing in Tabs
1. Confirm user is logged in (authenticated)
2. Verify chatId is properly set
3. Check MongoDB collections exist: `stage2_flashcards`, `stage2_quizzes`
4. Clear browser cache and refresh

### LLM Response Parsing Errors
1. Check that LLM response is valid JSON
2. Verify flashcard format: `{q, a, difficulty, tags}`
3. Verify quiz format: `{question, options[], answerIndex, explanation}`
4. Check LLM model supports JSON output

## Files Modified

1. [src/components/SECONDARY_ChatWindow.jsx](src/components/SECONDARY_ChatWindow.jsx)
   - Added: `handleGenerateFlashcards()` function
   - Added: `handleGenerateQuizzes()` function
   - Updated: Selection info bar with 3 buttons

2. [src/app/api/secondStage/flashcards/route.js](src/app/api/secondStage/flashcards/route.js)
   - Updated: POST handler with proper message content building
   - Verified: GET handler implementation

3. [src/app/api/secondStage/quizzes/route.js](src/app/api/secondStage/quizzes/route.js)
   - Updated: POST handler with proper message content building
   - Verified: GET handler implementation

4. [src/app/auth/signup/page.jsx](src/app/auth/signup/page.jsx)
   - Added: Suspense wrapper for `useSearchParams()`

5. [src/app/auth/login/page.jsx](src/app/auth/login/page.jsx)
   - Added: Suspense wrapper for `useSearchParams()`

## Deployment Notes

Before deploying to production:

1. Set all required environment variables
2. Configure MongoDB collections with indexes on userId and chatId for performance
3. Set appropriate rate limits on API endpoints
4. Configure CORS if frontend is on different domain
5. Enable HTTPS for secure cookie transmission
6. Test LLM provider API limits
7. Set up monitoring for API errors
8. Configure database backups

## Summary

The flashcard and quiz feature is now fully implemented and integrated into the Luminal platform. Users can seamlessly generate interactive study materials from their conversations, with automatic storage to MongoDB and a beautiful, responsive UI for reviewing and interacting with the generated content.
