# Quick Test Guide - Flashcard & Quiz Generation

## 🚀 Start Here

### Step 1: Verify Server is Running
```bash
# Terminal 1: Start dev server (if not already running)
cd /home/rafi/capstone/luminal
npm run dev
```
Expected: Server starts on `http://localhost:3000`

### Step 2: Access the Application
1. Open browser: `http://localhost:3000`
2. Login or signup if needed
3. Navigate to `/secondStage`

### Step 3: Start a Conversation
1. Type a topic in the message box, e.g., "What is quantum physics?"
2. Click "Send"
3. Wait for AI response (should appear within 5-10 seconds)
4. You should see your message and an AI response

### Step 4: Select Messages
1. Look for checkboxes on the RIGHT side of AI messages
2. Click checkbox on 1 or more AI responses
3. A blue info bar should appear at bottom: "X message(s) selected"

### Step 5: Generate Flashcards
1. Click the **purple "Generate Flashcards"** button
2. Wait 10-15 seconds (HuggingFace is generating)
3. Check console for: "Flashcards generated: {data}"
4. Success popup shows number of flashcards

### Step 6: View Flashcards
1. Click the **"Flashcards"** tab at top
2. You should see a card set with count (e.g., "Flashcard Set 1 (5 cards)")
3. Click a card to flip and see answer
4. Try "Export" button to download as JSON
5. Try "Copy Card" button

### Step 7: Generate Quizzes
1. Go back to "Chat" tab
2. Select message(s) again
3. Click the **orange "Generate Quizzes"** button
4. Wait 10-15 seconds
5. Success popup shows number of questions

### Step 8: Take Quiz
1. Click the **"Quizzes"** tab at top
2. You should see quiz questions
3. Select an answer (radio button)
4. Click "Check Answer"
5. See feedback (green if correct, red if wrong)
6. Score updates at top

## ✅ Expected Results

### Flashcards Tab Should Show:
- Card sets with question/answer pairs
- Difficulty badges (easy/medium/hard)
- Topic tags
- Flip animation on click
- Export and Copy buttons

### Quizzes Tab Should Show:
- Multiple choice questions
- 4 options per question
- Answer feedback with explanation
- Score counter
- Question progress indicator

## 🐛 If Something Goes Wrong

### Issue: "Failed to generate flashcards: API error: 500"

**Fix:** Already applied! The system now:
- Checks for OPENAI_API_KEY
- Falls back to HUGGINGFACE_API_KEY (which exists in your .env)
- Logs "OpenAI API key not found, switching to HuggingFace"

### Issue: Nothing Happens After Clicking Generate

1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Check that:
   - You selected at least 1 message
   - Server is running (`npm run dev` in terminal)
   - No 500 errors in network tab (F12 → Network tab)

### Issue: Flashcards/Quizzes Tab Shows Empty

1. Make sure you clicked Generate button successfully
2. Check browser console for errors
3. Verify MongoDB connection (check `SECONDARY_MONGODB_URI` in .env)
4. Refresh browser page (F5)

## 📊 What Changed (Technical)

### Fixed Files:
- `src/app/api/secondStage/flashcards/route.js` - Provider fallback logic
- `src/app/api/secondStage/quizzes/route.js` - Provider fallback logic
- `src/components/SECONDARY_ChatWindow.jsx` - Use HuggingFace by default

### Key Change:
```javascript
// Instead of always using OpenAI and failing without API key
// Now checks: if no key → use HuggingFace (which IS configured)
let providerToUse = provider;
if (!apiKey && provider === 'openai' && !process.env.OPENAI_API_KEY) {
  providerToUse = 'huggingface';  // ← Fallback
}
```

## 🎯 Testing Scenarios

### Scenario 1: Simple Test (2 min)
```
1. Start dev server
2. Login to app
3. Send 1 message
4. Select the AI response
5. Click "Generate Flashcards"
6. Wait for success popup
7. Click "Flashcards" tab
8. Verify cards appear
```

### Scenario 2: Full Test (5 min)
```
1. Do Scenario 1
2. Go back to Chat tab
3. Select message again
4. Click "Generate Quizzes"
5. Wait for success popup
6. Click "Quizzes" tab
7. Answer a question
8. Click "Check Answer"
9. Verify feedback appears
```

### Scenario 3: Multi-Message Test (5 min)
```
1. Have 3+ messages in chat
2. Select 2-3 AI messages
3. Generate flashcards
4. Generate quizzes
5. Compare results in tabs
6. Test export on flashcards
```

## 📱 Mobile Testing

The feature works on mobile too:
- Flashcards: Tap card to flip
- Quizzes: Tap option then "Check Answer"
- Tabs: Swipe or tap tab buttons

## 🔧 Debug Tips

### Enable Verbose Logging:
Add this to see detailed logs in terminal:

1. Open `src/app/api/secondStage/flashcards/route.js`
2. Add after the try block:
```javascript
console.log('Flashcards Request:', { chatId, messageIds, provider, providerToUse });
```

### Monitor API Calls:
1. Open DevTools (F12)
2. Go to Network tab
3. Click Generate button
4. Look for `flashcards` or `quizzes` POST request
5. Click it to see:
   - Request body (what you sent)
   - Response (what server returned)
   - Status code (should be 200)

### Check Server Response:
1. Open terminal where `npm run dev` is running
2. Look for:
   - "POST /api/secondStage/flashcards"
   - "Flashcards generated:"  (success) or
   - "Flashcards API error:"  (failure)

## ✨ Success Indicators

✅ Feature is working if you see:
1. "Generated 5 flashcards!" popup
2. Flashcard tab shows cards
3. Can flip cards to see answers
4. Export button works
5. Copy button works

✅ Quiz working if you see:
1. "Generated 5 quiz questions!" popup
2. Quiz tab shows questions
3. Can select answers
4. "Check Answer" gives feedback
5. Score updates

## 🎓 Learning Notes

The system is using:
- **LLM Provider:** HuggingFace (NousResearch/Hermes model)
- **Database:** MongoDB (saves for persistence)
- **Frontend:** React with Tailwind CSS
- **API:** Next.js Route Handlers

## 📝 Next Steps After Testing

1. If working: Celebrate! Feature is ready 🎉
2. If issues: Check the debug tips above
3. Document any errors in detail
4. Share error logs if needed

---

**Last Updated:** January 10, 2026
**Status:** ✅ Ready for Testing
