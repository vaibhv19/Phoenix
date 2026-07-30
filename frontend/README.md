# React Client Console SPA

This module provides the technical developer workspace UI for Phoenix, styled to resemble high-efficiency developer dashboards (e.g. Cursor, GitHub, Linear).

---

## 1. Key Responsibilities & UX Design

The React client console implements standard developer patterns:
1. **Developer Density layout**: Maximizes screen space, minimizing padding and margins. Code displays inside JetBrains Mono syntax highlighted panels.
2. **Interactive Citation matrix**: Selecting a citation highlights the corresponding source chunk in the context panel using standard CSS highlights.
3. **Execution Trace Timeline**: Visualizes the backend `reasoningTrace` step-by-step to show query rewrites and reranking details.
4. **Zustand Store State Management**: Keeps state outside the React render lifecycle to prevent context refresh loops.

---

## 2. Directory Layout

```text
frontend/src/
├── components/
│   ├── Layout.jsx           # Sidebar navigation, username profile card & avatars
│   ├── AuthForm.jsx         # Registrations & login interfaces
│   ├── Chat/
│   │   ├── ChatContainer.jsx# Conversational RAG workspace console
│   │   ├── Timeline.jsx     # Reasoning state machine steps renderer
│   │   └── CitationList.jsx # Dynamic sidebar references highlights
│   └── Vault/
│       └── FileVault.jsx    # Drag-and-drop file ingestion dashboard
├── store/
│   ├── useAuthStore.js      # Zustand store: user sessions & Bearer tokens
│   └── useProjectStore.js   # Zustand store: active projects, messages, file polls
└── index.css                # Custom scrollbars, tailwind classes & keyframes
```

---

## 3. Configuration & Startup

### Prerequisites
* Node.js 18+ (npm)

### 1. Configure Env
Ensure `frontend/.env` is set up with the gateway API URL:
```bash
VITE_BACKEND_URL=http://localhost:8080/api
```

### 2. Install Packages
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application runs on `http://localhost:5173`. Ensure the Spring Boot backend is active on port `8080`.

---

## 4. State Management (Zustand Stores)

* **`useAuthStore`**: Maps authentication state. Persists user profile models (e.g., `username`, `email`) and active JWT tokens.
* **`useProjectStore`**: Coordinates current projects lists, active document uploads status, and handles RAG queries REST dispatches.

---

## 5. Troubleshooting & Debugging

* **CORS Network Errors**: If requests are blocked, ensure `CORS_ALLOWED_ORIGINS` is configured with `http://localhost:5173` in your Spring Boot env file.
* **Initials Missing**: Avatars generate initials from the registered `username`. If the user has a legacy account created without a username, the initials avatar fallback may fail. Verify the database `users` table has values in the `username` column.
