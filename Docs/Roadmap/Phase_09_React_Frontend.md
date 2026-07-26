# Phase 9 — React Frontend

## 1. Module Overview: Client Interface Core

### Purpose
To develop the frontend client interface. It provides an upload console, logical project switching, and a transparent RAG chat window showing confidence states, source citations, and collapsible vertical reasoning timelines.

### Dependencies
- Phase 2 (Authentication endpoints running).
- Phase 4 (Upload and Polling endpoints running).
- Spring Boot `/api/chat/query` RAG endpoint active.

---

## 2. Intended Folder Structure (React Frontend)

The React client application folder layout:

```text
phoenix-frontend/src/
├── store/
│   ├── useAuthStore.js              # Token and user details storage
│   └── useProjectStore.js           # Active project, documents, and messages
├── components/
│   ├── Layout.jsx                   # Common Shell with Sidebar
│   ├── Vault/
│   │   ├── UploadZone.jsx           # File dropzone & status polling list
│   │   └── VaultDashboard.jsx       # Vault list manager
│   ├── Chat/
│   │   ├── ChatContainer.jsx        # Dual-panel conversation area
│   │   ├── MessageBubble.jsx        # Individual chat message with Badge
│   │   ├── CitationMatrix.jsx       # Sidebar containing source context cards
│   │   └── ReasoningTimeline.jsx    # Collapsible Framer Motion trace steps
│   └── Shared/
│       └── ConfidenceBadge.jsx      # Health Meter badge
```

---

## 3. UI Component Details

### CSS & Typography:
- CSS Framework: Vanilla CSS with custom Tailwind configurations.
- Custom fonts: Inter (sans-serif) for general UI; IBM Plex Mono for code configurations and confidence badges.

### Zustand Stores:
- **`useAuthStore`**: stores `{ token, user, isAuthenticated, login(credentials), register(data), logout() }` with token stored in `localStorage`.
- **`useProjectStore`**: stores `{ projects, activeProject, documents, messages, fetchProjects(), setProject(), uploadFile(), queryRAG() }`.

### Framer Motion Animations:
- Reasoning panel collapses and expands with height transitions.
- Individual steps within the timeline slide in sequentially on render.

---

## 4. Atomic Implementation Task List

### Task 9.1: Build Zustand Authentication & Project Stores
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 1.5
- **Description**: Implement Zustand store models to manage global states (authentication tokens, active project, and chat histories). Apply axios interceptor rules to inject bearer headers.
- **Definition of Done**: Store files created, token persists in `localStorage` across page reloads.

### Task 9.2: Create Layout & Sidebar (Project Selector)
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 9.1
- **Description**: Build main dashboard Shell with dynamic project switcher selector sidebar allowing creation of new projects.
- **Definition of Done**: Component renders, active project state switches in store, updating UI layouts.

### Task 9.3: Develop Document Vault Upload Component
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 9.2
- **Description**: Write `UploadZone.jsx` accepting technical PDFs. Show polling logs directly in UI reflecting file status (`PROCESSING` -> `READY`).
- **Definition of Done**: Drag-dropping file starts upload; status polling updates items visually; handles errors elegantly.

### Task 9.4: Build Chat Console Container (Two-Column Layout)
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 9.3
- **Description**: Create chat interface splitting screen on wide viewports (left: chat messages; right: vertical citations stack card details).
- **Definition of Done**: Screen splits correctly on large displays and stacks cleanly on mobile displays.

### Task 9.5: Implement Markdown Chat Bubbles & Citation Matrix Linkage
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 9.4
- **Description**: Render AI responses using `react-markdown`. Style citation links (`[p.12 - YAML]`) so that clicking a citation scrolls to and highlights the target source card in the right sidebar.
- **Definition of Done**: Clicking markdown citations successfully focuses and highlights the corresponding card in the citation matrix.

### Task 9.6: Design Collapsible Reasoning Trace Timeline (Framer Motion)
- **Estimated Size**: L
- **Risk**: Medium
- **Prerequisites**: Task 9.5
- **Description**: Build `ReasoningTimeline.jsx` component. If response `reasoningTrace` is present, display a toggle. Clicking toggle expands a vertical timeline animating step details.
- **Definition of Done**: Timeline collapses and expands with smooth framer-motion animations; icons color-code to step types.

### Task 9.7: Add 4-Tier Confidence Badges
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 9.5
- **Description**: Implement `ConfidenceBadge` showing HSL color indicators mapping to 4-tier model rules:
  - $> 0.75$: Green (Verified Source)
  - $0.50 - 0.75$: Yellow (Self-Corrected Search)
  - $0.35 - 0.50$: Orange (Low Confidence / Re-ranked)
  - $< 0.35$: Red (Ambiguous Search)
- **Definition of Done**: Badges reflect correct labels, border designs, and HSL colors according to scores.
