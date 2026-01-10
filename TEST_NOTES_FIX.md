# Notes Feature Fix - Testing Guide

## Overview
This document provides step-by-step testing instructions to verify that both critical issues are fixed:
1. **Formatting commands now apply correctly** to content
2. **Notes properly load and persist** across chat switches

## Prerequisites
- Dev server running on http://localhost:3001
- Logged in to the application
- Open developer console (F12) for debugging

## Issue 1: Formatting Commands Should Now Apply

### Test Case 1.1: Toolbar Bold/Italic Buttons
```
Steps:
1. Navigate to http://localhost:3001/secondStage
2. Click the "Notes" tab
3. Type: "Hello World"
4. Select the word "Hello"
5. Click the Bold button (B icon) in toolbar
6. Expected: "Hello" should appear in bold
7. Select "World"
8. Click the Italic button (I icon) in toolbar
9. Expected: "World" should appear in italic

Result: ✓ PASS if formatting is visibly applied
        ✗ FAIL if text remains plain
```

### Test Case 1.2: Heading Buttons
```
Steps:
1. In Notes editor, type: "Chapter 1"
2. Select "Chapter 1"
3. Click "Heading 1" button in toolbar
4. Expected: Text becomes large, styled heading
5. Type on new line: "Section A"
6. Select it, click "Heading 2" button
7. Expected: Text becomes medium-sized heading

Result: ✓ PASS if headings are styled
        ✗ FAIL if text remains plain
```

### Test Case 1.3: List Buttons
```
Steps:
1. In Notes editor, type: "Item 1"
2. Select the line
3. Click Bullet List button (dot icon)
4. Expected: Line becomes bulleted item
5. Press Enter and type: "Item 2"
6. Expected: Automatically bulleted

Result: ✓ PASS if bullets appear
        ✗ FAIL if text remains plain
```

### Test Case 1.4: Slash Commands Execute
```
Steps:
1. In Notes editor, click to position cursor
2. Type: /h1
3. Expected: Menu appears showing "Heading 1"
4. Press Enter
5. Expected: "/" and "h1" are deleted, new heading block created
6. Type: "My Title"
7. Expected: Text appears as Heading 1

Alternative test:
1. Type: /bullet
2. Expected: Menu shows "Bullet List"
3. Press Enter
4. Expected: Bullet list created
5. Type: "Point 1"
6. Expected: Appears as bullet

Result: ✓ PASS if blocks are actually inserted
        ✗ FAIL if nothing changes or only text appears
```

## Issue 2: Notes Load and Persist

### Test Case 2.1: Save and Reload (Same Chat)
```
Steps:
1. Navigate to http://localhost:3001/secondStage
2. Create or select a chat
3. Click Notes tab
4. Type: "This is my first note"
5. Click "Save to Server" button
6. Expected: ✓ Saved to server message appears
7. Refresh page (Ctrl+R)
8. Click Notes tab again
9. Expected: "This is my first note" should be visible

Result: ✓ PASS if content reappears
        ✗ FAIL if Notes tab is empty
```

### Test Case 2.2: Different Content Per Chat
```
Steps:
1. Navigate to http://localhost:3001/secondStage
2. Create Chat A
3. Go to Notes
4. Type: "Chat A Notes"
5. Click "Save to Server"
6. Create Chat B (different chat)
7. Go to Notes
8. Expected: Notes tab is empty (no content from Chat A)
9. Type: "Chat B Notes"
10. Click "Save to Server"
11. Switch back to Chat A
12. Go to Notes
13. Expected: See "Chat A Notes" again (not "Chat B Notes")

Result: ✓ PASS if each chat has separate notes
        ✗ FAIL if Chat A shows Chat B's notes
```

### Test Case 2.3: Formatted Content Persistence
```
Steps:
1. Create a chat
2. Go to Notes tab
3. Type using slash commands:
   - /h1 "Title"
   - /bullet "Point 1"
   - /bullet "Point 2"
4. Click "Save to Server"
5. Refresh page (Ctrl+R)
6. Click Notes tab
7. Expected: 
   - Heading 1 "Title" visible and formatted
   - Two bullet points visible and formatted
   - All formatting preserved

Result: ✓ PASS if formatting persists
        ✗ FAIL if any formatting is lost
```

