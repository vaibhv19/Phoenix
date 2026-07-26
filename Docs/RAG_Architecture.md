# RAG Architecture: Hybrid Retrieval & Fallback Design

This document details the internal architectural design of the **Phoenix** Python AI engine. It focuses on the implementation of the retrieval pipeline, the mathematical fusion of hybrid search, and the logic governing the fallback state machine.

---

## 1. Document Ingestion & Chunking Strategy

Technical documentation requires a structural approach to chunking to avoid decapitating code blocks or separating configuration keys from their values.

*   **Strategy:** `RecursiveCharacterTextSplitter`.
*   **Parameters:** 
    *   **Chunk Size:** 800 characters.
    *   **Chunk Overlap:** 150 characters.
*   **Rationale:**
    *   **Code Integrity:** Technical docs contain blocks (Java methods, YAML blocks). A size of 800 characters typically captures a standard 10-15 line method or a full configuration section. 
    *   **Context Continuity:** 150 characters of overlap ensures that if a technical identifier (e.g., `spring.datasource.url`) appears at the end of a chunk, its descriptive context is carried into the next.
    *   **Separator Hierarchy:** Splits are prioritized by `["\n\n", "\n", " ", ""]`. This forces chunks to break at paragraph or line breaks rather than in the middle of a configuration key.

## 2. Embedding Model Choice

*   **Model:** `Sentence-Transformers/all-MiniLM-L6-v2`.
*   **Dimensions:** 384.
*   **Rationale:**
    *   **Efficiency:** For a local-first portfolio project, this model provides high semantic accuracy with extremely low inference latency on CPU.
    *   **Context Window:** The 512-token limit aligns perfectly with our 800-character chunking strategy.
    *   **Dimensionality:** 384 dimensions allow for fast cosine similarity calculations in `pgvector` without the need for complex dimensionality reduction (PCA).

## 3. Vector Store Schema (`pgvector`)

The `document_chunks` table in PostgreSQL is designed to support both vector similarity and filtered metadata retrieval.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary key. |
| `document_id` | `UUID` | Foreign key to Spring Boot's document table. |
| `content` | `TEXT` | The raw text of the chunk. |
| `metadata` | `JSONB` | Stores `page_number`, `section_title`, and `is_code_block`. |
| `embedding` | `VECTOR(384)` | The pre-computed semantic vector. |

*   **Index:** HNSW (Hierarchical Navigable Small World) index on the `embedding` column for $O(\log n)$ retrieval speed.

## 4. Hybrid Search: Weighted Linear Combination (WLC)

Phoenix uses **Weighted Linear Combination (WLC)** to fuse semantic and keyword results. Reciprocal Rank Fusion (RRF) was considered and rejected because it operates purely on rank positions ($1 / (k + r)$) rather than raw similarity scores, which discards the exact-term-matching signal intensity that this project needs for technical document accuracy.

**The Formula:**
$$Score_{final} = \alpha \cdot Sim_{vector} + (1 - \alpha) \cdot Score_{bm25\_norm}$$

*   **$\alpha$ (Alpha):** Set to `0.7` by default.
*   **Normalization (MinMaxScaler):** Since BM25 raw scores are unbounded ($[0, \infty)$) and vector similarity scores (cosine similarity) are bounded within $[0, 1]$, the Python AI engine must apply an explicit Min-Max normalization (`MinMaxScaler`) on raw BM25 scores per query batch to scale them to the $[0, 1]$ range before applying the fusion weighting formula. Without this MinMaxScaler step, the unbounded BM25 scores would dominate the bounded vector similarity scores, making the weighted fusion mathematically meaningless.
*   **Tradeoff:** A high $\alpha$ prioritizes conceptual understanding (Vector), while a lower $\alpha$ prioritizes exact technical property matches (BM25).

## 5. Confidence Scoring Model

Confidence is not just a similarity score; it is a measure of "Retrieval Certainty." Phoenix calculates a **Composite Confidence Score ($CS$)**:

$$CS = (0.6 \cdot MaxSim) + (0.4 \cdot Agreement)$$

1.  **MaxSim:** The Cosine Similarity of the top-ranked vector chunk.
2.  **Agreement:** A binary-weighted metric (0 to 1) based on how many of the Top-3 Vector results also appear in the Top-5 BM25 results.
*   **Justification:** High MaxSim with low Agreement suggests a "hallucination risk" where the model understands the *topic* but hasn't found the *exact* technical reference.

## 6. Fallback Tier Thresholds

The system acts as a state machine based on the $CS$ value:

| Threshold ($CS$) | State | Action |
| :--- | :--- | :--- |
| **$> 0.75$** | **Green** | Direct answer generation with citations. |
| **$0.50 - 0.75$** | **Yellow** | Trigger **Query Rewriting**. Expand the user query with synonyms/context and re-run retrieval. |
| **$0.35 - 0.50$** | **Orange** | Trigger **Cross-Encoder Re-ranking**. Pass Top-10 chunks through a re-ranker to find hidden relevance. |
| **$< 0.35$** | **Red** | Abort generation. Ask a clarifying question (e.g., "I see you're asking about X, but the document only covers Y. Could you specify...?"). |

## 7. Evaluating Hybrid vs. Vector-Only

To demonstrate the superiority of the hybrid approach in an interview context, Phoenix utilizes a **"Property Key Sensitivity Test"**:

1.  **The Test:** Query the system for an exact configuration key (e.g., `logging.level.org.springframework`).
2.  **Vector Failure:** Show that Vector-only search often returns general "Logging" sections but misses the specific key-value pair chunk.
3.  **Hybrid Success:** Demonstrate that BM25 retrieves the exact chunk, which the WLC fusion then elevates to the top rank.
4.  **Metric:** Compare **Hit Rate @ 1** for exact technical terms across 20 sample queries.

---
**Related Documentation**
* [Phoenix Tech Stack](file:///path/to/Tech_Stack.md)
* [Phoenix App Flow](file:///path/to/App_Flow.md)

## Phoenix — Feature List (Ground Truth)

*   **Ingestion:** PDF parsing, recursive character chunking, embeddings (`all-MiniLM-L6-v2`).
*   **Retrieval:** Hybrid Search (Vector + BM25) using `pgvector` and `rank_bm25`.
*   **Confidence:** Calculation based on retrieval distribution and agreement.
*   **Fallbacks:** Query rewriting, Re-ranking, and Clarification questions.
*   **Transparency:** UI-based "Reasoning Trace" showing the fallback path taken.
*   **Citations:** Source-backed answers with page/chunk references.