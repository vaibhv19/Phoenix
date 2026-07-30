# Phoenix — Transparent Self-Healing Hybrid RAG Workspace

Phoenix is a **Transparent Self-Healing Hybrid RAG** system designed specifically for technical documentation (such as codebase references, configuration properties, and API manuals). 

Built using **Spring Boot 3.3.x**, **FastAPI**, and **React 19**, Phoenix bridges the "trust gap" inherent in black-box AI retrieval systems by making the entire retrieval, scoring, reranking, and fallback process fully observable and traceable for engineers.

---

## 1. Problem Statement

Traditional Retrieval-Augmented Generation (RAG) systems fail in technical workspaces for three key reasons:

* **The Alphanumeric Precision Gap**: Pure semantic vector search (cosine similarity on dense embeddings) frequently misses exact-match property keys, configuration properties (such as `spring.jpa.hibernate.ddl-auto`), or error codes, returning conceptually related but incorrect contexts.
* **The "Black Box" Trust Gap**: When an AI answers incorrectly, developers cannot diagnose whether the breakdown occurred during database retrieval, fusion, reranking, or LLM synthesis.
* **Hallucinations on Weak Context**: Generic RAG systems attempt to generate answers even when search matches return zero relevant context.

**Phoenix resolves these issues by combining a hybrid search engine with a self-healing fallback state machine, while rendering the entire pipeline's reasoning path in real-time.**

---

## 2. Key Architecture & Features

### 🧭 Self-Healing Fallback Orchestration
A FastAPI-driven orchestrator state machine dynamically manages query degradation. If initial retrieval scores are weak, the system automatically rewrites queries, escalates to Cross-Encoder reranking, or falls back to interactive clarification prompts to avoid hallucinations.

### 🔍 Hybrid Retrieval Engine
Combines semantic dense vector search (PostgreSQL `pgvector` with `all-MiniLM-L6-v2`) and sparse keyword search (Custom Tokenizer + `BM25` ranking) using a Weighted Linear Combination (WLC) MinMaxScaler score fusion ($\alpha=0.7$).

### 📊 Agreement Confidence Matrix
Calculates semantic consensus across retrieved text segments. By evaluating MaxSim metrics and agreement scores among top chunks, the engine quantifies response reliability before synthesis occurs.

### 🛠️ Visual Reasoning Trace
An interactive, collapsible timeline that maps the exact lifecycle of a query. Developers can inspect routing paths, query rewrites, raw cosine similarities, BM25 scores, and final confidence levels in a terminal-like build log.

### 🔒 Secure Multi-Tenancy
Row-level JPA query boundaries and Spring Security token interceptors ensure absolute project separation. Users can only search, upload, or manage documents within their own workspace namespaces.

---

## 3. Technology Stack

* **Frontend Console**: React 19 (Vite compilation), Zustand, Tailwind CSS, Framer Motion, react-markdown.
* **API Gateway Service**: Java 21, Spring Boot 3.3.1, Spring Security, Hibernate ORM, Flyway Schema Migrations.
* **AI & Retrieval Engine**: Python 3.11, FastAPI, SQLAlchemy ORM, `pgvector`, `SentenceTransformers` (all-MiniLM-L6-v2), `rank_bm25` (Okapi model), `FlashRank` Cross-Encoder (`ms-marco-MiniLM-L-6-v2`).
* **Database & Infrastructure**: PostgreSQL 16, Docker Compose, Ollama Local Server (running `mistral`).

---

## 4. Repository Structure

```text
phoenix/
├── backend/          # Spring Boot: Security filters, project namespaces, document ingestion tasks
├── ai-engine/        # FastAPI: Embedding pipelines, WLC fusions, fallback orchestrators
├── frontend/         # React SPA: Workspace UI stores, timeline renders, citation matrices
└── Docs/             # Production-grade engineering docs and living knowledge wiki
```

---

## 5. Setup & Running Locally

### Prerequisites
* Docker & Docker Compose
* Java JDK 21
* Node.js 18+ (npm)
* Python 3.11+
* Ollama Local Server (running `mistral` model)

### 1. Launch Database Container
```bash
docker compose up -d
```

### 2. Configure & Run FastAPI Engine
```bash
cd ai-engine
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Unix/macOS
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Build & Run Spring Boot Gateway
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. Initialize React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Complete Documentation Index

All core architecture, database schemas, and engineering specifications are kept in the `/Docs` directory:

| Document Category | Target Specification | Reference File Link |
|---|---|---|
| **Product Planning** | Core requirements, target personas, and scope bounds. | [PRD.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/PRD.md) |
| **System Features** | Functional API, AI, and client specifications. | [Feature_List.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Feature_List.md) |
| **Infrastructure Stack** | Software dependencies and versions matrix. | [Tech%20Stack.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Tech%20Stack.md) |
| **Execution Flow** | Sequence lifecycles and fallback diagrams. | [AppFlow.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/AppFlow.md) |
| **Visual Design** | Color tokens, panel layouts, and CSS classes. | [Design.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Design.md) |
| **Core RAG Logic** | Mathematical fusions and state orchestrations. | [RAG_Architecture.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/RAG_Architecture.md) |
| **API Contract** | Gateway REST specifications and payload DTO shapes. | [API_Specification.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/API_Specification.md) |
| **Data Schema** | Shared PostgreSQL and pgvector ERD models. | [DB_Schema.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/DB_Schema.md) |
| **Security Framework** | Cryptography, filters, and attack mitigations. | [Security.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Security.md) |
| **Dependency Strategy**| Ollama, embeddings, and database providers configurations. | [Provider_Strategy.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Provider_Strategy.md) |
| **Future Streaming** | Planned STOMP WebSocket interface specifications. | [WebSocket_Architecture.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/WebSocket_Architecture.md) |
| **Exceptions & Resiliency**| Global handlers, timeouts, and JSON error structures. | [Error_Handling.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Error_Handling.md) |
| **Testing Strategy** | Integration validation and hit-rate benchmarking. | [Testing_Strategy.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Testing_Strategy.md) |
| **Knowledge Wiki** | Consolidated design decisions and guides. | [Engineering_Knowledge_Base.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Engineering_Knowledge_Base.md) |
| **Release Management** | Release notes, milestones, and system limitations. | [Release_Notes.md](file:///d:/Coding/Projects----For%20Resume/Phoenix/Docs/Release_Notes.md) |