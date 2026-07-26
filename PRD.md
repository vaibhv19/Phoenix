# Product Requirements Document (PRD): Project Phoenix

**Status:** Draft / Initial Concept  
**Version:** 1.0  
**Domain:** RAG for Technical Documentation (Spring Boot / AWS)

---

## 1. Executive Summary
Project Phoenix is an advanced Retrieval-Augmented Generation (RAG) platform designed specifically for high-precision technical documentation. Unlike standard RAG systems that often hallucinate or provide vague answers, Phoenix utilizes a **Hybrid Search** strategy and a **Self-Correcting Reasoning Engine**. It prioritizes transparency by showing the "why" behind its retrieval process and proactively asking for clarification when confidence is low.

## 2. Problem Statement
Technical documentation (e.g., Spring Boot configs, AWS IAM policies) requires exact-match precision. 
1. **Semantic Search Failures:** Vector-only search often misses specific error codes or configuration keys (e.g., `server.port` vs. `server.servlet.context-path`).
2. **The Black Box:** Users don’t know why an AI gave a specific answer or if it "guessed" based on low-quality data.
3. **Hallucination:** Systems often force an answer even when the documentation is missing the required info.

## 3. Goals & Objectives
*   **Precision:** Use Hybrid Search (Vector + BM25) to ensure exact technical terms are indexed and retrieved.
*   **Transparency:** Surface the system’s internal reasoning (fallback triggers) to the end-user.
*   **Reliability:** Implement a "Confidence Score" threshold to trigger query rewriting or user clarification.
*   **Scalability:** Separate concerns between a robust Java-based orchestration layer and a Python-based AI engine.

---

## 4. Target Audience
*   **Software Engineers:** Looking for specific configuration details or troubleshooting Spring Boot/AWS issues.
*   **DevOps/Cloud Architects:** Needing precise syntax for infrastructure-as-code or service limits.
*   **Technical Writers:** Verifying documentation coverage and accuracy.

---

## 5. Functional Requirements

### 5.1 Spring Boot API Layer (Orchestration)
*   **Authentication:** JWT-based login and session management.
*   **Project Management:** Ability to group documents into "Projects" (e.g., "Payment Service Docs").
*   **File Handling:** Secure upload of PDFs/Markdown; status tracking (Pending, Processing, Indexed).
*   **Internal Routing:** A RESTful contract to pass processed text and metadata to the Python AI engine.
*   **Persistence:** Store document metadata, user query history, and "Helpfulness" feedback in a relational database.

### 5.2 Python AI Engine (Intelligence)
*   **Hybrid Ingestion:** 
    *   Chunking strategy optimized for code blocks and technical lists.
    *   Dual-indexing: Dense embeddings (Vector) and Sparse embeddings (BM25/Keyword).
*   **The Retrieval Pipeline:**
    *   **Search:** Execute hybrid search and merge results using Reciprocal Rank Fusion (RRF).
    *   **Scoring:** Assign a confidence score to the retrieved context.
*   **Self-Correction Logic (The "Phoenix" Loop):**
    *   *If Score < Threshold:* Execute **Query Rewriting** (LLM rephrases the question to find better context).
    *   *If Score still low:* Execute **Re-ranking** across a wider pool of documents.
    *   *Final Fallback:* If no high-confidence data exists, return a "Confidence Alert" asking the user for clarification.

### 5.3 React Frontend (User Experience)
*   **Document Workspace:** Sidebar for managing uploaded docs and project settings.
*   **Transparent Chat:** 
    *   Display the final answer with **Inline Citations**.
    *   **Reasoning Panel:** A collapsible section showing: *"I initially searched for X, found low-quality results, so I reformulated the query to Y to find the specific config key."*
*   **Source Preview:** Clickable citations that highlight the relevant text in the original document.

---

## 6. Technical Architecture

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React, Tailwind CSS, Lucide Icons | UI/UX, Chat Interface, Transparency Logs |
| **Backend** | Spring Boot 3, Spring Security, JPA | Auth, CRUD, Document Orchestration, API Gateway |
| **AI Engine** | Python (FastAPI/LangChain/LlamaIndex) | Chunking, Hybrid Search, LLM Orchestration |
| **Vector Store** | Pinecone / pgvector / FAISS | Storing and searching technical embeddings |
| **Search** | BM25 + Vector (Hybrid) | Exact keyword matching + Semantic context |
| **LLM** | GPT-4o or Claude 3.5 Sonnet | Reasoning, Rewriting, and Synthesis |

---

## 7. Key Differentiators (The "Secret Sauce")
1.  **Hybrid Search over Vector-Only:** Essential for technical domains where `EnableAutoConfiguration` is a specific token that must be matched exactly, not just "semantically."
2.  **Explicit Fallback UI:** Instead of a generic "I don't know," the system explains its attempt: *"I found 3 documents mentioning 'S3', but none mentioned 'Cross-Region Replication'. Could you specify which AWS region you are using?"*
3.  **Source Attribution:** Every claim is backed by a specific chunk ID and document reference stored in the Spring Boot metadata layer.

---

## 8. Success Metrics
*   **Retrieval Accuracy:** % of queries where the correct technical document was in the Top 3 retrieved chunks.
*   **Hallucination Rate:** Measured by manual audit of "Confident" vs "Low Confidence" flagged answers.
*   **User Trust:** High engagement with the "Reasoning" panel.
*   **Latency:** End-to-end response time under 4 seconds (including potential query rewriting).

---

## 9. Roadmap
*   **Phase 1 (MVP):** Basic Spring Boot/Python integration, PDF upload, and standard RAG.
*   **Phase 2 (Hybrid):** Implementation of BM25 + Vector search and RRF.
*   **Phase 3 (Self-Correction):** Integration of Confidence Scoring and Query Rewriting logic.
*   **Phase 4 (UI Transparency):** Deployment of the Reasoning Panel and Source Highlighting in React.