### Test Case 2.4: Auto-Save to LocalStorage
```
Steps:
1. Open Notes tab
2. Type: "Auto-save test"
3. Wait 2+ seconds (auto-save interval)
4. Open Developer Console (F12)
5. Go to Application tab > LocalStorage
6. Find key: "youlearn_stage2_notes"
7. Expected: Contains { content: "...", updatedAt: "..." }
8. Close browser tab completely
9. Reopen http://localhost:3001/secondStage
10. Go to Notes
11. Expected: "Auto-save test" visible in Notes tab

Result: ✓ PASS if content survives browser reload
        ✗ FAIL if content is lost
```

## Expected Behavior After Fix

### Formatting Should Work
- Toolbar buttons apply formatting immediately
- Slash commands insert actual blocks
- Typing after slash command works
- All 13 toolbar buttons function
- Keyboard shortcuts (Ctrl+B, Ctrl+I) work

### Loading Should Work
- Notes load from server when opening a chat
- Each chat maintains separate notes
- Content persists after page refresh
- Formatted content (HTML) renders correctly
- Old plain text notes still work (backward compatible)

## Debug Information

If tests fail, check:

### Check Editor State
```
In browser console:
- localStorage.getItem('youlearn_stage2_notes') 
  Should show current note content
```

### Check Network Requests
```
Open DevTools (F12)
Network tab:
1. Click "Save to Server"
2. Look for POST to /api/secondStage/notes
3. Check response status: should be 200
4. Response body should show: { success: true, updatedAt: "..." }
```

### Check Content in Database
```
If you have MongoDB access:
1. Use: db.stage2_notes.find()
2. Should return notes with:
   - userId: logged-in user ID
   - chatId: current chat ID
   - content: HTML from editor
   - updatedAt: timestamp
```

## Common Issues & Solutions

### Issue: Formatting Button Clicked but Text Doesn't Change
- **Cause**: Select text first before clicking button
- **Solution**: Click button, then type to see effect, or select existing text and click

### Issue: Slash Command Menu Doesn't Appear
- **Cause**: Cursor not in editor or character not being detected
- **Solution**: Click directly in editor area, ensure "/" character is typed

### Issue: Notes Don't Load After Save
- **Cause**: Browser cache or localStorage conflict
- **Solution**: 
  1. Clear localStorage: `localStorage.clear()` in console
  2. Refresh page
  3. Test again

### Issue: Different Chat Shows Same Notes
- **Cause**: chatId not being passed correctly
- **Solution**:
  1. Check Network tab - POST to /api/secondStage/notes should include chatId
  2. Check that ChatLayout passes chatId prop to NotesPanel
  3. Check console for errors

## Test Results Summary

After running all tests, mark results:

| Test | Expected | Result | Status |
|------|----------|--------|--------|
| 1.1 Bold/Italic | Formatting applies | _____ | ____ |
| 1.2 Headings | Headings styled | _____ | ____ |
| 1.3 Lists | Bullets appear | _____ | ____ |
| 1.4 Slash Commands | Blocks insert | _____ | ____ |
| 2.1 Save/Reload | Content persists | _____ | ____ |
| 2.2 Per-Chat Notes | Separate content | _____ | ____ |
| 2.3 Format Persist | HTML preserved | _____ | ____ |
| 2.4 LocalStorage | Auto-save works | _____ | ____ |

**Overall Status**: _______________

## Code Changes Made

### File: SECONDARY_TiptapEditor.jsx
1. Added `useEffect` to update editor content when `value` prop changes
   - This fixes the "notes don't load" issue
   - Calls `editor.commands.setContent()` when content changes
   
2. Changed slash commands from `toggleHeading()` to `setHeading()`
   - More reliable for inserting new blocks
   
3. Fixed command selection timing
   - Commands now execute immediately after deletion (no setTimeout)

### File: SECONDARY_NotesPanel.jsx
1. Improved fetch error handling
   - Better fallback to localStorage
   - Clearer logic flow

### Key Fix Details
- **Root Cause 1**: Editor wasn't re-hydrating when `value` prop changed
  - **Solution**: Use `editor.commands.setContent()` in useEffect
  
- **Root Cause 2**: Commands used `toggle` instead of `set`
  - **Solution**: Changed to `setHeading()`, `setHorizontalRule()` for clearer intent

## Next Steps

1. **Run tests** using the test cases above
2. **Document results** in the table above
3. **If tests pass**: Feature is ready for production
4. **If tests fail**: Check debug info and common issues

---

**Test Date**: _______________
**Tester**: _______________
**Status**: [ ] PASS  [ ] FAIL
