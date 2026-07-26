# Phoenix — Master Implementation Roadmap Index

This document acts as the authoritative index and master blueprint for the step-by-step implementation of **Phoenix**, a portfolio-quality Hybrid RAG (Retrieval-Augmented Generation) system over technical documentation. 

Phoenix is designed as a three-tier decoupled architecture:
1. **Spring Boot API (Backend Orchestration)**: Handles user, project, document metadata, audit history, security, and internal service handoff.
2. **Python AI Engine (FastAPI Service)**: Manages PDF ingestion (parsing, chunking, embeddings), hybrid search (pgvector + BM25), score fusion (WLC + MinMaxScaler), and fallback execution (expansion, Cross-Encoder re-ranking, and clarification).
3. **React Client (Frontend UI)**: Implements the user portal, document vault, and interactive chat interface with source citations and a transparent Reasoning Trace timeline panel.

---

## 1. Master Dependency Graph

The following graph maps the sequential dependencies across repositories (Spring Boot, Python FastAPI, and React). Crucially, cross-service contracts must be established before dependent service integrations are implemented.

```mermaid
graph TD
    %% Base Infrastructure
    subgraph Base [Infrastructure & Setup]
        P1[Phase 1: Project Setup]
    end

    %% Spring Boot Branch
    subgraph SB [Spring Boot Orchestration]
        P2[Phase 2: Database Schema & Entities] --> P3[Phase 3: Authentication & Security]
        P3 --> P4[Phase 4: Document & Project Management]
    end

    %% Python AI Engine Branch
    subgraph PY [Python AI Retrieval Engine]
        P5[Phase 5: Ingestion Pipeline & Embeddings] --> P6[Phase 6: WLC Hybrid Search]
        P6 --> P7[Phase 7: Confidence Scoring Model]
        P7 --> P8[Phase 8: Fallback State Machine]
    end

    %% React Client Branch
    subgraph RX [React Client Interface]
        P9[Phase 9: React UI Development]
    end

    %% Cross-Repository Dependencies
    P1 --> P2
    P1 --> P5
    
    %% API Specification dependencies
    P5 --> P4 %% Ingest endpoint contract must exist before Spring Boot calls it
    P8 --> P4 %% Process endpoint contract must exist before Spring Boot calls it
    
    %% Client-Server dependencies
    P3 --> P9 %% Authentication API must exist before React Auth integration
    P4 --> P9 %% Document & Chat query API must exist before React UI screens
    
    %% Testing & Release
    subgraph Verification [Verification & Audit]
        P10[Phase 10: E2E Testing]
        P11[Phase 11: Documentation & Audit]
    end
    
    P4 --> P10
    P8 --> P10
    P9 --> P10
    P10 --> P11
```

---

## 2. Phase-by-Phase Development Roadmap

The roadmap is structured into 11 sequential phases. Each phase is documented in its own markdown file containing the package layout, component structures, API contracts, and atomic implementation tasks.

| Phase | Relative Link | Summary | Estimated Complexity |
| :--- | :--- | :--- | :--- |
| **Phase 1** | [Phase_01_Project_Setup.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_01_Project_Setup.md) | Initialize project repositories, build skeletons, configurations, and Docker database infrastructure. | Low |
| **Phase 2** | [Phase_02_Authentication.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_02_Authentication.md) | Implement JWT authentication, Spring Security filters, and session management. | Medium |
| **Phase 3** | [Phase_03_Projects.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_03_Projects.md) | Create user-tenant Project bounds and manage logical metadata isolation. | Low |
| **Phase 4** | [Phase_04_Document_Upload.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_04_Document_Upload.md) | Handle physical file uploads, Spring storage abstraction, and handoff to the AI Engine. | Medium |
| **Phase 5** | [Phase_05_Python_AI_Engine.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_05_Python_AI_Engine.md) | Setup FastAPI, configure `RecursiveCharacterTextSplitter` and `pgvector` store. | Medium |
| **Phase 6** | [Phase_06_Hybrid_Retrieval.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_06_Hybrid_Retrieval.md) | Build WLC fusion (`Sim_vector` + normalized BM25 with `MinMaxScaler`). | High |
| **Phase 7** | [Phase_07_Confidence_Scoring.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_07_Confidence_Scoring.md) | Code the Composite Confidence Score ($CS$) using MaxSim and Agreement. | Medium |
| **Phase 8** | [Phase_08_Fallback_Strategies.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_08_Fallback_Strategies.md) | Build the 4-tier state machine (Rewrite -> Re-rank via FlashRank -> Clarify). | High |
| **Phase 9** | [Phase_09_React_Frontend.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_09_React_Frontend.md) | Develop the Vault, Chat interface, vertical timeline, and Citation Matrix. | High |
| **Phase 10** | [Phase_10_Testing.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_10_Testing.md) | Execute end-to-end integration flows, including Property Key Sensitivity Tests. | Medium |
| **Phase 11** | [Phase_11_Documentation.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Roadmap/Phase_11_Documentation.md) | Compile developer study notes, setup documentation audits, and finalize READMEs. | Low |

---

## 3. Milestones & Checkpoints

