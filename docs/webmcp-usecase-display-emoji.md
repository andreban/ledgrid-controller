# WebMCP Use Case: Search & Display Emoji

This document defines a single focused scenario, turn-by-turn conversation role-play, discovered WebMCP tools, expected site UI reactions, and recovery behaviors for searching and displaying an emoji on the LED grid controller.

---

## 1. Scenario Definition

- **Context:** LED Grid Controller (`ledgrid-controller`) web application for selecting and displaying emojis on an LED matrix and syncing them across clients via Firebase.
- **Single User Goal:** Find a space-themed emoji and display it.
- **Initial State:**
  - **Application State:** App loaded at `/` with the emoji picker ready.
  - **Agent Context:** Fresh conversation session with an active WebMCP connection to the browser tab.
  - **System Constraints:** None. Emoji selection immediately updates the active display and broadcasts to connected clients.

---

## 2. Role-Playing the Conversation

### **Turn 1: Request & Catalog Search**

- **User:** "I want to put something cool and space-themed on the LED grid. What options do I have?"
- **Agent Intent:** Search the emoji library for space-related emojis and present a paginated list of options to the user.
- **Agent Tool Invocations:**
  ```javascript
  search_emojis({
    query: 'space',
    page: 1,
    page_size: 5,
  });
  ```
- **Tool Response (to Agent):**
  ```json
  {
    "total_count": 8,
    "page": 1,
    "page_size": 5,
    "total_pages": 2,
    "results": [
      {
        "emoji": "🚀",
        "name": "rocket",
        "category": "travel_places",
        "keywords": ["space", "launch", "ship"]
      },
      {
        "emoji": "🛸",
        "name": "flying saucer",
        "category": "travel_places",
        "keywords": ["ufo", "alien", "space"]
      },
      {
        "emoji": "🌕",
        "name": "full moon",
        "category": "travel_places",
        "keywords": ["space", "night", "moon"]
      },
      {
        "emoji": "🪐",
        "name": "ringed planet",
        "category": "travel_places",
        "keywords": ["saturn", "planet", "space"]
      },
      {
        "emoji": "🌌",
        "name": "milky way",
        "category": "travel_places",
        "keywords": ["space", "stars", "galaxy"]
      }
    ],
    "available_categories": ["travel_places", "objects", "symbols"]
  }
  ```
- **Site Implementation & UI Reaction:**
  - Read-only search query executed against emoji dataset.
  - Optionally updates the search input field in the UI picker.
- **Agent Response:**
  > "Here are some great space-themed emoji options:
  >
  > 1. 🚀 **Rocket**
  > 2. 🛸 **Flying Saucer**
  > 3. 🌕 **Full Moon**
  > 4. 🪐 **Ringed Planet**
  > 5. 🌌 **Milky Way**
  >
  > Which one would you like to display?"

---

### **Turn 2: Selection & Display**

- **User:** "Let's go with the rocket!"
- **Agent Intent:** Resolve coreference ("the rocket" $\rightarrow$ `🚀`) and invoke the tool to display the chosen emoji.
- **Agent Tool Invocations:**
  ```javascript
  display_emoji({
    emoji: '🚀',
  });
  ```
- **Tool Response (to Agent):**
  ```json
  {
    "success": true,
    "emoji": "🚀",
    "message": "Emoji 🚀 is now displayed and synced."
  }
  ```
- **Site Implementation & UI Reaction:**
  - Calls `EmojiDatabase.setEmoji('🚀')` (or `onEmojiSelect('🚀')`).
  - Canvas preview updates to show `🚀`.
  - Firebase Realtime Database broadcasts update to all connected clients and hardware.
- **Agent Response:**
  > "Done! 🚀 **Rocket** is now displayed."

---

## 3. WebMCP Tool Specifications

| Tool Name       | Parameters                                                                                                  | Purpose                                                                      | Expected Site Reaction                                        |
| :-------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------ |
| `search_emojis` | `query: string`<br>`category?: string`<br>`page?: number` (default: 1)<br>`page_size?: number` (default: 6) | Searches the emoji catalog with pagination.                                  | Read-only; optionally updates emoji picker search term in UI. |
| `display_emoji` | `emoji: string`                                                                                             | Sets the active emoji, updating the display preview and syncing to Firebase. | Updates canvas preview and writes to Firebase database.       |

---

## 4. Variance, Edge Cases & Graceful Failure

### 1. Pagination & Token Budgeting

- When querying broad search terms, results are capped to `page_size: 6` (max 12) with pagination metadata (`total_count`, `page`, `page_size`, `total_pages`).
- Agent presents the top slice and offers to show more if needed.

### 2. Conversational Coreference

- Users may reply with ordinal positions (_"the first one"_), names (_"rocket"_), or descriptions (_"the UFO"_).
- The agent resolves these references to the matching unicode character (`"🚀"`) before calling `display_emoji`.

### 3. No Search Results

- If a query returns 0 results:
  ```json
  {
    "total_count": 0,
    "page": 1,
    "page_size": 5,
    "total_pages": 0,
    "results": [],
    "suggested_queries": ["stars", "planet", "science"]
  }
  ```
- Agent response: _"I couldn't find any emojis matching '[term]'. Would you like to try searching for stars, planet, or science?"_

### 4. Invalid Input

- If a non-emoji string is passed to `display_emoji`:
  ```json
  {
    "success": false,
    "error_code": "INVALID_EMOJI",
    "message": "Input must be a valid single emoji character."
  }
  ```

---

## 5. Security & Trust Boundaries

- **Direct Execution:** WebMCP tools call application handlers directly (`onEmojiSelect` / `EmojiDatabase.setEmoji`) without simulating DOM keyboard or click events.
- **Input Validation:** `display_emoji` validates that the input string is a valid emoji character before propagating state changes.

---

## 6. Automated Evaluation (Evals) Checklist

1. **Tool Selection Accuracy:**
   - Turn 1: Invokes `search_emojis(query="space")`.
   - Turn 2: Invokes `display_emoji(emoji="🚀")`.
2. **Parameter Extraction:**
   - Resolves natural language references (e.g., `"the rocket"`, `"the first one"`) to `"🚀"`.
3. **UI Synchronization:**
   - Canvas element updates with `"🚀"`.
   - Firebase Realtime Database path `/ledgrids/1/emoji` is updated to `"🚀"`.
4. **Error Recovery Verification:**
   - Handles zero-result queries by suggesting alternative terms.
