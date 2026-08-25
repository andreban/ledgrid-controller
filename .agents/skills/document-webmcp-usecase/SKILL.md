---
name: document-webmcp-usecase
description: >-
  Guide developers to design, discover, and document WebMCP tools and site UI reactions
  by role-playing user-agent conversations. Use when defining web agent interactions,
  specifying WebMCP tool contracts, and establishing client UI synchronization patterns.
---

# Documenting WebMCP Use Cases & Tool Discovery

This skill guides developers through role-playing end-to-end user-agent interactions on a website or web application. By simulating realistic conversational journeys, developers can systematically discover which WebMCP tools to build, specify the exact input/output payloads, define how the website's UI must react, and handle edge cases gracefully.

---

## 1. Core WebMCP Architectural Principles

Before writing use cases, keep these fundamental principles in mind:

1. **Direct Programmatic Execution (Not DOM Automation):**
   WebMCP tools are JavaScript functions exposed directly by the website to the browser agent. Tools interact directly with the application router, client state stores (Redux, Zustand, Pinia, React state), and backend APIs. Tools do **not** simulate robotic user typing into `<input>` fields or clicking buttons unless explicitly running UI integration tests.
2. **Context Window Efficiency & Token Budgeting:**
   **Never** return hundreds of raw records in tool responses. Large catalogs or query results will bloat the LLM context window, increase latency, and cause reasoning degradation.
   - **Always paginate listings:** Return a limited slice (e.g., `page_size: 12`) along with pagination metadata (`total_count`, `page`, `page_size`, `total_pages`).
   - **Return aggregated facet summaries:** Include high-level facet counts (e.g. materials, sizes, price ranges) so the agent understands the full dataset without seeing every item.
3. **Structured Response Contracts:**
   Every tool execution must return a structured JSON response back to the agent so the model has the exact data needed to formulate its next message.
4. **Semantic Workflows over Raw Navigation:**
   Prefer semantic action tools (e.g. `initiate_checkout` instead of `navigate_to_checkout`). Semantic tools perform pre-flight validations (cart check, inventory checks, session creation, total calculation) before transitioning views.
5. **Human-in-the-Loop Security Boundaries:**
   Define clear trust boundaries. Sensitive actions (e.g., payment entry, credit card CVV, final fund authorization, account deletion, browser hardware pairing permissions) must hand off control to the user on a secure UI screen (`requires_user_action`) rather than having the agent collect credentials or attempt unauthorized device access.
6. **Single Focused Goal per Use Case:**
   Each use case document MUST focus on **exactly one single, specific user goal** (e.g., _"Select and display an emoji matching the user's mood on the matrix"_ or _"Connect and configure a new physical LED grid"_). Do not bundle unrelated workflows into a single conversation. Build a coherent, turn-by-turn conversation specifically designed to support and achieve that single goal. If an application has multiple distinct workflows, create separate use case documents for each one.
7. **Explicit User Clarification (Never Fabricate Goals):**
   If the user has not provided a specific goal and starting state, **do NOT invent or assume them**. Always ask the user to clarify or choose their specific goal and starting state first (offering concrete options discovered from the codebase to guide them) before proceeding with the conversation role-play or document generation.

---

## 2. Step-by-Step Discovery Procedure

Follow these steps to document a WebMCP use case:

### Step 0: Clarify Goal & Initial State with the User (Required if Unspecified)

- If the user did not explicitly specify their goal and starting state:
  - Do **NOT** fabricate a scenario.
  - Inspect the codebase to identify potential user journeys (e.g. Viewer workflow vs Owner/Hardware workflow).
  - Prompt the user with clear options or ask them to specify:
    1. **Single Specific User Goal:** What exact task or outcome should this conversation achieve?
    2. **Initial State:** What is the starting application view, device connection status, or initial parameters?
- Once the user provides or confirms their goal and initial state, proceed to Step 1.

### Step 1: Define the Single User Goal & Context

- **Product Context:** What kind of web application is this (e.g. ecommerce store, travel booking, IoT controller)?
- **Single Primary Goal:** What is the confirmed, single outcome the user wants to achieve in this conversation? (Keep it strictly focused on one workflow—do not combine multiple distinct user objectives).
- **Boundaries:** What is the agent restricted from doing?

### Step 2: Establish Initial State

- **Application State:** Where is the user starting (e.g. homepage `/`, active dashboard, product page)? What is currently loaded/rendered?
- **Agent Context:** What has been discussed previously? Is this a fresh session or an existing conversation?
- **System Constraints:** What catalog, routing, device, or auth constraints apply?

### Step 3: Role-Play the Turn-by-Turn Conversation Supporting the Goal

Simulate the conversation from the initial user request to the successful completion of the single defined goal. For **every turn**, document all 6 elements:

1. **User Utterance:** Natural language request or question moving towards the goal.
2. **Agent Intent:** The agent's reasoning, parameter normalization, and coreference resolution.
3. **Agent Tool Invocations:** Javascript tool function call with explicit argument schema.
4. **Tool Response (to Agent):** Complete structured JSON payload returned to the model.
5. **Site Implementation & UI Reaction:** Programmatic actions performed on the site (route transitions, DOM re-renders, state store updates, canvas repaints, drawer toggles).
6. **Agent Response (to User):** The final conversational message to the user.

### Step 4: Compile Tool Specifications

Create a consolidated specification table of all tools discovered during the role-play:

- Tool Name
- Parameters (with optionality and types)
- Purpose & Return Values
- Expected Site Reaction

### Step 5: Document Variance, Edge Cases & Graceful Failure

Anticipate real-world variations and define structured recovery payloads:

- **Missing Prerequisites / Wrong State:** (e.g. filtering before searching) $\rightarrow$ Return actionable error guiding the agent to execute prerequisite first.
- **Missing Required Parameters:** (e.g. omitting required option) $\rightarrow$ Return `MISSING_REQUIRED_PARAMETER` with list of available options.
- **Out of Stock / Unavailable State:** (e.g. disconnected device or unavailable item) $\rightarrow$ Return structured error with recovery instructions.
- **Over-Constrained Queries:** (e.g. 0 matching items) $\rightarrow$ Return suggested filter relaxations.
- **Conversational Coreference:** Handle shorthand references (_"the first one"_, _"the rocket"_) by mapping previous turn results to identifiers.

### Step 6: Define Automated Evaluation (Evals) Checklist

List concrete test assertions for:

- Correct tool selection sequence per turn.
- Parameter extraction accuracy.
- DOM/UI synchronization checks.
- Graceful recovery on error payloads.
- Security boundary compliance.

---

## 3. Document Template

Use this markdown structure when creating use case documents:

````markdown
# WebMCP Use Case: [Title]

This document defines a single focused scenario, turn-by-turn conversation role-play, discovered WebMCP tools, expected site UI reactions, and recovery behaviors.

---

## 1. Scenario Definition

- **Context:** [Store / App Description]
- **Single User Goal:** [State the ONE specific user goal this use case and conversation achieves]
- **Initial State:**
  - **Application State:** [Current URL / Active View / Form / Device State]
  - **Agent Context:** [Session status / loaded memory]
  - **System Constraints:** [Catalog structure, auth/device permission requirements]

---

## 2. Role-Playing the Conversation

<!-- The turns below should represent a coherent conversation driving strictly toward achieving the single user goal above. -->

### **Turn 1: [Phase Name, e.g., Request & Discovery]**

- **User:** "[User statement]"
- **Agent Intent:** [Agent goal and parameter parsing]
- **Agent Tool Invocations:**
  ```javascript
  tool_name({
    param1: 'value',
    page: 1,
    page_size: 12,
  });
  ```
````

- **Tool Response (to Agent):**
  ```json
  {
    \"total_count\": 142,
    \"page\": 1,
    \"page_size\": 12,
    \"total_pages\": 12,
    \"results\": [ ... ],
    \"available_facets\": { ... }
  }
  ```
- **Site Implementation & UI Reaction:**
  - [Direct routing / state updates]
  - [Visual DOM updates, canvas redraws, UI notifications]
- **Agent Response:**
  > "[Conversational message to user]"

---

## 3. WebMCP Tool Specifications

| Tool Name   | Parameters                          | Purpose                         | Expected Site Reaction              |
| :---------- | :---------------------------------- | :------------------------------ | :---------------------------------- |
| `tool_name` | `param1: string`<br>`page?: number` | [Purpose & payload description] | [Direct site state & DOM reactions] |

---

## 4. Variance, Edge Cases & Graceful Failure

### 1. Pagination & Context Window Management

[Pagination strategies and token budget notes]

### 2. Coreference Resolution & Shorthand Referencing

[Handling phrases like 'the ocean one' or 'the first one']

### 3. Missing Prerequisites / Wrong State

[Error payload and agent recovery prompt]

### 4. Out-of-Stock / Unavailability

[Error payload and alternative recommendations]

---

## 5. Security & Trust Boundaries

- **Human-in-the-Loop:** [Explicit point where user takes over for sensitive actions]
- **Server-Side / Device Integrity:** [Validation of parameters and permissions]

---

## 6. Automated Evaluation (Evals) Checklist

1. **Tool Selection Accuracy:** [Expected tool call sequence]
2. **Parameter Extraction:** [Expected extracted parameters]
3. **UI Synchronization:** [Expected DOM state changes]
4. **Error Recovery Verification:** [Expected recovery behavior]

```

```
