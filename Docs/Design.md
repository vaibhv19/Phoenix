# Visual Design Specification: Phoenix

This document defines the user interface layout patterns, typographic standards, and color tokens implemented in **Phoenix**. 

The UI is styled not as a generic chatbot, but as a **dense, technical investigation workspace** echoing developer utilities like GitHub, Cursor, and Linear.

---

## 1. Core Styling Architecture & Tokens

Phoenix utilizes a highly restrained color scheme. Accent colors are used strictly to communicate state rather than decoration.

### 1.1 Color Palette Mappings
Our UI tokens map directly to Tailwind configs and the global [index.css](../frontend/src/index.css) declarations:

* **App Background**: `#09090B` (Zinc 950) — Set as the default HTML body background.
* **Muted Surface Panel (`.glass-panel`)**: `#0C0C0E` (Zinc 900) — Used for layout dividers, sidebars, and control headers.
* **Component Card Surface (`.glass-card`)**: `#161618` (Zinc 850) — Used for message bubbles, document cards, and input zones.
* **Low-Contrast Borders**: `#27272A` (Zinc 800) — Used for structural borders.
* **Primary Text**: `#F4F4F5` (Zinc 100) — Default readability text.
* **Secondary Muted Text**: `#94A3B8` (`brand.textMuted` / Zinc 400) — Used for metadata descriptions.

### 1.2 State Accent Colors
Accents correspond to query confidence tiers:
* **Active Accent / Selection**: `#3B82F6` (Blue 500) — Active tabs, buttons.
* **High Confidence / Success State**: `#10B981` (Emerald 500) — Confidence score $\ge 0.75$.
* **Marginal Confidence / Processing State**: `#F59E0B` (Amber 500) — Confidence score $0.50 \le CS < 0.75$.
* **Low Confidence / Reranked State**: `#F97316` (Orange 500) — Confidence score $0.35 \le CS < 0.50$.
* **Aborted Retrieval / Error State**: `#EF4444` (Red 500) — Confidence score $< 0.35$ or processing error.

---

## 2. Typography & Fonts

* **Primary Body Interface**: `Inter` (sans-serif) — Clean, highly legible proportional font optimized for small text sizes.
* **Technical Output**: `JetBrains Mono` / `IBM Plex Mono` (monospace) — Used for citations, relevance scores, parameters, and logs to emphasize technical precision.

---

## 3. UI Views & Interface Layout

### 3.1 Workspace Sidebar & Identity Card
* Spaced with a dense grid to maximize screen real estate.
* Displays projects, document status notifications, and the user profile card.
* **Username Avatars**: Rather than displaying full email strings, the sidebar utilizes a user card showing the registered `username` (e.g. `vaibhav`). The user profile avatar displays a two-character initials block parsed dynamically from the `username` (e.g. `"vaibhav"` -> `VA`, `"john_doe"` -> `JD`).

### 3.2 Split-Screen Console Workspace
The chat workspace splits into two interactive columns:
1. **Left Panel: Conversational Console**:
   * *Landing State*: Renders active project metadata (document count, chunk size, indexes) and sample queries instead of generic welcoming copy.
   * *Chat Flow*: Renders messages inside zinc cards, featuring collapsible system thought logs.
2. **Right Panel: Citation & Diagnostic Matrix**:
   * Displays the detailed citation matrix. When a user clicks a citation in the chat panel, the corresponding source text chunk flashes using the `.animate-pulse-highlight` utility to ensure complete visibility.

### 3.3 Collapsible Console Trace Timeline
* Mimics an IDE build trace log.
* Rendered inside a monospace panel, utilizing simple vertical connection lines and small color-coded step status indicator circles.

---

## 4. UI Transition Animations

Phoenix bans bouncing, scaling, or floating animation effects, sticking strictly to subtle, high-performance transitions:
* **`.animate-fade-in`**: Subtle scale (`98%` to `100%`) and opacity fade for landing tabs and panels.
* **`.animate-slide-in`**: Slight upward slide (`0.5rem` to `0`) and opacity fade for chat bubbles.
* **`.animate-pulse-highlight`**: Flashes the matching citation card border and background to draw attention to the source text.
