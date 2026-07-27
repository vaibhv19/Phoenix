# Engineering Note — Fallback State Machine

## 1. Problem Being Solved
RAG systems are notoriously prone to hallucinating when query confidence is low or retrieval yields irrelevant contexts. Direct generation using low-confidence chunks degrades user trust. The Fallback State Machine provides a transparent, structured, and auditable pipeline that reacts dynamically to retrieval confidence scores ($CS$), either attempting to recover relevance (via query rewriting and Cross-Encoder reranking) or politely aborting synthesis to ask a clarifying question.

## 2. Why This Approach Was Selected
A multi-tier transition state machine provides optimal trade-offs:
1. **Green ($CS \ge 0.75$)**: Perfect consensus. Directly synthesize the answer to maintain low latency.
2. **Yellow ($0.50 \le CS < 0.75$)**: Partial keyword/semantic match. Rewriting/expanding the query is highly effective to improve context overlap.
3. **Orange ($0.35 \le CS < 0.50$)**: Weak initial retrieval. Light-weight Cross-Encoder reranking rescores the top-20 candidates to find semantic details that the initial retriever missed.
4. **Red ($CS < 0.35$)**: Completely irrelevant query. Safely abort generation and prompt for clarification based on nearest vector matches to prevent hallucinations.

This tiered escalation saves resources, maintains low latency, and ensures high precision.

## 3. Alternative Approaches
- **Static Cosine Thresholding**: Immediate rejection if similarity falls below a cutoff. While simple, it has high false rejection rates because some complex queries have lower vector similarity but contain valuable semantic information.
- **LLM-in-the-Loop Routing**: Prompting an LLM to decide if the query can be answered. This adds 1-2 seconds of latency and substantial API costs. Our state machine executes thresholding in sub-milliseconds.

## 4. Internal Implementation
The state machine is built as an orchestration layer in `app/services/fallback.py` using `FallbackOrchestrator`:
- It acts as a coordinator, delegating tasks to:
  - `RetrievalService` for pgvector & keyword BM25 retrieval.
  - `LLMService` (wrapping Ollama with automatic mock fallback) for rewriting, generation, and clarification.
  - `RerankingService` (using FlashRank's `ms-marco-MiniLM-L-6-v2`) for reranking.
- It records and returns a list of `ReasoningStepDto` objects detailing exactly what transitions took place and why.

## 5. Phoenix-Specific Usage
It is exposed via:
`POST /internal/v1/process`
```json
{
  "documentId": "uuid",
  "query": "user query",
  "limit": 5,
  "alpha": 0.7
}
```
Which returns:
```json
{
  "documentId": "uuid",
  "query": "user query",
  "answer": "Generated answer or clarification question",
  "confidenceScore": 0.85,
  "reasoningTrace": [
    { "state": "INITIAL_RETRIEVAL", "confidenceScore": 0.60, "description": "..." },
    { "state": "FALLBACK_REWRITE", "confidenceScore": 0.85, "description": "..." },
    { "state": "ANSWER_GENERATION", "confidenceScore": 0.85, "description": "..." }
  ],
  "matches": [...]
}
```

## 6. Common Pitfalls & Debugging Tips
- **Reranker Cold Start**: The first time FlashRank is imported, it fetches the ONNX model from Hugging Face if not cached. This can cause the first test or endpoint call to take up to 30-60 seconds. Our implementation has an automatic mock mode to prevent local test runs from blocking.
- **Mock LLM Prompt Extraction**: When running Ollama and it fails, the service falls back to mock responses. To return relevant mock answers, it extracts the query from the user prompt using string manipulation.

## 7. Interview Discussion Points
- **Q**: Why do we query 20 candidates for reranking?
  *A*: Bi-encoders (used in initial vector retrieval) prioritize retrieval speed over precision. Cross-encoders (used in reranking) evaluate the exact query-passage interaction, which is highly precise but too slow to run on the entire corpus. Querying 20 candidates is the sweet spot for a cross-encoder to run CPU-bound inference in under 100ms.
- **Q**: What happens to confidence scores after reranking?
  *A*: Reranking computes an absolute cross-encoder relevance score ($RS$) for each passage. The orchestrator uses the highest score in the reranked list ($RS$) as the new confidence measure, mapping it to the Orange target threshold ($RS \ge 0.50$).
