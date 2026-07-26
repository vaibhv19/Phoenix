# Phase 6 — Hybrid Retrieval

## 1. Module Overview: Hybrid Search Engine

### Purpose
To retrieve relevant document chunks from PostgreSQL by executing vector search and keyword search in parallel, normalising BM25 scores using Min-Max scaling, and combining them using a Weighted Linear Combination (WLC) score fusion.

### Dependencies
- Phase 5 (Vector database and chunks active).

### Inputs
- User query string.
- Scope identifier `UUID documentId`.
- Target retrieval count $K$.

### Outputs
- Fused, ranked list of document chunk objects with composite scores.

---

## 2. Intended Folder Structure (Python AI Engine)

The retrieval engine layout within the app services:

```text
phoenix-ai/app/
└── services/
    ├── retrieval.py                 # Coordinator for hybrid searches
    ├── search_vector.py             # Cosine similarity pgvector query runner
    ├── search_keyword.py            # BM25 index builder and query runner
    └── fusion.py                    # MinMaxScaler normalization & WLC formula
```

---

## 3. Mathematical Formula & Scaling Spec

### BM25 Tokenizer:
- Custom tokenizer using basic lowercase tokenization with punctuation and stop-word filtering.

### MinMaxScaler Normalization:
- For a batch of BM25 raw scores $S_{bm25}$ returned for a query:
  $$Score_{bm25\_norm} = \frac{S_{bm25} - \min(S_{bm25})}{\max(S_{bm25}) - \min(S_{bm25}) + \epsilon}$$
- $\epsilon = 1e-6$ to prevent division by zero when all scores are identical.
- Scaled range is strictly bound to $[0, 1]$.

### WLC Fusion Formula:
  $$Score_{final} = \alpha \cdot Sim_{vector} + (1 - \alpha) \cdot Score_{bm25\_norm}$$
- Default $\alpha = 0.7$.

---

## 4. Atomic Implementation Task List

### Task 6.1: Implement Vector Search (pgvector)
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 5.5
- **Description**: Implement `VectorSearchService` executing cosine similarity queries in Postgres using SQLAlchemy's `<=>` operator. Limit query to the parent `document_id`.
- **Definition of Done**: Query returns the top $N$ vectors along with their raw cosine similarity scores; tests verify search executes.

### Task 6.2: Implement BM25 Keyword Search
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 5.3
- **Description**: Build `KeywordSearchService` using the `rank_bm25` package. Extract all chunks for the given `document_id` to build the corpus, tokenize text, and rank corpus based on search terms.
- **Definition of Done**: Service indexes document corpus on-the-fly and returns top $N$ raw BM25 query scores.

### Task 6.3: Implement MinMaxScaler Normalizer
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: None
- **Description**: Write the `MinMaxScaler` utility to normalize raw BM25 scores in a query batch. Handle division by zero constraints if $\max == \min$ or corpus size is 1.
- **Definition of Done**: Unit tests verify list of arbitrary raw float scores (e.g. $[12.5, 6.0, 0.0]$) scales correctly to range $[1.0, 0.48, 0.0]$.

### Task 6.4: Implement WLC Score Fusion
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Tasks 6.1 to 6.3
- **Description**: Write `WLCFusion` to combine vector similarity and normalized BM25 scores. Match documents across vector and keyword retrieval lists by their database primary keys.
- **Definition of Done**: Fusion compiles a single list sorted in descending order of the final fused scores.

### Task 6.5: Expose Base In-Memory Retrieval endpoint
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 6.4
- **Description**: Bind retrieval services together inside FastAPI. Create baseline endpoint `POST /internal/v1/process-base` (or equivalent test endpoint) to verify the raw retrieval works before adding confidence evaluations.
- **Definition of Done**: Endpoint accepts query payload, retrieves chunks, executes fusion, and returns JSON payload containing fused matches.
