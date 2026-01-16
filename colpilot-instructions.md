## 1. Design Consistency (HIGH PRIORITY)

Copilot **must maintain visual and interaction consistency** with the existing codebase.

### UI & Styling
- Follow existing design tokens, spacing, typography, and color usage.
- Reuse existing UI components whenever possible (do NOT introduce new button/menu patterns unless absolutely necessary).
- Match existing interaction patterns (hover states, dropdown behavior, modals, confirmations).
- Do not introduce new animation styles unless already present elsewhere.
- Prefer extending existing components over creating new ones.

### Component Patterns
- Respect current folder structure and file organization.
- Keep JSX structure and hook usage consistent with nearby files.
- Use the same icon system and menu patterns already in use.

---

## 1.5 Folder-Based Structure (MANDATORY)

Copilot **must maintain and enforce a feature-based, folder-oriented structure**.

### Folder Organization Rules

- Do NOT place new components directly under a generic folder (e.g. `components/`).
- Every feature must live inside its own **feature folder**.
- If a feature does not already have a folder, **create one** and place all related files inside it.

### Examples

❌ **Incorrect**
```

components/
ChatSidebar.jsx
ChatWindow.jsx
ChatLayout.jsx

```

✅ **Correct**
```

components/
chat_components/
ChatSidebar.jsx
ChatWindow.jsx
ChatLayout.jsx

```

The same rule applies to **all layers**:
- UI components
- API routes
- Hooks
- Utilities
- Feature-specific logic

---

### API & Backend Folder Rules

- API routes must also be grouped by feature.
- Do NOT place unrelated endpoints at the root of the API directory.

❌ **Incorrect**
```

api/
renameChat.js
deleteChat.js
setCollection.js

```

✅ **Correct**
```

api/
chat/
rename.js
delete.js
setCollection.js

```

---

### Feature Ownership Principle

- Files that belong to the same feature must live together.
- A feature folder should contain **everything it owns**, for example:
  - components
  - hooks
  - API handlers
  - helpers

Copilot should **co-locate related files** rather than scattering them across the project.

---

### Modification Rules

- When modifying an existing feature, place new files **inside that feature’s folder**.
- Do NOT move existing files unless explicitly instructed.
- Do NOT flatten the folder structure for convenience.

---

### Guiding Rule

> **If two files are always changed together, they belong in the same folder.**

Flat structures are discouraged.  
Feature folders are the default.




## 2. Minimal Architectural Changes (CRITICAL)

Copilot **must make the smallest possible change** to implement a feature.

### Architecture Rules
-  Do NOT refactor unrelated files.
-  Do NOT introduce new global state solutions.
-  Do NOT change data flow unless strictly required.
-  Do NOT redesign API shapes without necessity.

### Preferred Approach
- Modify existing components instead of creating parallel systems.
- Add new logic locally (inside the relevant component or API route).
- Extend existing database schemas with additive fields only.
- Avoid cross-cutting changes unless the feature cannot work otherwise.

> If a feature can be implemented by adding **one prop, one field, or one handler**, that is preferred over restructuring multiple files.

---

## 3. State & Data Handling

- Use existing state management patterns (React state, props, existing context).
- Do not introduce new libraries for state, menus, modals, or forms.
- Keep state colocated with the component that owns it.
- Avoid lifting state unless necessary.

### Database Changes
- Additive only (e.g., add `collection` field).
- Default values must preserve backward compatibility.
- Never remove or rename existing fields without explicit instruction.

---

## 4. API & Backend Guidelines

- Reuse existing API route structure and response formats.
- Keep request/response shapes consistent with current endpoints.
- Prefer small, focused endpoints over generalized ones.
- Do not introduce background jobs, queues, or new services unless explicitly requested.

---

## 5. UX Behavior Rules

- All destructive actions (e.g., delete) must require confirmation.
- Use optimistic UI updates when possible.
- Handle errors gracefully and non-intrusively (toast/snackbar style if already used).
- Preserve keyboard accessibility and focus behavior.

---

## 6. Code Quality Expectations

- Follow existing linting, formatting, and naming conventions.
- Keep functions small and readable.
- Add comments **only where logic is non-obvious**.
- Avoid over-engineering.

---

## 7. What Copilot Should NOT Do

Copilot must NOT:
- Redesign the sidebar layout globally.
- Introduce new architectural layers.
- Replace existing components with new abstractions.
- Add experimental patterns not already present.
- Perform large refactors under the guise of "cleanup".

---

## 8. Guiding Principle

> **If the change feels bigger than the feature, it is wrong.**

Prefer **incremental evolution** over restructuring.  
This codebase is intentionally compact — respect that.

---

## 9. When Unsure

If multiple implementation approaches exist:
1. Choose the one that touches **fewer files**.
2. Choose the one that looks most similar to existing code.
3. Choose clarity over cleverness.


