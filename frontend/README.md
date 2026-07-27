# React Frontend Application

This module provides the user interface for the Phoenix platform, styled as a technical document workspace inspired by developer utilities (such as Linear, GitHub, Cursor, and Notion).

---

## Visual Design & System Tokens

The interface uses a restrained neutral color scheme, compact margins, and clean typography:
- **Surface Styling**: Flat charcoal `#09090B` backgrounds, solid `#0C0C0E` panels, and `#161618` card layers with thin `#27272A` borders.
- **Typography**: Clean hierarchy using `Inter` for UI components and `JetBrains Mono` for monospace trace logs, relevance ratios, and code blocks.
- **Micro-Interactions**: Subtle, quick opacity transitions for panel collapses; absolutely no bouncy or scaling animations.

---

## Directory Layout

```text
frontend/src/
├── components/
│   ├── Layout.jsx           # Workspace sidebar navigation and project selector
│   ├── AuthForm.jsx         # Minimal flat login/registration card interface
│   ├── Chat/
│   │   ├── ChatContainer.jsx# Workspace retrieval panel and empty state diagnostics
│   │   ├── MessageBubble.jsx# Flat message bubble panels
│   │   ├── ReasoningTimeline.jsx # Terminal-style build execution logs trace
│   │   └── CitationMatrix.jsx   # monospaced citation source cards matrix
│   ├── Vault/
│   │   ├── VaultDashboard.jsx   # Document library files list
│   │   └── UploadZone.jsx   # Dashed drag-and-drop PDF ingestion zone
│   └── Shared/
│       └── ConfidenceBadge.jsx  # Small status tags (Verified, Corrected, Reranked, Clarified)
├── store/
│   ├── useAuthStore.js      # Zustand store for JWT authentication state
│   └── useProjectStore.js   # Zustand store for projects list, files, and chat messages
├── main.jsx                 # Entry point
└── index.css                # Global styles, scrollbars, and tailwind configurations
```

---

## Setup & Startup

### Prerequisites
- Node.js 18+ (npm)

### 1. Installation
Install core project dependencies:
```bash
npm install
```

### 2. Startup
Run the Vite development server locally:
```bash
npm run dev
```
The application will open on `http://localhost:5173`. Ensure the backend Spring Boot server is active on `8080`.

---

## State Management (Zustand Stores)

- **`useAuthStore`**: Manages current user profile JWT tokens, loading flags, and login/registration triggers.
- **`useProjectStore`**: Coordinates active projects, loaded document files list, messages history log, and async `queryRAG` backend requests.

---

## Testing & Verifications

Run the Vitest/jsdom component and interaction test suite using:
```bash
npm run test
```
- **`ChatInteraction.test.jsx`**: Validates project selectors, chat box queries, timeline toggles, and citation scrolling.
