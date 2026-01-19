/**
 * FILE: src/components/flashcards/TESTING_GUIDE.md
 * DESCRIPTION: Manual testing and acceptance criteria for FSRS flashcard system
 */

# FSRS Flashcard System - Testing Guide

## Overview

This document outlines manual testing steps and acceptance criteria for the FSRS-lite flashcard implementation.

## Pre-flight Checklist

- [ ] Browser console has no errors
- [ ] localStorage is available (not in private mode)
- [ ] Feature flag `FEATURE_FLASHCARDS_FSRS` is enabled
- [ ] All component files imported correctly

## Manual Testing Scenarios

### Scenario 1: Create a Manual Collection

**Steps:**
1. Open the Flashcards interface
2. Click "New Collection" button in sidebar
3. Enter collection name: "Test Collection"
4. Verify collection appears in sidebar list

**Expected Results:**
- Collection created with unique ID
- Collection appears highlighted in sidebar
- Shows "0 cards" until cards are added
- Created timestamp is set

**Pass/Fail:** ___

---

### Scenario 2: Add a Card Manually

**Steps:**
1. With a collection open, click "Add Card" button
2. Enter front: "What is the capital of France?"
3. Enter back: "Paris"
4. Add tags: "geography", "capitals"
5. Click "Save Card"

**Expected Results:**
- Modal closes
- Card appears in collection grid
- Shows front, back preview
- Shows stability and difficulty values
- Tags are visible

**Pass/Fail:** ___

---

### Scenario 3: Edit an Existing Card

**Steps:**
1. Click on a card in the collection grid
2. Card editor modal opens
3. Modify front or back text
4. Click "Save Card"

**Expected Results:**
- Card updates immediately in grid
- New text is displayed
- No duplicate cards created

**Pass/Fail:** ___

---

### Scenario 4: Review Session with Rating

**Steps:**
1. In a collection with at least 3 cards, click "Review X Cards"
2. Card appears with question showing
3. Press space (or click) to flip and reveal answer
4. Rate the card as "Good" (press 3 or click button)
5. Next card loads
6. Complete rating for remaining cards
7. See session summary

**Expected Results:**
- Card flips smoothly with answer visible
- Rating buttons only show after flip
- Rating disappears, next card loads
- Progress bar updates
- Session stats show counts (Again/Hard/Good/Easy)
- Cards marked as reviewed cannot be selected again today

**Pass/Fail:** ___

---

### Scenario 5: Keyboard Shortcuts

**Steps:**
1. Start a review session
2. Test space bar to flip
3. Test 1, 2, 3, 4 keys to rate

**Expected Results:**
- Space flips card
- 1 = Again
- 2 = Hard
- 3 = Good
- 4 = Easy
- Card advances on rating

**Pass/Fail:** ___

---

### Scenario 6: FSRS Algorithm Validation

**Steps:**
1. Create a card with default S=3, D=5
2. Rate it "Good" (quality=4)
3. Check updated stability

**Expected Results:**
- Stability increased (should be > 3)
- Difficulty slightly decreased (should be < 5)
- nextReviewAt is set to future date
- History entry created with timestamp and quality

**Calculation verification:**
```
gain = 0.18 × (2/3) × (1 + (1 - R))
# If R=1 (just reviewed): gain = 0.12
S_new = 3 × (1 + 0.12) = 3.36
# Expected: S_new ≈ 3.36 days
```

**Pass/Fail:** ___

---

### Scenario 7: Due Cards Filtering

**Steps:**
1. Create collection with 5 cards
2. Set some cards' nextReviewAt to today (via console or logic)
3. Set others to future dates
4. Check "Start Review" button

**Expected Results:**
- Button shows count of due cards only
- Review queue displays only due cards
- Future cards not shown

**Pass/Fail:** ___

---

### Scenario 8: Dashboard Statistics

**Steps:**
1. Open dashboard with 1-2 collections
2. Verify cards are visible
3. Check retention percentage calculated
4. Check daily stats panel
5. Verify upcoming schedule shows cards

**Expected Results:**
- Total cards counted correctly
- Average retention displays (0-100%)
- Due today count is accurate
- Collections overview shown
- Upcoming cards listed with intervals

**Pass/Fail:** ___

---

### Scenario 9: Collection Settings

**Steps:**
1. Open collection and click "Actions" → "Settings"
2. Adjust target retention to 80%
3. Adjust max reviews to 20
4. Save

**Expected Results:**
- Settings modal opens
- Values display correctly
- Settings persist after save
- Closing and reopening shows saved values

**Pass/Fail:** ___

---

### Scenario 10: Documentation Popup

**Steps:**
1. Click "ℹ️ Help" button
2. Tab through Overview, Algorithm, Example, FAQ
3. Click "Show worked example"
4. Try "Export PDF"

**Expected Results:**
- Popup opens with tabs
- Each tab content displays clearly
- Example shows card progression
- Step-by-step calculation visible
- Formulas display correctly
- FAQ answers clear

**Pass/Fail:** ___

---

### Scenario 11: Export to JSON

**Steps:**
1. Collection with 3+ cards
2. Click Actions → Export
3. Choose "json" format
4. Save file
5. Open JSON file in text editor

**Expected Results:**
- File downloads with name format: `CollectionName.json`
- JSON is valid and readable
- Contains all cards with FSRS fields
- Can be imported later

**Pass/Fail:** ___

---

### Scenario 12: Export to Anki CSV

**Steps:**
1. Collection with cards
2. Click Actions → Export
3. Choose "anki" format
4. File downloads
5. Open in text editor or import to Anki

**Expected Results:**
- File downloads as `.csv`
- Headers include Anki format
- Cards formatted with tabs/newlines
- Compatible with Anki import

