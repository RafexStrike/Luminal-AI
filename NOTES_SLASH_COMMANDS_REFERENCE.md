# Notes Slash Commands Reference

## Quick Reference

| Command | Type | Shortcut | Use Case |
|---------|------|----------|----------|
| `/h1` | Heading 1 | H1 button | Main title |
| `/h2` | Heading 2 | H2 button | Section title |
| `/h3` | Heading 3 | H3 button | Subsection |
| `/bullet` | Bullet List | • button | Lists & points |
| `/number` | Numbered List | 1. button | Steps & sequences |
| `/quote` | Quote | " button | Citations & highlights |
| `/code` | Code Block | {} button | Code snippets |
| `/divider` | Divider | — button | Separators |

## How to Use Slash Commands

### Step-by-Step Example

1. **Position cursor** where you want to insert a block
2. **Type /** (forward slash)
3. **Command menu appears** with suggestions
4. **Type to filter** (e.g., `h1` to find Heading 1)
5. **Press Arrow Up/Down** to navigate
6. **Press Enter** to select
7. **Block inserted** at cursor position

### Example Session

```
User types: /
↓
Menu shows 8 commands

User types: /h1
↓
Menu filters to show "Heading 1"

User presses: Enter
↓
Menu closes, "/" and "h1" are deleted
Heading 1 block created, cursor positioned inside

User types: "My Study Notes"
↓
Creates: <h1>My Study Notes</h1>

User presses: Enter
↓
New paragraph created below heading

User types: /bullet
↓
Menu shows "Bullet List"

User presses: Enter
↓
Bullet list created with first item ready
```

## All Commands Explained

### Heading 1 (H1)
```
Trigger: /h1  or  /heading  or  /title
Result:  Large heading for main titles
Usage:   Chapter names, main topics
```

**Example:**
```
/h1 Chapter 1: Introduction to Quantum Physics
```

Creates a large, prominent heading perfect for main sections.

---

### Heading 2 (H2)
```
Trigger: /h2  or  /heading  or  /section
Result:  Medium heading for sections
Usage:   Topic subdivisions
```

**Example:**
```
/h2 1.1 Basic Concepts
```

Creates a medium heading for subsections.

---

### Heading 3 (H3)
```
Trigger: /h3  or  /heading  or  /sub
Result:  Small heading for details
Usage:   Detail points, sub-subsections
```

**Example:**
```
/h3 Definition: Wave Function
```

Creates a small heading for detailed points.

---

### Bullet List
```
Trigger: /bullet  or  /list  or  /ul  or  /points
Result:  Unordered list with bullets
Usage:   Feature lists, key points, TODO items
```

**Example:**
```
/bullet
- Planck's constant (h)
- Wave length (λ)
- Frequency (f)
```

Creates a bulleted list of items.

---

### Numbered List
```
Trigger: /number  or  /list  or  /ol  or  /ordered
Result:  Ordered/numbered list
Usage:   Steps, procedures, rankings
```

**Example:**
```
/number
1. Understand the concept
2. Work through examples
3. Solve practice problems
4. Review and test
```

Creates a numbered list of sequential items.

---

### Quote
```
Trigger: /quote  or  /blockquote  or  /cite  or  /saying
Result:  Block quote for emphasis
Usage:   Important definitions, citations, highlights
```

**Example:**
```
/quote
"Energy cannot be created or destroyed, only transformed" 
- Law of Conservation of Energy
```

Creates an indented, emphasized quote block.

---

### Code Block
```
Trigger: /code  or  /codeblock  or  /pre  or  /snippet
Result:  Multi-line code block with monospace font
Usage:   Programming examples, code snippets, terminal commands
```

**Example:**
```
/code
const calculateEnergy = (mass, speed) => {
  return 0.5 * mass * (speed ** 2);
}
```

Creates a code block with monospace font and formatting preservation.

---

### Divider
```
Trigger: /divider  or  /hr  or  /line  or  /separator
Result:  Horizontal line separator
Usage:   Section breaks, visual separation
```

**Example:**
```
Content before divider
/divider
Content after divider
```

Creates a visual separator line between sections.

---

## Search Terms

Each command can be found by multiple search terms:

**Heading 1:** h1, heading, title, big
**Heading 2:** h2, heading, subtitle, section
**Heading 3:** h3, heading, sub
**Bullet:** list, bullet, ul, points
**Number:** list, number, ol, ordered
**Quote:** quote, blockquote, cite, saying
**Code:** code, codeblock, pre, snippet
**Divider:** divider, hr, line, separator

## Filtering Examples

```
Type:        Menu Shows:
/h           Heading 1, Heading 2, Heading 3
/head        Heading 1, Heading 2, Heading 3
/list        Bullet List, Numbered List
/l           Bullet List, Numbered List
/code        Code Block
/c           Quote, Code Block (both start with c sound)
/div         Divider
```

## Keyboard Navigation

Once menu is open:

```
Key              Action
─────────────────────────────────────
Arrow Up         Move to previous command
Arrow Down       Move to next command
Enter            Select highlighted command
Escape           Close menu without selecting
```

## Common Workflows

### Study Guide Template

```
/h1 Biology 101: Photosynthesis
/quote Important concept to understand
/h2 Overview
/bullet Basic definition
/bullet Key processes
/bullet Energy transformation

/h2 The Light-Dependent Reactions
/bullet Location: Thylakoid membrane
/bullet Process steps:
  /number Light absorption
  /number Electron transport
  /number ATP synthesis

/h2 The Light-Independent Reactions
/code
// Calvin cycle pseudocode
carbon_fixation()
reduction_phase()
regeneration_ribulose()
```

### Meeting Notes

```
/h1 Team Meeting - January 10, 2026
/h2 Attendees
/bullet John (Project Lead)
/bullet Sarah (Developer)
/bullet Mike (Designer)

/h2 Agenda
/number Status updates
/number Budget review
/number Next steps

/h2 Key Decisions
/quote "Launch date confirmed for March 1st"
/bullet Approved $50,000 budget
/bullet Assigned Sarah as lead developer

/divider

/h2 Action Items
/number John - Prepare presentation (due Jan 15)
/number Sarah - Setup development environment (due Jan 12)
/number Mike - Create mockups (due Jan 18)
```

### Code Documentation

```
/h1 API Documentation

/h2 Authentication

/h3 Login Endpoint
/code
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

/h3 Response
/code
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "userId": "user_123",
  "expiresIn": 3600
}

/divider

/h2 Error Handling
/quote "Always check status code before processing response"
/bullet 200: Success
/bullet 401: Unauthorized
/bullet 400: Bad request
/bullet 500: Server error
```

## Tips & Tricks

### Tip 1: Quick Navigation
Instead of typing full command, try shorter versions:
- `/h1` → Heading 1
- `/b` → Bullet List
- `/n` → Numbered List
- `/c` → Code Block

### Tip 2: Nesting Lists
```
/bullet Main point
Sub-bullet 1
/bullet Main point 2
```

### Tip 3: Code with Syntax
Code blocks preserve formatting:
```
/code
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}
```

### Tip 4: Mixed Formatting
Combine commands for complex documents:
```
/h1 Title
/quote Opening thought
/h2 Section 1
/bullet Points
/code Code example
/quote Key insight
```

### Tip 5: Emphasis with Quotes
Use quotes for important takeaways:
```
/quote "This is the most important concept"
```

## Formatting Beyond Slash Commands

### Toolbar Buttons

Once text is typed, use toolbar for formatting:

1. **Select text** (mouse or keyboard)
2. **Click toolbar button** or use keyboard shortcut

Examples:
```
Type: The speed of light is 3×10⁸ m/s
Select: "speed of light"
Click: Bold button (B)
Result: The **speed of light** is 3×10⁸ m/s

Type: E=mc²
Select: "mc²"
Click: Inline Code button
Result: E=`mc²`
```

### Keyboard Shortcuts

Common shortcuts (built-in Tiptap):
- **Ctrl+B** - Bold
- **Ctrl+I** - Italic
- **Ctrl+`** - Inline Code

### Text Formatting Reference

| Formatting | Method | Appearance |
|-----------|--------|------------|
| **Bold** | Ctrl+B or toolbar | text appears heavy |
| *Italic* | Ctrl+I or toolbar | text appears slanted |
| ~~Strike~~ | toolbar | text has line through |
| `code` | toolbar | monospace background |

## Troubleshooting

### Menu doesn't appear
- **Check:** Type `/` (forward slash), not `\` (backslash)
- **Check:** Cursor should be in editor (click editor area)
- **Check:** Refresh page if stuck

### Command doesn't execute
- **Check:** Press Enter after selection (not just clicking)
- **Check:** No syntax errors in filter text
- **Try:** Escape to close menu, try again

### Text disappears
- **Check:** Refresh browser (auto-save recovers it)
- **Check:** Check browser console for errors
- **Try:** Undo (Ctrl+Z)

### Formatting not showing
- **Check:** Make sure text is selected
- **Check:** Toolbar button should turn blue when active
- **Try:** Switch block type to see formatting

## Summary

**8 Slash Commands Available:**
1. Heading 1 - Large titles
2. Heading 2 - Sections
3. Heading 3 - Subsections
4. Bullet List - Unordered items
5. Numbered List - Sequential items
6. Quote - Important highlights
7. Code Block - Code snippets
8. Divider - Visual separators

**Navigation:**
- Type `/` to open menu
- Type to filter
- Arrow keys to navigate
- Enter to select
- Escape to cancel

**Remember:** Slash commands make note-taking fast and intuitive!

---

**Version:** 1.0  
**Last Updated:** January 10, 2026  
**Ready to Use:** ✅ YES