Milestones represent stable, runnable checkpoints for a single developer working sequentially.

### Milestone 1: Local Infrastructure & Authentication (Phases 1–2)
*   **Expected Completed Functionality**: Dockerized Postgres (`pgvector` + metadata tables) active, Spring Boot security filter configured, register/login endpoints functional.
*   **Demonstrable**: Requesting a JWT token with valid credentials via Postman; verifying invalid credentials return `401 Unauthorized`.
*   **Testable**: Unit tests for `UserRepository`, `PasswordHashing`, and integration tests for JWT authentication filter.
*   **Remaining Incomplete**: Document uploads, AI Engine connections, React frontend.

### Milestone 2: Metadata & Ingestion Pipeline (Phases 3–5)
*   **Expected Completed Functionality**: Document vault file persistence active on disk; Spring Boot makes HTTP callback to FastAPI `/internal/v1/ingest`; FastAPI splits PDF and populates `pgvector` chunks.
*   **Demonstrable**: Uploading a PDF via curl; checking that the database updates from `PROCESSING` to `READY` and that raw chunks appear in the Postgres database.
*   **Testable**: Integration test mocking the FastAPI `/ingest` service; unit tests for `RecursiveCharacterTextSplitter`.
*   **Remaining Incomplete**: Hybrid search, confidence scoring, fallback state machine, React UI.

### Milestone 3: AI Retrieval Engine (Phases 6–8)
*   **Expected Completed Functionality**: Python engine executes Vector + BM25 parallel search, applies `MinMaxScaler` normalization, performs WLC score fusion, calculates Composite Confidence, and executes Fallback tiers.
*   **Demonstrable**: Sending test queries directly to FastAPI `/internal/v1/process`; observing fallback actions (e.g. Query Rewrite) logged in the returned `reasoningTrace` when confidence is simulated as marginal.
*   **Testable**: Mathematical unit tests verifying `MinMaxScaler` outputs bound BM25 raw scores to $[0, 1]$; test case assertion for fallback state transition bounds.
*   **Remaining Incomplete**: React UI, Spring Boot chat history logs.

### Milestone 4: Full Stack & Visual Trace (Phase 9)
*   **Expected Completed Functionality**: React client integrated with Spring Boot APIs. Document uploading from UI vault; chat interaction retrieves source list and displays the collapsible vertical timeline.
*   **Demonstrable**: A user uploading a Spring Boot configuration PDF, searching for an exact configuration key, viewing the `Framer Motion` system thought animation, and verifying citations link to document snippets.
*   **Testable**: Component unit tests using React Testing Library; validation of JWT storage in Zustand.
*   **Remaining Incomplete**: Final E2E performance sweeps, final user documentation.

---

## 4. Suggested Git Commit Boundaries

To ensure codebase auditability and atomic history, use the following commit guidelines:
*   `docs: update <file>`: (For this initial documentation sweep phase).
*   `setup: initialize <service> skeleton`: Run at the end of Phase 1.
*   `feat(auth): implement <component>`: Separated by entity, repository, service, and controller tasks.
*   `feat(ingest): implement character splitting`: Separated by extractor, chunker, and database storage modules.
*   `feat(rag): implement normalized hybrid fusion`: Once the MinMaxScaler and WLC formulas are tested.
*   `feat(fallback): integrate FlashRank re-ranking`: Upon completing the orange-tier logic.
*   `feat(ui): build reasoning trace timeline`: Once Framer Motion animations and state controllers match.

---

## 5. Suggested GitHub Issues & Epics

### Epic 1: Orchestration & Security Core
*   **Goal**: Establish PostgreSQL persistence and secure communication boundaries.
*   **Issues**:
    *   *Issue 1.1*: Initialize Docker Compose PostgreSQL local instance.
    *   *Issue 1.2*: Implement Hibernate database entity mapping.
    *   *Issue 1.3*: Configure Spring Security and custom JWT filter.

### Epic 2: PDF Ingestion Engine
*   **Goal**: Extract, chunk, embed, and index technical PDF files.
*   **Issues**:
    *   *Issue 2.1*: Develop Spring Boot StorageService and UploadController.
    *   *Issue 2.2*: Build FastAPI PDF extractor and chunking module.
    *   *Issue 2.3*: Implement pgvector integration and chunk persistence.

### Epic 3: Advanced Hybrid RAG Retriever
*   **Goal**: Mathematically combine Vector & keyword queries with fallback safety rails.
*   **Issues**:
    *   *Issue 3.1*: Code BM25 Search & MinMaxScaler normalization.
    *   *Issue 3.2*: Create Composite Confidence Score ($CS$) calculator.
    *   *Issue 3.3*: Write Fallback State Machine controller (Rewriting, FlashRank, Clarification).

### Epic 4: Observable UI Portal
*   **Goal**: React components for document vault and transparent chat.
*   **Issues**:
    *   *Issue 4.1*: Develop Document Vault dashboard and upload hooks.
    *   *Issue 4.2*: Build Chat bubble and Citation Matrix sidebar.
    *   *Issue 4.3*: Design collapsible vertical reasoning trace timeline.
