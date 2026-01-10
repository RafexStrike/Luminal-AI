# Quick Diagnostic Test for Notes Feature

## Test 1: Check if Editor Loads

1. Go to http://localhost:3001/secondStage
2. Click "Notes" tab
3. Open browser DevTools (F12)
4. Go to Console tab
5. Type: `document.querySelector('[contenteditable="true"]')`
6. **If it returns an element**: Editor is loaded ✓
7. **If it returns null**: Editor is NOT loaded ✗

## Test 2: Check Editor Content

In console, type:
```javascript
const editor = document.querySelector('[contenteditable="true"]');
if (editor) {
  console.log("Editor HTML:", editor.innerHTML);
} else {
  console.log("No editor found");
}
```

## Test 3: Check Component Props

In console, type:
```javascript
// Get the Notes Panel state (advanced - requires React devtools)
// Or just check localStorage
console.log(localStorage.getItem('youlearn_stage2_notes'));
```

## Test 4: Simple Button Click Test

1. Type some text in editor: "Test"
2. Select "Test"
3. In console, type:
```javascript
// Simulate button click
const button = document.querySelector('button[title="Bold (Ctrl+B)"]');
if (button) {
  button.click();
  console.log("Bold button clicked");
} else {
  console.log("Bold button not found");
}
```

4. Check if "Test" becomes bold

## Test 5: Check Network Requests

1. Open DevTools Network tab
2. Click Notes tab  
3. Look for GET request to `/api/secondStage/notes`
4. Click on it
5. Check Response tab - should show JSON with `{content: "...", createdAt: "...", updatedAt: "..."}`

## Common Issues and Fixes

### Issue: Editor is not rendering at all
**Check**: Is there an iframe or contenteditable element visible?
**Fix**: Try refreshing the page

### Issue: Editor renders but buttons don't work
**Check**: Are the buttons clickable? Do they highlight?
**Fix**: Check browser console for JavaScript errors

### Issue: Content not loading from database
**Check**: Network tab - what does the GET /api/secondStage/notes respond with?
**Fix**: Make sure you saved content first with "Save to Server" button

### Issue: Formatting appears selected but doesn't apply
**Check**: Is the editor actually receiving focus and input?
**Fix**: Click in the editor area first, then try formatting

## What Information to Gather

Please check and tell me:

1. **Editor loads?** (Y/N)
   - Run: `document.querySelector('[contenteditable="true"]')` in console

2. **Can you type?** (Y/N)
   - Try typing in the editor

3. **What does the API return?** 
   - Check Network tab → GET /api/secondStage/notes → Response

4. **Any console errors?** (Y/N)
   - Check Console tab for red error messages

5. **Can you click buttons?** (Y/N)
   - Try clicking Bold button

6. **What happens when you click Bold?**
   - Nothing?
   - Button highlights but text stays plain?
   - Text becomes bold? ✓

7. **Can you type "/" for slash commands?** (Y/N)
   - Does menu appear?

**Once you share these answers, I can pinpoint the exact problem!**
