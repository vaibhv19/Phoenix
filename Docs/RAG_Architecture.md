# RAG System Architecture & Algorithmic Design: Phoenix

This document defines the mathematical models, embedding vectors, schema structures, and state transitions that govern the **Phoenix** retrieval pipeline.

---

## 1. Document Chunking & Vector Representation

Technical documentation contains dense segments (Java code, YAML blocks) that must be kept intact during ingestion.

* **Splitter**: `RecursiveCharacterTextSplitter` in [ingestion.py](../ai-engine/app/services/ingestion.py)
* **Configuration Parameters**:
  * **Chunk Size**: `800` characters.
  * **Chunk Overlap**: `150` characters.
  * **Separators**: `["\n\n", "\n", " ", ""]`.
* **Design Rationale**: A 800-character boundary preserves complete configuration property blocks and small Java methods. The 150-character overlap carries trailing property descriptions or method declarations into the adjacent chunk context.
* **Embedding Model**: `SentenceTransformer("all-MiniLM-L6-v2")` in [vector_store.py](../ai-engine/app/services/vector_store.py). Converts text segments into 384-dimensional dense vectors.
* **Vector Database**: Mapped via `pgvector` in PostgreSQL. Mapped via SQLAlchemy ORM model `DocumentChunk` containing the `VECTOR(384)` column [models.py](../ai-engine/app/models.py).
* **Similarity Metric**: Cosine similarity is calculated as:
  $$CosineSimilarity = 1.0 - CosineDistance$$
  Implemented via SQLAlchemy operator: `(1.0 - cast(DocumentChunk.embedding.op('<=>')(query_embedding), Float))` in [search_vector.py](../ai-engine/app/services/search_vector.py).

---

## 2. Hybrid Search & Fusion: Weighted Linear Combination (WLC)

Vector similarity is highly effective for conceptual queries but fails for exact technical keys. By running vector search and BM25 search in parallel, we ensure both signals are captured.

* **Keyword Engine**: `rank_bm25` in [search_keyword.py](../ai-engine/app/services/search_keyword.py), tokenizing with stop-word filters. The BM25 Okapi model is instantiated dynamically over the document's chunks to optimize search speed for single-document queries.
* **Min-Max Scaling**: Raw BM25 scores $[0, \infty)$ are normalized per batch using `MinMaxScaler` in [fusion.py](../ai-engine/app/services/fusion.py) to map them to the $[0, 1]$ range:
  $$Score_{bm25\_norm} = \frac{Score - Score_{min}}{(Score_{max} - Score_{min}) + \epsilon}$$
  where $\epsilon = 10^{-6}$ prevents division-by-zero.
* **Score Fusion**: Computed using a Weighted Linear Combination (WLC) in [fusion.py](../ai-engine/app/services/fusion.py):
  $$Score_{final} = \alpha \cdot Similarity_{vector} + (1 - \alpha) \cdot Score_{bm25\_norm}$$
  with the tuning parameter $\alpha$ set to `0.7` by default.

---

## 3. Composite Confidence Scoring Model

Confidence measures the consensus between the dense and sparse search indices. Computed in [confidence.py](../ai-engine/app/services/confidence.py):

$$CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$$

1. **MaxSim**: The cosine similarity score of the top-ranked vector search match, clamped strictly to $[0, 1]$.
2. **Agreement**: The percentage of consensus calculated as:
  $$Agreement = \frac{|Vector_{top3} \cap BM25_{top5}|}{3}$$
  If a candidate appears in both search pathways, the consensus agreement score rises.

---

## 4. Fallback Decision Engine (State Machine)

The `FallbackOrchestrator` in [fallback.py](../ai-engine/app/services/fallback.py) coordinates query execution using the composite score ($CS$):

| Confidence Score ($CS$) | Pipeline State | Orchestrated Action |
| :--- | :--- | :--- |
| **$CS \ge 0.75$** | **Green Path** (`INITIAL_RETRIEVAL` -> `ANSWER_GENERATION`) | Direct response generation using retrieved context. |
| **$0.50 \le CS < 0.75$** | **Yellow Path** (`INITIAL_RETRIEVAL` -> `FALLBACK_REWRITE` -> `ANSWER_GENERATION`) | Rewrites the query using the LLM to expand technical abbreviations. If the secondary search score $\ge 0.75$, it generates the answer; otherwise, it escalates to reranking. |
| **$0.35 \le CS < 0.50$** | **Orange Path** (`INITIAL_RETRIEVAL` -> `FALLBACK_RERANK` -> `ANSWER_GENERATION`) | Gathers the top 20 candidate chunks, re-scores them using the `FlashRank` Cross-Encoder (`ms-marco-MiniLM-L-6-v2`), and evaluates the top reranked score. If $\ge 0.50$, it generates the answer; otherwise, it escalates to clarification. |
| **$CS < 0.35$** | **Red Path** (`INITIAL_RETRIEVAL` -> `FALLBACK_CLARIFY`) | Aborts answer generation. Extracts top topics from vector context and prompts the LLM to generate a polite clarification question. |

---

## 5. Algorithmic Validation: The Property Key Sensitivity Test

Reviewers can validate the superiority of this hybrid architecture using the following test:

1. **Query**: Ask for an exact configuration key (e.g., `spring.jpa.hibernate.ddl-auto`).
2. **Vector-Only Baseline**: Frequently yields general database description pages, failing to locate the precise code block defining the key.
3. **BM25 Baseline**: Retrieves the exact chunk containing the key but lacks contextual relevance.
4. **Weighted Fusion (WLC)**: BM25 score normalization pushes the exact key chunk to the top. The orchestrator records a high consensus agreement, achieving a **Green Path** execution.