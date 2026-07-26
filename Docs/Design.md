# DESIGN.md — Phoenix Visual Design System

This document defines the governing visual design system for **Phoenix**. While the backend focuses on technical accuracy, the frontend design system is built to bridge the "trust gap" in AI systems by making the retrieval and reasoning process observable.

---

## 1. Design Philosophy: "Observable Intelligence"

Phoenix rejects the "magic black box" approach of modern chat interfaces. Every design decision must serve the principle of **Observable Intelligence**: the system should never provide an answer without proving where it came from and how hard it worked to find it.

### Core Principles:
*   **Transparency over Polish:** If the system is uncertain, the UI should reflect that tension. A "clean" UI that hides a low-confidence search is a failure.
*   **Source-First Hierarchy:** The answer and the sources are of equal visual weight. An answer without a visible citation is considered "incomplete."
*   **The Diagnostic Aesthetic:** The UI should feel like a high-end research tool or a debugger, not a social messaging app.
*   **No "Hidden" Logic:** Fallbacks, re-ranks, and query rewrites must be surfaced as part of the "Trace," not hidden in the background.

---

## 2. Visual Identity & Palette Options

Phoenix requires a distinct identity from standard "SaaS Blue." Below are three proposed directions.

### Option A: "The Laboratory" (Analytical & Clinical)
*   **Concept:** A clean, high-contrast light-mode default that feels like a scientific workbench.
*   **Palette:**
    *   **Base:** `#FFFFFF` (White) / `#F8FAFC` (Light Gray)
    *   **Accent:** `#0F172A` (Deep Slate Navy)
    *   **Logic Color:** `#F59E0B` (Amber 500) — Used for "System Thoughts" and Fallbacks.
*   **Typography:** Inter for UI; **IBM Plex Mono** for technical identifiers and confidence scores.

### Option B: "The Obsidian Trace" (Technical & Low-Strain)
*   **Concept:** A modern dark-mode terminal aesthetic that highlights code and configuration.
*   **Palette:**
    *   **Base:** `#09090B` (Zinc 950) / `#18181B` (Zinc 900)
    *   **Accent:** `#EF4444` (Crimson Red) — Used sparingly for system pulses.
    *   **Logic Color:** `#22C55E` (Emerald Green) — Used to show "Success Trace."
*   **Typography:** JetBrains Mono for all headers; System Sans for body text.

### Option C: "The Blueprint" (Architectural & Structured)
*   **Concept:** Uses grid-lines and blueprint-inspired colors to emphasize structure.
*   **Palette:**
    *   **Base:** `#1E293B` (Slate 800)
    *   **Accent:** `#38BDF8` (Sky Blue 400)
    *   **Logic Color:** `#E2E8F0` (Soft White) for the trace.
*   **Typography:** Space Grotesk for a modern, geometric feel.

---

## 3. Key Screens & Component Design

### 3.1 The Upload Canvas (Document Vault)
*   **Design:** A focused drop-zone. Once a file is dropped, the UI doesn't just show a progress bar; it shows a "Status Log" of the ingestion steps: `[Extracting Text] -> [Generating 154 Chunks] -> [Indexing Vectors]`.
*   **Goal:** To make the user aware of the *scale* of the data they are about to query.

### 3.2 The Reasoning Trace (The Differentiator)
*   **Problem:** How do you show "The system rewrote your query" without it feeling like the AI failed?
*   **Solution:** An "Expansion Timeline" that sits between the user's message and the AI's response.
    *   **Visual Treatment:** A subtle vertical line (breadcrumb style) showing the evolution:
        1.  🔍 `Original Query: "spring port"`
        2.  ⚙️ `Optimization: Expanded to "Spring Boot server port configuration"` (Confidence +15%)
        3.  🧬 `Hybrid Fusion: Vector (40%) + BM25 (60%)`
*   **Interaction:** Collapsed by default but pulses slightly when a fallback is triggered to invite inspection.

### 3.3 The Chat & Citation Matrix
*   **Layout:** Two-column layout on wide screens.
    *   **Left:** The Answer (Markdown).
    *   **Right:** The "Source Stack" — a vertical list of the exact chunks used, with relevance percentages and page numbers.
*   **Interaction:** Clicking a citation `[1]` in the text highlights the corresponding card in the Source Stack on the right.

---

## 4. Component Patterns

### 4.1 Confidence Badges
Confidence is mapped to a "Health Meter" pattern with four tiers:
*   **Green (> 0.75):** Solid green border, checkmark icon (Direct Answer).
*   **Yellow (0.50 - 0.75):** Dotted yellow border, "Optimized" icon (Query Rewriting).
*   **Orange (0.35 - 0.50):** Pulsing orange border, "Re-ranked" icon (Cross-Encoder Re-ranking).
*   **Red (< 0.35):** Solid red border, warning icon (Clarification Prompt).

### 4.2 Technical Citations
Instead of simple numbers like `[1]`, Phoenix uses **Contextual Tags**:
*   `[p.12 - YAML]` or `[p.4 - Java]`. This gives the user immediate feedback on what *kind* of information they are about to look at.

### 4.3 Loading States: "The Thinking Pulse"
Standard spinners are banned. While the AI Engine is working, the UI should render a **Stream of Tokens** or a "Scanned Chunks" counter that increments rapidly, showing the user the system is actively searching the vector space.

