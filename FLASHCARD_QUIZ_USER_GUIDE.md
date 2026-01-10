# Flashcard & Quiz Feature - Quick Start Guide

## Feature Overview

The Luminal platform now includes automatic flashcard and quiz generation. Users can create study materials from their conversations with the AI tutor in just a few clicks.

## Getting Started

### 1. Access the SecondStage Learning Platform
```
URL: /secondStage
Requirements: Must be logged in
```

### 2. Start a Conversation
- Type your learning topic or question
- Get a response from the AI tutor
- The response appears as an "assistant" message

### 3. Select Messages for Generation
- Look for checkboxes on the right side of assistant messages
- Click the checkbox to select one or more messages
- A blue info bar appears: "X message(s) selected"

### 4. Generate Flashcards
- Click the **"Generate Flashcards"** button
- Wait for processing (typically 5-10 seconds)
- Success alert shows the number of flashcards created
- Switch to the **"Flashcards"** tab to view

### 5. Generate Quizzes
- Click the **"Generate Quizzes"** button
- Wait for processing
- Success alert shows the number of quiz questions created
- Switch to the **"Quizzes"** tab to view

## Using Flashcards

### Viewing Flashcards
1. Click the **"Flashcards"** tab in the top navigation
2. Each set shows the question count and an "Export" button
3. Cards are displayed in a deck format

### Interacting with Cards
- **Reveal Answer:** Click a card to flip and see the answer
- **See Difficulty:** Cards show difficulty level: Easy (green), Medium (yellow), Hard (red)
- **View Tags:** Topic tags appear below the answer
- **Copy Card:** Click "Copy Card" to copy Q&A to clipboard
- **Export Set:** Click "Export" to download as JSON

### Navigation
- Use arrow keys or swipe to move between cards
- Buttons at bottom: "Previous" / "Next"

## Using Quizzes

### Taking a Quiz
1. Click the **"Quizzes"** tab in the top navigation
2. Each question shows the set number and total questions
3. Select an answer from 4 options

### Submitting Answers
- **Select an option:** Click a radio button
- **Check Answer:** Click "Check Answer" button
- **Green highlight:** Your answer was correct
- **Red highlight:** Your answer was incorrect
- **See explanation:** Why the correct answer is right

### Scoring
- Score is displayed at the top: "Score: X / Y"
- Updates as you answer more questions
- Shows your progress through the quiz

## Data Storage

### Where Is My Data Saved?
- ✅ Flashcards are saved to your MongoDB database
- ✅ Quizzes are saved to your MongoDB database
- ✅ Associated with your user account
- ✅ Organized by chat session
- ✅ Cannot be accessed by other users

### Anonymous Users
- ⚠️ Cannot save flashcards and quizzes
- ⚠️ Can still generate and use them temporarily in the browser
- ✅ Should create an account to save study materials

## Tips & Tricks

### Getting Better Flashcards
1. **Select Quality Messages:** Choose assistant responses with detailed explanations
2. **Combine Multiple Messages:** Select 2-3 messages for richer content
3. **Topic-Focused:** Ask specific questions to get targeted study materials

### Getting Better Quizzes
1. **Ask Detailed Questions:** More detailed responses = better quiz questions
2. **Include Examples:** Ask for examples in your conversation
3. **Specify Topics:** "Explain quantum physics" generates better quizzes than "Tell me about physics"

### Organization
1. **Multiple Chats:** Create separate chats for different topics
2. **Multiple Sets:** Generate flashcards multiple times for the same chat to get variation
3. **Export & Backup:** Export important flashcards as JSON for backup

## Keyboard Shortcuts

### In Flashcards Tab
- **←** / **→**: Navigate between cards
- **Space**: Flip card to reveal answer

### In Quizzes Tab
- **1-4**: Select options
- **Enter**: Check answer

## Common Questions

**Q: How many flashcards are generated at once?**
A: 10 flashcards per generation

**Q: How many quiz questions are generated?**
A: 5 questions per generation (configurable up to 20)

**Q: Can I generate multiple sets from the same messages?**
A: Yes! Each generation creates a new set. Click Generate again for variation.

**Q: Are my flashcards and quizzes private?**
A: Yes! Only you can see them. They're tied to your user account.

**Q: What if the AI generates wrong information?**
A: Edit the flashcard/quiz or generate a new set. The AI is learning-focused but not perfect.

**Q: Can I export for Anki or Quizlet?**
A: Flashcards export as JSON. Future updates will support Anki format.

**Q: How long does generation take?**
A: Typically 5-10 seconds depending on your LLM provider.

**Q: What if generation fails?**
A: Check that you selected messages. Try again. Check console for error details.

## Troubleshooting

### Issue: "Generate Flashcards" button is disabled
**Solution:** Select at least one assistant message first

### Issue: Generation times out
**Solution:** 
- Check your internet connection
- Verify API key is valid
- Try shorter selected content

### Issue: No flashcards/quizzes shown after generation
**Solution:**
- Refresh the page
- Switch to the tab and back
- Check if you're logged in

### Issue: Old content still showing after generating new set
**Solution:**
- Click the "Refresh" icon (circular arrow)
- Or: Switch away and back to the tab

### Issue: JSON export doesn't work
**Solution:**
- Browser might not support download
- Try right-click → "Save As" on the export button
- Check browser console for errors

## Best Practices

✅ **Do:**
- Review generated content for accuracy
- Generate multiple sets for reinforcement
- Use flashcards for memorization
- Use quizzes to test understanding
- Export important sets as backup
- Create topic-specific chats

❌ **Don't:**
- Rely solely on AI-generated content
- Use without reviewing for accuracy
- Delete chats without exporting important materials
- Try to generate from user messages (only assistant messages work)

## Integration with Other Features

### With Chat
- All flashcards/quizzes come from your chat messages
- Chat tab shows selection checkboxes
- Can generate while chatting

### With Summaries
- Generate summaries and flashcards from the same messages
- Summaries provide overview, flashcards provide details
- Use together for comprehensive learning

### With Notes
- Take notes from flashcard content
- Reference quizzes in your notes
- Create study plans in notes section

## Performance Tips

- **Mobile:** Quizzes work better than flashcards on small screens
- **Large Sets:** If generation seems slow, try selecting fewer messages
- **Network:** Ensure stable internet for API calls
- **Browser:** Use Chrome or Firefox for best experience

## Support

For issues or suggestions:
1. Check troubleshooting section above
2. Review error message in browser console
3. Contact support with error details
4. Share feature requests on the feedback page

---

**Last Updated:** January 2026
**Version:** 1.0
