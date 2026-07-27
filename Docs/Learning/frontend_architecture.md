# Engineering Note — React Frontend Architecture

## 1. Problem Being Solved
RAG conversational systems are black boxes. Users struggle to trust AI answers without seeing:
1. The **exact source context** (passages, files, and pages) that informed the response.
2. The **retrieval execution trace** (query rewrites, cross-encoder scores, fallbacks).
3. The **system confidence score** (quantifying source reliability).

The Phoenix React Frontend solves this by providing a clean, transparent interface containing two-column conversational console, interactive citation highlights, collapsible reasoning step timelines, drag-and-drop document vault, and 4-tier health-meter badges.

## 2. Why This Approach Was Selected
* **Zustand State Stores**: Light-weight, boilerplate-free global state stores (`useAuthStore` and `useProjectStore`) that decouple layout rendering from backend network operations.
* **Resilient Mock Fallback**: All API calls (Auth, Projects, Vault upload/polling, and FastAPI RAG process) automatically switch to realistic frontend mock generators if the backend services are offline. This ensures complete system observability during development and client demos.
* **React Markdown Link Interception**: Using `react-markdown` with custom link components. When citation anchors like `[[p. 1 - YAML]](#match-1)` are clicked, the application intercept the browser click, selects the parent message, scrolls to card `#citation-card-match-1` smoothly, and triggers a pulsing blue border ring.
* **Framer Motion Accordions**: Animates timeline expansions and sequential step fades.

## 3. Alternative Approaches
* **Redux Toolkit**: RTK is highly powerful but introduces extensive boilerplate code (actions, reducers, selectors, thunks). Zustand accomplishes the same state management in ~80 lines.
* **Standard HTML Anchor Offsets**: Standard `<a href="#id">` causes abrupt scrolling jumps and pushes the anchor element to the absolute top of the screen, hiding it behind the app header. Custom scroll-into-view overrides centering alignment and applies pulsing focus highlights.

## 4. State Management and Persistence Details
The frontend implements two persistent stores:
1. **`useAuthStore`**: Reads/writes JWT tokens and user profiles to `localStorage` on login/logout, keeping the user authenticated across browser sessions.
2. **`useProjectStore`**: Preserves chat messages (`msgs_[projectId]`) and uploaded document catalogs (`docs_[projectId]`) locally per project, simulating a fully database-driven history without any local file storage constraints.

## 5. Components & Interactions
* **`Layout`**: Sidebar controller housing the project dropdown switcher, view selector (Chat vs. Vault), and logout trigger.
* **`UploadZone`**: PDF dropzone supporting drag-and-drop file imports. Starts polling the backend `/api/documents/{id}/status` until status resolves to `READY`.
* **`ChatContainer`**: Controls the dual-panel grid (Left: message feed & typing inputs; Right: citation matrix cards). Contains suggested prompts to test individual mock state machine escalations.
* **`MessageBubble`**: Displays RAG replies, confidence badges, and the collapsible reasoning timelines.

## 6. Common Pitfalls & Debugging Tips
* **Browser Sandbox File Uploads**: Input elements must filter for `.pdf` strictly, and `FormData` headers should not manually set `Content-Type` boundary strings (allowing the browser to handle it automatically).
* **Scroll Timing**: If the citation card is located on a message that is not currently selected, the elements might not be rendered on the screen. The link handler first selects the message, waits `100ms` for the DOM to update, and then performs `scrollIntoView` safely.

## 7. Interview Discussion Points
* **Q**: What are the advantages of Zustand over React Context?
  *A*: React Context triggers re-renders on all consuming components whenever any value in the context changes. Zustand uses selectors to subscribe components to specific state slices, preventing unnecessary re-renders and improving frontend performance.
* **Q**: How does the click-to-highlight citation matrix work under the hood?
  *A*: RAG answers are generated containing custom markdown links (e.g. `[[p. 3 - YAML]](#match-2)`). The link element `<a>` custom renderer intercepts the click via `preventDefault()`, queries the DOM for `citation-card-match-2`, calls `scrollIntoView({ behavior: 'smooth', block: 'center' })`, and appends the `animate-pulse-highlight` CSS class for 2 seconds.
