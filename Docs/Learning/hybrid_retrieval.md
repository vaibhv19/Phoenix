# Engineering Note — Hybrid Retrieval Engine

## 1. Problem Being Solved
Standard search engines often struggle to balance keyword-based exact matches with semantic-based conceptual matches. Dense vector search is excellent at capturing semantic relationships (e.g., matching "cooking pasta" with "recipes for spaghetti") but can completely miss exact keywords or alphanumeric identifiers (e.g., serial numbers, code identifiers). Sparse keyword search (e.g., BM25) excels at exact matches but fails when queries use synonyms or different phrasing. The Hybrid Retrieval Engine solves this by combining the strengths of both dense vector search and sparse keyword search (BM25) into a unified, high-performance retrieval service.

## 2. Why This Approach Was Selected
We selected a two-stage hybrid search approach:
1. **Parallel/Sequential Search**: Perform vector search using PostgreSQL `pgvector` and BM25 search using python's `rank_bm25` in memory on-the-fly.
2. **Min-Max Score Normalization**: Normalise BM25 scores to the range $[0.0, 1.0]$ since BM25 scores are unbounded positive numbers.
3. **Weighted Linear Combination (WLC) Fusion**: Linearly combine the cosine similarity scores (which are bounded) and normalized BM25 scores using a weight parameter $\alpha$ (default 0.7 for semantic-heavy retrieval).

This approach is highly modular, runs on our existing PostgreSQL infrastructure without needing a separate Elasticsearch or OpenSearch cluster, and provides predictable, tunable score combination.

## 3. Alternative Approaches
- **Reciprocal Rank Fusion (RRF)**: A popular rank-based fusion method. It does not require score normalization, but it loses the absolute distance/similarity information (a document that is a 99% match gets fused the same way as a document that is slightly better than another but has very low absolute relevance). We selected WLC because retaining absolute similarity scores is critical for confidence scoring and threshold filtering in later phases.
- **Dedicated Search Engines (Elasticsearch/OpenSearch)**: Provides native hybrid search, but introduces significant infrastructure overhead and operations complexity. Our pgvector + in-memory BM25 approach is perfect for document-scoped search context.

## 4. Mathematical Intuition

### pgvector Cosine Similarity
Cosine Distance is computed as:
$$Distance_{cosine} = 1 - \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$
In pgvector, the `<=>` operator computes cosine distance, which is bound to $[0, 2]$.
We calculate Cosine Similarity as:
$$Sim_{vector} = 1.0 - Distance_{cosine}$$

### BM25 Ranking
BM25 (Best Match 25) calculates the relevance of a query to a document by summing the TF-IDF weight of terms, adjusted for document length:
$$Score_{bm25}(D, Q) = \sum_{i=1}^{n} IDF(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{avgdl}\right)}$$
Where:
- $IDF(q_i)$ is inverse document frequency.
- $f(q_i, D)$ is term frequency in document.
- $k_1$ and $b$ are parameters (default $k_1 = 1.5$, $b = 0.75$).
- $|D|$ is document length, and $avgdl$ is average document length.

### Min-Max Score Normalization
BM25 scores are positive and unbounded. To combine them with bounded cosine similarity scores, we normalize the raw BM25 scores $S_{bm25}$ returned for a given query:
$$Score_{bm25\_norm} = \frac{S_{bm25} - \min(S_{bm25})}{\max(S_{bm25}) - \min(S_{bm25}) + \epsilon}$$
- $\epsilon = 1e-6$ prevents division by zero when all scores are identical.
- We clamp the output strictly to $[0.0, 1.0]$.

### Weighted Linear Combination (WLC) Score Fusion
The final composite score is:
$$Score_{final} = \alpha \cdot Sim_{vector} + (1 - \alpha) \cdot Score_{bm25\_norm}$$
- $\alpha = 0.7$ weighs semantic vector results higher than keyword matches.

## 5. Phoenix-Specific Implementation & Usage
The retrieval engine is implemented across four services inside `app/services/`:
- `search_vector.py` (`VectorSearchService`): Executes the pgvector query in PostgreSQL.
- `search_keyword.py` (`KeywordSearchService`): Builds the index on-the-fly, tokenizes documents/queries, and scores using `rank_bm25`.
- `fusion.py` (`MinMaxScaler`, `WLCFusion`): Normalizes and combines results.
- `retrieval.py` (`RetrievalService`): Coordinates the search pipelines.

The endpoint is exposed at `POST /internal/v1/process-base`.

### Important Classes & Modules
- `VectorSearchService`: Runs the query using the `<=>` operator cast to `Float` to prevent SQLAlchemy type propagation issues.
- `KeywordSearchService`: Extracts and tokenizes all chunks for a `document_id`.
- `custom_tokenizer`: Lowercases, removes punctuation, and filters out stop-words.
- `WLCFusion`: Matches chunks across result sets by primary key UUID and combines them.

## 6. Common Pitfalls & Debugging Tips
- **SQLAlchemy Type Propagation**: When executing `1.0 - cosine_distance` where `cosine_distance` is a pgvector operator, SQLAlchemy propagates the custom `Vector` type to the float literal `1.0`, raising `ValueError: expected list or ndarray` on binding.
  *Fix*: Wrap the pgvector distance expression with `sqlalchemy.cast(..., Float)`.
- **BM25 Zero Scores on Small Corpora**: If the document has only 2 chunks and the query word appears in 1 of them, the BM25 IDF formula evaluates to exactly 0.0 because the term is present in exactly half of the documents.
  *Fix*: Ensure unit/integration tests use at least 3 chunks to avoid division/logarithm characteristics of small corpus counts.

## 7. Interview Discussion Points
- **Q**: Why build BM25 on-the-fly rather than indexing in a database?
  *A*: Since our search queries are always scoped to a single document (`document_id`), the search corpus is small (typically <500 chunks). Building the BM25 index on-the-fly in memory is extremely fast (takes milliseconds) and avoids the complexity of maintaining synchronized elastic/BM25 indexes in a database.
- **Q**: What happens to chunks that only appear in one of the result sets?
  *A*: Chunks not returned by vector search get a default vector similarity score of $0.0$. Chunks not scored by BM25 (or not matched) get a default normalized BM25 score of $0.0$.

## 8. References
- pgvector documentation: https://github.com/pgvector/pgvector
- rank_bm25 documentation: https://github.com/dorianbrown/rank_bm25
