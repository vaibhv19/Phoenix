# Engineering Note — LLM & Reranking Pipeline

## 1. Problem Being Solved
Simple Vector Search (Bi-Encoder embedding retrieval) often suffers from "context noise". It retrieves chunks that are semantically close in vector space but lack the specific technical answer required by the query. In passing these noisy chunks directly to an LLM:
1. The LLM faces high context-window load and can fail to synthesize correct technical configurations.
2. Irrelevant search queries (e.g. "What is the meaning of life") get matched to technical manuals, causing hallucinated config answers.
3. Alphanumeric codes or abbreviated keys get matched to distractor chunks.

---

## 2. Why This Approach Was Selected
We implemented a **multi-stage post-processing RAG pipeline**:
- **First Stage Ingestion**: Quick retrieval using vector (pgvector) and keyword (BM25) searches.
- **Cross-Encoder Reranking (FlashRank)**: Re-evaluates query-document relevance by computing attention scores over both texts simultaneously. This filters out irrelevant vectors.
- **State-Healing Orchestrator**: Manages state degradations:
  - Rewrites weak terms (e.g., expanding abbreviations like "cors config" to "CORS configuration classes").
  - Redirects low-confidence queries to Cross-Encoder reranking.
  - Gracefully prompts clarification questions if the context does not contain the answer.

---

## 3. Alternative Approaches
- **Direct LLM Synthesis (No Reranking)**: Wastes context space, increases cloud token costs, and has a high rate of hallucinations.
- **Heavy Local Rerankers (e.g. `cohere-rerank` or `DeBERTa-v3`)**: High latency overhead (can take seconds) and requires GPU infrastructure.
- **FlashRank (selected)**: Uses ultra-lightweight ONNX-optimized cross-encoders (`ms-marco-TinyBERT-L-2-v2`). Runs locally in milliseconds on standard CPU threads.

---

## 4. Technical Working Principles

### Bi-Encoders vs. Cross-Encoders
- **Bi-Encoders (SentenceTransformers)**: Embed the query and documents independently into vectors. Retrieval is a simple cosine similarity calculation. Fast but loses token-to-token cross-attention between the query and the retrieved text.
- **Cross-Encoders**: Feed the query and document together into a transformer model:
  $$Input = [CLS] + Query + [SEP] + Document + [SEP]$$
  The model computes full attention across all tokens. This yields highly accurate relevance rankings, resolving exact key overlaps.

---

## 5. Fallback Orchestration Logic & State Transitions

The orchestrator state machine dynamically manages query states based on computed confidence scores ($CS$):

```text
               [User Query]
                    |
          (Calculate Confidence CS)
           /        |          \
     CS >= 0.75  CS >= 0.50    CS < 0.50
        /           |             \
 [GREEN Path]  [YELLOW Path]  [ORANGE Path]
   Direct         Rewrite        Reranking (FlashRank)
   Answer         Search          /                 \
                                Score >= 0.50     Score < 0.50
                                  /                     \
                             [GREEN Path]            [RED Path]
                               Synthesize           Clarification
                                Answer                Question
```

- **Green State**: Direct synthesis of the answer markdown based on the retrieved top chunks.
- **Yellow State**: Query rewriting expands technical queries using a mapping dictionary (e.g., `rate limits` ➔ `rate limiting policy configuration`). The engine searches again. If secondary confidence is high, it synthesizes; if low, it escalates to Orange.
- **Orange State**: Chunks are processed via the FlashRank reranker. If the top reranker score is $\ge 0.50$, it transitions to Green for synthesis; otherwise, it escalates to Red.
- **Red State**: The system returns a clarifying question requesting more detail, preventing hallucination.

---

## 6. Common Pitfalls & Debugging Tips
- **FlashRank Model Loading Latency**: The first execution of FlashRank downloads the ONNX model from the Hugging Face hub, causing a noticeable delay (10-20 seconds).
  *Fix*: Initialize the `Ranker` object during FastAPI server boot-up, caching the ONNX model locally.
- **Over-filtering in Orange State**: If the reranker threshold is set too high (e.g., $0.70$), valid technical answers can be discarded.
  *Fix*: Standardize on a threshold of $0.50$ for the lightweight `ms-marco-TinyBERT` model.

---

## 7. Interview Discussion Points
- **Q**: What is the difference between a Bi-Encoder and a Cross-Encoder?
  *A*: Bi-encoders create vector embeddings for documents and queries separately. They are excellent for fast retrieval over large databases but lack token-to-token comparison. Cross-encoders feed the query and document together into the transformer layers, enabling complete self-attention. While too slow for initial database scans, they are perfect for reranking the top 10-20 retrieved results.
- **Q**: How does the state machine prevent hallucinations for irrelevant questions?
  *A*: When an irrelevant query (like "meaning of life") is sent, vector search returns weak cosine similarities, and BM25 returns zero matches. The calculated confidence score is very low ($<0.35$). The orchestrator bypasses answer synthesis entirely and outputs a clarification request.

---

## 8. References
- FlashRank Reranker: https://github.com/PrithivirajDamodaran/FlashRank
- Cross-Encoders explanation (SBERT): https://www.sbert.net/examples/applications/cross-encoder/README.html
