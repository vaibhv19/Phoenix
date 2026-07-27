# DESIGN.md — Phoenix Visual Design System

This document defines the visual design system for **Phoenix**. Phoenix is styled not as a simple AI chatbot, but as a **technical document investigation workspace**. The user interface is designed to resemble professional, precise developer utilities (such as Linear, GitHub, Cursor, and Notion).

---

## 1. Design Philosophy: "Precise Investigation"

Phoenix rejects flashy, neon, and illustrative chatbot dashboards. The interface is optimized to evoke clarity, evidence, confidence, traceability, and developer productivity.

### Core Principles:
*   **Calm & Restrained Surface**: The interface uses a neutral color palette. Backgrounds are deep charcoal and solid zinc; borders are low-contrast lines; and margins are compact.
*   **Density & Screen Utility**: Gaps and excessive whitespace are reduced. Screen area is maximized for document inspection, markdown answers, and technical matrices.
*   **Evidence & Citations First**: The system emphasizes citations. Source files, page numbers, and exact code chunks are prioritized over decorative chatbot borders.
*   **Muted Interaction**: Animations are subtle (opacity fades or slight transitions); no bouncy, scaling, or floating effects are allowed.

---

## 2. Design Tokens & Palette

Phoenix utilizes a highly restrained color scheme. Accent colors are used strictly to communicate state rather than decoration.

### Neutral Colors
*   **App Background**: `#09090B` (Zinc 950)
*   **Surface Panels**: `#0C0C0E` (Zinc 900 / Neutral Charcoal)
*   **Card Surfaces**: `#161618` (Zinc 850)
*   **Border Separators**: `#27272A` (Zinc 800)
*   **Primary Text**: `#F4F4F5` (Zinc 100)
*   **Secondary Text**: `#A1A1AA` (Zinc 500)
*   **Muted Text**: `#71717A` (Zinc 400)

### State Accent Colors
*   **Active States**: `#3B82F6` (Blue 500) — Used for highlighting current project tabs, selection circles, or active navigation items.
*   **Verified Source / Green**: `#10B981` (Emerald 500) — Used for confidence scores $\ge 0.75$ and success statuses.
*   **Self-Corrected / Yellow**: `#F59E0B` (Amber 500) — Used for confidence scores $0.50 \le CS < 0.75$ and processing statuses.
*   **Reranked / Orange**: `#F97316` (Orange 500) — Used for confidence scores $0.35 \le CS < 0.50$.
*   **Clarified / Red**: `#EF4444` (Red 500) — Used for confidence scores $< 0.35$ and failed operations.

### Typography
*   **UI / Body Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`, sans-serif (clean, sans-serif readability, reduced font weight variation).
*   **Technical / Code Font**: `JetBrains Mono`, `IBM Plex Mono`, monospace (used for config keys, code snippets, relevance ratios, and logs).

---

## 3. UI Workspaces & Screens

### 3.1 Workspace Sidebar
*   The sidebar acts as a technical navigator, not a dashboard menu.
*   Uses a dark background (`#09090B`), solid borders, and tight item spacing.
*   Active navigation items are styled with subtle background highlights and border accents (no heavy gradients).

### 3.2 Chat Workspace & Empty State
*   **Initial Landing State**: Before querying, the console displays a **project-focused diagnostic summary** instead of generic welcome screens:
    - Lists active project metadata (document count, chunk count, index health status).
    - Lists current documents loaded in the project.
    - Offers suggested technical questions based directly on the loaded documents.
*   **The Right Panel (Diagnostic Context)**:
    - *Before Queries*: Displays diagnostic metrics of the active project (indexing timestamps, DB status, system model settings).
    - *During Queries*: Scrolls source citations, page matches, and confidence metrics cleanly.

### 3.3 Reasoning Trace & Timelines
*   Surfaced as a collapsable timeline that mimics a build/execution console log.
*   Uses monospace text, simple vertical lines, and small step numbers.

### 3.4 Citation Matrix
*   Displays matching code blocks inside monospace code views with relevance score percentages (e.g. `98%`).
*   Borders highlight on matrix selection to ensure seamless traceability.
