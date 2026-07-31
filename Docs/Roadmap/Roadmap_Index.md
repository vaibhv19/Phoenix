# Phoenix — Master Engineering Playbook Index

This document serves as the canonical index and master directory for the **Phoenix Engineering Implementation Playbook**, a self-contained, developer-ready execution guide. 

Using this playbook, an engineer can build the complete Phoenix system from an empty workspace to a fully functioning local application without relying on external guides or undocumented development details.

Phoenix is built on a decoupled three-tier architecture:
1. **Spring Boot Orchestrator (`backend`)**: Manages logical user-project workspaces, handles JWT authorization, stores documents, and logs chat history.
2. **FastAPI Retrieval Engine (`ai-engine`)**: Implements PDF ingestion, Recursive character splitting, pgvector indexing, and executes dual-engine hybrid retrieval (Dense Vector + BM25).
3. **React Vite Console (`frontend`)**: Renders the document vault, interactive chat console, citation matrix, and collapsible vertical reasoning timelines.

---

## 1. Playbook Dependency Graph

The following graph maps the sequential execution dependencies across backend, frontend, and AI retrieval components. Establish service-to-service communication contracts before starting dependent integration layers.

```mermaid
graph TD
    %% Base Setup
    subgraph Setup [1. Environment Scaffold]
        P1[Phase 1: Project Setup & Docker DB]
    end

    %% Spring Boot Gateway
    subgraph SpringBoot [2. Orchestration & Security]
        P2[Phase 2: Database Schema & JWT Auth] --> P3[Phase 3: User-Tenant Isolation]
        P3 --> P4[Phase 4: Document Storage & Async Trigger]
    end

    %% Python Retrieval Engine
    subgraph AIEngine [3. Semantic Search Engine]
        P5[Phase 5: PDF Parser & pgvector Ingest] --> P6[Phase 6: WLC Hybrid Search]
        P6 --> P7[Phase 7: Clamped Confidence Scorer]
        P7 --> P8[Phase 8: 4-Tier Fallback State Machine]
    end

    %% React UI Console
    subgraph ReactUI [4. Interactive UI Portal]
        P9[Phase 9: React Client Console & Timelines]
    end

    %% E2E Testing & Release
    subgraph Verification [5. Verification & Audit]
        P10[Phase 10: JUnit, Pytest, & Hit Rate Benchmarks]
        P11[Phase 11: Flat Knowledge Base & Sweeps]
    end

    %% Cross-Project Dependencies
    P1 --> P2
    P1 --> P5
    
    %% API Contracts
    P5 --> P4 %% FastAPI /ingest contract binds to Spring Boot caller
    P8 --> P4 %% FastAPI /process contract binds to Spring Boot caller
    
    %% UI to API
    P2 --> P9 %% Auth APIs bind to Zustand store
    P4 --> P9 %% Chat query APIs bind to UI layout
    
    P4 --> P10
    P8 --> P10
    P9 --> P10
    P10 --> P11
```

---

## 2. Playbook Phases & Directory Mappings

The playbook contains 11 self-contained engineering guides detailing prerequisites, setup, implementation paths, verification commands, and troubleshooting tips.

