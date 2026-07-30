# Phoenix Engineering Learning Library

This directory contains conceptual guides and deep-dive technical notes detailing the design and implementation of the **Phoenix** sub-systems.

---

## 1. Study Notes Catalog

| Conceptual Guide | Target Core System | Description / Focus |
|:---|:---|:---|
| **[Confidence Scoring Engine](confidence_scoring.md)** | Retrieval Certainty | MaxSim similarity calculations and Agreement consensus overlap formulas. |
| **[Document Upload Lifecycle](document_upload_lifecycle.md)** | Ingestion Flow | Multipart uploads, Spring file storage handlers, and async REST handoffs. |
| **[Embedding Pipeline](embedding_pipeline.md)** | NLP Vector Engine | Text extraction, recursive character splitting, and dense float vector generation. |
| **[Fallback State Machine](fallback_state_machine.md)** | Self-Healing Routing | 4-tier decision workflow orchestrator (query rewrites, FlashRank, clarifications). |
| **[Frontend Architecture](frontend_architecture.md)** | UI Console | Zustand store structures, layout grids, and interactive citation highlights. |
| **[Hybrid Retrieval Engine](hybrid_retrieval.md)** | Search & Retrieval | Parallel execution of dense vectors and BM25 search fused via WLC. |
| **[Infrastructure & Database](infrastructure_and_database.md)** | Data Layer | Shared PostgreSQL database layout and pgvector HNSW configurations. |
| **[LLM & Reranking Pipeline](llm_and_reranking_pipeline.md)** | LLM Inference | local Ollama prompt orchestrations and Cross-Encoder CPU rerankings. |
| **[Project Tenant Isolation](project_tenant_isolation.md)** | Security / Multi-Tenancy | High-security user boundary mappings and project cascading cleanups. |
| **[Testing & Benchmarking](testing_and_benchmarking.md)** | System Validation | Hit Rate @ 1 validation scripts and security boundary validations. |

---

## 2. Parent Navigation
* **[Parent Directory](../README.md)**: Main systems engineering documentation hub.
* **[Root Directory](../../README.md)**: Repository quick start and setup portal.