**Pass/Fail:** ___

---

### Scenario 13: Forgotten Card (Again Rating)

**Steps:**
1. Create card with S=6, D=5
2. Rate it "Again" (quality=0)

**Expected Results:**
- Stability reduced to ~3 (half with 0.5 floor)
- Difficulty increased to ~5.5
- Lapses incremented to 1
- Card due sooner (nextReviewAt closer)
- History shows quality=0 entry

**Pass/Fail:** ___

---

### Scenario 14: Easy Rating (Easy Recall)

**Steps:**
1. Create card with S=3, D=5
2. Rate it "Easy" (quality=5)

**Expected Results:**
- Stability increased significantly
- Difficulty decreased to ~4
- nextReviewAt pushed far into future
- Largest interval among all ratings

**Pass/Fail:** ___

---

### Scenario 15: Data Persistence

**Steps:**
1. Create collection with 5 cards
2. Rate some cards
3. Close browser tab
4. Reopen app
5. Verify collection and review history still present

**Expected Results:**
- Collections reload from localStorage
- Cards with updated S/D/nextReviewAt preserved
- Review history intact
- Can continue reviewing without loss

**Pass/Fail:** ___

---

### Scenario 16: Empty Collection

**Steps:**
1. Create collection
2. Click "Start Review" without adding cards

**Expected Results:**
- "No reviews due" message displayed
- Helpful message shown
- No error thrown

**Pass/Fail:** ___

---

### Scenario 17: Delete Collection

**Steps:**
1. Collection with cards
2. Click Actions → Delete Collection
3. Confirm deletion

**Expected Results:**
- Confirmation dialog shown
- Collection and all cards removed
- Sidebar refreshes
- No cards orphaned in storage

**Pass/Fail:** ___

---

### Scenario 18: Collection Copy Limit

**Steps:**
1. Add multiple tags to card
2. Try to remove tag by clicking X badge
3. Add new tag

**Expected Results:**
- Tags removable individually
- Can add/remove without conflicts

**Pass/Fail:** ___

---

### Scenario 19: Search Collections

**Steps:**
1. Create 5 collections with different names
2. Type search query in sidebar
3. Filter results
4. Clear search

**Expected Results:**
- Collections filtered by name
- Partial matches work
- Case-insensitive
- Clear returns full list

**Pass/Fail:** ___

---

## Unit Test Checklist

Run these programmatic tests:

```javascript
// Test 1: Recall probability decay
import { estimateR } from '@/lib/helpers/flashcardHelpers';
const r = estimateR(1, 10);
console.assert(Math.abs(r - Math.exp(-0.1)) < 0.001, 'estimateR failed');

// Test 2: Forgotten card reduces stability
const card = { stability: 4, difficulty: 5, lapses: 0, history: [] };
const updated = applyReviewUpdate(card, 0, new Date());
console.assert(updated.stability === 2, 'Again stability failed');
console.assert(updated.lapses === 1, 'Lapses not incremented');

// Test 3: Good rating increases stability
const card2 = { stability: 3, difficulty: 5, lapses: 0, history: [] };
const updated2 = applyReviewUpdate(card2, 4, new Date());
console.assert(updated2.stability > 3, 'Good stability gain failed');

// Test 4: Easy rating largest gain
const card3 = { stability: 3, difficulty: 5, lapses: 0, history: [] };
const easyUpdate = applyReviewUpdate(card3, 5, new Date());
const goodUpdate = applyReviewUpdate(card3, 4, new Date());
console.assert(easyUpdate.stability > goodUpdate.stability, 'Easy gain not largest');

// Test 5: Migration adds default fields
import { migrateCard } from '@/lib/helpers/flashcardHelpers';
const oldCard = { front: 'Q', back: 'A' };
const migrated = migrateCard(oldCard);
console.assert(migrated.stability === 3, 'Migration default stability failed');
console.assert(migrated.difficulty === 5, 'Migration default difficulty failed');
console.assert(migrated.lapses === 0, 'Migration default lapses failed');
```

**All pass:** ___

---

## Accessibility Testing

- [ ] Can tab through all buttons
- [ ] Cards flip with keyboard
- [ ] Rating buttons accessible
- [ ] Modals have proper focus
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces card content

---

## Performance Testing

- [ ] Load 100 cards - list loads smoothly
- [ ] Review session maintains 60 FPS
- [ ] No memory leaks over 10 min session
- [ ] localStorage doesn't exceed 5MB

---

## Edge Cases

- [ ] Very long card text (> 1000 chars)
- [ ] Many tags (50+)
- [ ] Rapid rating clicks
- [ ] Browser back button during review
- [ ] Network offline (graceful degradation)
- [ ] localStorage quota exceeded

---

## Sign-off

| Scenario | Result | Notes |
|----------|--------|-------|
| 1. Manual Collection | ___ | |
| 2. Add Card | ___ | |
| 3. Edit Card | ___ | |
| 4. Review Session | ___ | |
| 5. Keyboard Shortcuts | ___ | |
| 6. Algorithm Validation | ___ | |
| 7. Due Filtering | ___ | |
| 8. Dashboard | ___ | |
| 9. Settings | ___ | |
| 10. Documentation | ___ | |
| 11. Export JSON | ___ | |
| 12. Export Anki | ___ | |
| 13. Forgotten Card | ___ | |
| 14. Easy Card | ___ | |
| 15. Persistence | ___ | |
| 16. Empty Collection | ___ | |
| 17. Delete Collection | ___ | |
| 18. Tags | ___ | |
| 19. Search | ___ | |

**Overall Status:** ___

**Tested By:** ___

**Date:** ___

**Notes:**