| Playbook Phase | File Reference | Objective & Key Implementation Details |
| :--- | :--- | :--- |
| **Phase 1** | [Phase_01_Project_Setup.md](Phase_01_Project_Setup.md) | Initialize Docker pgvector container and bootstrap the `backend/`, `ai-engine/`, and `frontend/` skeletons. |
| **Phase 2** | [Phase_02_Authentication.md](Phase_02_Authentication.md) | Implement Spring Security, stateless JWT filters, BCrypt hashing, and Flyway `users` table schemas. |
| **Phase 3** | [Phase_03_Projects.md](Phase_03_Projects.md) | Enforce logical tenant boundaries by validating project owner IDs and programmatically cleaning up physical files. |
| **Phase 4** | [Phase_04_Document_Upload.md](Phase_04_Document_Upload.md) | Save uploaded PDFs, restrict file traversal attacks, and trigger FastAPI async ingestion tasks using Spring Boot `@Async`. |
| **Phase 5** | [Phase_05_Python_AI_Engine.md](Phase_05_Python_AI_Engine.md) | Parse PDFs page-by-page, split text recursively, generate embeddings, and resolve SQLAlchemy metadata collisions. |
| **Phase 6** | [Phase_06_Hybrid_Retrieval.md](Phase_06_Hybrid_Retrieval.md) | Run dense cosine searches (pgvector cast to Float) and BM25 keywords in parallel, fusing scores via MinMaxScaler. |
| **Phase 7** | [Phase_07_Confidence_Scoring.md](Phase_07_Confidence_Scoring.md) | Calculate Composite Confidence Score ($CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$), clamping outputs to $[0, 1]$. |
| **Phase 8** | [Phase_08_Fallback_Strategies.md](Phase_08_Fallback_Strategies.md) | Execute the 4-tier routing state machine (Rewrite $\to$ FlashRank rerank $\to$ Support Clarification) using Ollama local models. |
| **Phase 9** | [Phase_09_React_Frontend.md](Phase_09_React_Frontend.md) | Build Zustand store routers, document upload progress lines, citation highlights, and staggered timeline animations. |
| **Phase 10** | [Phase_10_Testing.md](Phase_10_Testing.md) | Run JUnit integration tests, pytest units, and execute the Property Key Sensitivity benchmark test suite. |
| **Phase 11** | [Phase_11_Documentation.md](Phase_11_Documentation.md) | Audit codebase for TODO comments, verify relative links, and document deep dives in the flat learning catalog. |

---

## 3. Milestones & Verification Checkpoints

Use the following checkpoints to verify your progress at major development milestones:

### Milestone 1: Local Infrastructure & Secure Access (Phases 1–2)
*   **Runnable Check**: Docker pgvector responds to SQL queries, and the backend service compiles.
*   **Verification**: Make a POST request to `/api/auth/register` and verify a JWT is returned. Request `/api/projects` without a token and assert a JSON 401 response is returned.

### Milestone 2: Logical Workspaces & Ingestion Pipeline (Phases 3–5)
*   **Runnable Check**: Spring Boot uploads file to storage folder and asynchronously invokes FastAPI `/internal/v1/ingest`.
*   **Verification**: Check that database status transitions: `PROCESSING` $\to$ `READY`, and that chunks appear in the `document_chunks` table containing float arrays.

### Milestone 3: Neural Search, Confidence, & Fallbacks (Phases 6–8)
*   **Runnable Check**: AI engine runs vector similarity and BM25 queries, blends scores, and processes fallback transitions.
*   **Verification**: Execute POST `/internal/v1/process`. When search confidence is low, verify that Ollama rewrites the query or generates a support clarification question.

### Milestone 4: Fused UI & Observable Trace (Phase 9)
*   **Runnable Check**: React client displays vault tables, chat consoles, and timeline dropdowns.
*   **Verification**: Ask RAG questions in the UI. Confirm HSL badges reflect confidence categories and timeline elements stagger expand.

---

## 4. Git Commit Standards

To maintain clean and auditable revision histories, use atomic commits matching the following conventions:
- `setup: docker database and folder structures` (Phase 1)
- `feat(auth): add spring security configuration and jwt filters` (Phase 2)
- `feat(project): implement project CRUD and tenant validation` (Phase 3)
- `feat(document): add storage services and async trigger logic` (Phase 4)
- `feat(ingest): build pdf parser and pgvector persistence` (Phase 5)
- `feat(rag): code hybrid retrieval MinMaxScaler fusion` (Phase 6)
- `feat(confidence): implement composite scoring algorithm` (Phase 7)
- `feat(fallback): write decision state machine and flashrank` (Phase 8)
- `feat(ui): implement chat bubbles and staggered timelines` (Phase 9)
- `test: add integration test suite and sensitivity benchmark` (Phase 10)
- `docs: audit links and compile developer guides` (Phase 11)
