# Tech Stack Specification: Phoenix

This document details the technical specifications and architectural rationales for **Phoenix**. The stack is selected to highlight the integration between high-performance Java services and Python-based AI orchestration, specifically optimized for local execution and hybrid search transparency.

---

## 1. Backend Orchestration (Spring Boot API)

| Technology | Version | Rationale |
| :--- | :--- | :--- |
| **Java (JDK)** | `21` | Utilizes Virtual Threads for non-blocking I/O when wait-states occur during Python AI engine REST calls. |
| **Spring Boot** | `3.3.1` | Provides a robust framework for RESTful services, security, and transaction management. |
| **Spring Security** | `6.x` | Implements stateless JWT authentication to manage user sessions without server-side state. |
| **Spring Data JPA** | `3.x` | Standardizes data access to PostgreSQL for document metadata and query history. |
| **Bean Validation** | `Hibernate Validator` | Enforces API contract integrity at the controller level (e.g., file size limits, required query fields). |
| **Pagination** | `Spring Data Pageable` | Simplifies the management of large query history logs and document lists for frontend performance. |

---

## 2. AI & Retrieval Engine (Python)

| Technology | Version | Rationale |
| :--- | :--- | :--- |
| **Language** | `Python 3.11` | Balancing library stability (LangChain/PyTorch) with modern async performance. |
| **Web Framework** | `FastAPI` | Asynchronous by default; provides automatic OpenAPI documentation and faster request/response cycles than Flask. |
| **RAG Framework** | `LangChain` | Offers granular control over the "Retriever" interface, essential for implementing custom Hybrid (Vector + BM25) logic. |
| **Chunking** | `RecursiveCharacterTextSplitter` | Intelligently splits technical text based on structural markers (newlines, periods) to preserve context. |
| **Embedding Model** | `all-MiniLM-L6-v2` | A lightweight, local transformer model that provides sufficient semantic density for a demo without API costs or latency. |
| **Keyword Search** | `rank_bm25` | Implements the industry-standard BM25 algorithm to capture exact technical identifiers (e.g., `application.yml` keys). |
| **Re-ranking** | `FlashRank` | An ultra-lightweight Cross-Encoder used to re-score the combined Vector + BM25 results with minimal CPU overhead. |

---

## 3. Frontend Client (React)

| Technology | Version | Rationale |
| :--- | :--- | :--- |
| **Framework** | `React 19` | Leverages the latest concurrent rendering features for a responsive, real-time chat experience. |
| **Build Tool** | `Vite` | Provides a significantly faster development experience (HMR) and optimized build chunks compared to CRA. |
| **State Management** | `Zustand` | Offers a minimalist, store-based state management that is easier to debug and scale for chat-heavy applications. |
| **UI Components** | `Tailwind CSS` | Enables rapid, utility-first styling for complex data-dense layouts like the "Reasoning Panel." |
| **Markdown Display** | `react-markdown` | Correctiy renders LLM output, ensuring technical code blocks and citations are legible. |
| **Visual Indicators** | `Framer Motion` | Used specifically to animate the "System Thought" transitions, making fallback logic visual for the user. |

---

## 4. Data & Local Infrastructure

| Storage Layer | Technology | Context |
| :--- | :--- | :--- |
| **Primary Database** | `PostgreSQL 16` | Standard relational storage for users, metadata, and audit logs. |
| **Vector Extension** | `pgvector` | Enables vector similarity searches directly within SQL, allowing for complex Joins between metadata and vectors. |
| **Containerization** | `Docker Compose` | Manages the orchestration of the Spring API, FastAPI, and Postgres services in a unified local network. |

---

## 5. Architectural Rationales: The "Interview" Defense

### 5.1 Why `pgvector` over Pinecone or FAISS?
For a portfolio project focused on **transparency and integration**, `pgvector` is the superior choice for three reasons:
1.  **Reduced Complexity:** It eliminates the need for a third service. I can manage document metadata (Spring Boot) and document embeddings (Python) in the same database instance.
2.  **Hybrid Querying:** Unlike FAISS, which is a flat-file index, `pgvector` allows me to write a single SQL query that filters by `user_id` or `upload_date` *while* performing a vector similarity search. 
3.  **Real-World Pattern:** Most enterprises are moving toward "Vector-enabled relational databases" to avoid the data consistency issues inherent in syncing a separate vector store like Pinecone.

### 5.2 Hybrid Search (Vector + BM25) vs. Vector-Only
Vector search is great for "What is the general concept of X?" but fails at "Where is the `config.datasource.url` property defined?" because embeddings often squash specific alphanumeric strings into similar vector spaces. By using `rank_bm25` in parallel, I ensure that if a user types an exact technical term, it is prioritized regardless of its semantic embedding.

### 5.3 The "Reasoning Panel" Strategy
Rather than hiding the RAG complexity, the React frontend is designed to "show the work." When a confidence score falls below a threshold (e.g., 0.75), the UI doesn't just show a fallback answer; it triggers a **Framer Motion** animation that reveals the system's internal decision to rewrite the query. This demonstrates **graceful uncertainty**, a key requirement for production-grade AI.
