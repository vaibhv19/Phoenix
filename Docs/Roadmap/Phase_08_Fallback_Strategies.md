# Phase 8 — Fallback Strategies

## 1. Module Overview: Fallback State Machine

### Purpose
To execute the 4-tier fallback state machine when retrieval confidence is low. It rewrites queries, re-ranks candidate passages, or generates clarifying questions to prevent hallucinations and maintain complete RAG audit transparency.

### Dependencies
- Phase 7 (Scoring algorithms active).
- Local LLM engine interface setup (FastAPI settings).

### Inputs
- Initial user query.
- Document boundary and configuration properties.

### Outputs
- Complete RAG response containing either synthesized answer or clarification question.
- Compiled `reasoningTrace` array containing structural `ReasoningStepDto` states.

---

## 2. Intended Folder Structure (Python AI Engine)

The fallback orchestration layout:

```text
phoenix-ai/app/
└── services/
    ├── fallback.py                  # Core State Machine Orchestrator
    ├── llm.py                       # LLM Runner (generation, rewriting, clarification)
    └── reranking.py                 # FlashRank Cross-Encoder service
```

---

## 3. Core State Transitions & Parameters

### Transition States:
- **`INITIAL_RETRIEVAL`**: Computes initial confidence score $CS_1$.
- **`FALLBACK_REWRITE`**: Triggered if $0.50 \le CS_1 < 0.75$. Run LLM optimizer query rewrite, execute search to compute $CS_2$. If $CS_2 \ge 0.75$, generate answer. Otherwise, escalate to `FALLBACK_RERANK`.
- **`FALLBACK_RERANK`**: Triggered if $0.35 \le CS_1 < 0.50$ OR if rewrite failed to reach Green threshold. Compile Top-20 chunks and pass through FlashRank. If top re-ranked score $RS \ge 0.50$, generate answer. Otherwise, escalate to `FALLBACK_CLARIFY`.
- **`FALLBACK_CLARIFY`**: Triggered if $CS < 0.35$ after all steps. Abort synthesis; generate clarifying question based on closest matches.

### Models:
- **Re-ranker**: `FlashRank` Cross-Encoder (`ms-marco-MiniLM-L-6-v2` or similar lightweight model).
- **LLM**: Locally running model (e.g. Llama-3/Mistral via Ollama or lightweight mock/API interface) using targeted system prompts.

---

## 4. Atomic Implementation Task List

### Task 8.1: Implement LLM Base Integration Service
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 1.4
- **Description**: Configure connection to the LLM backend (e.g. Ollama client or mock provider). Implement response parsing wrapper for deterministic JSON responses.
- **Definition of Done**: Service compiles, connects, and successfully prompts the LLM to return plain text responses.

### Task 8.2: Implement Query Rewriter (Yellow Tier)
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Tasks 6.4, 8.1
- **Description**: Build `QueryRewriter` which wraps original query with expansion prompts ("HyDE-light"), calls LLM, and triggers secondary retrieval.
- **Definition of Done**: Service outputs an optimized, expanded query and returns secondary retrieval results.

### Task 8.3: Configure FlashRank Re-ranker (Orange Tier)
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 6.4
- **Description**: Integrate `FlashRank` library into `reranking.py`. Pass the top-20 document candidates and re-score them against the search query.
- **Definition of Done**: Method outputs re-ranked document chunks with descending relevance scores within 200ms CPU latency.

### Task 8.4: Implement Clarification Generator (Red Tier)
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 8.1
- **Description**: Build system prompts instructing LLM to generate a polite clarification response based on the search query and nearest chunk metadata topics.
- **Definition of Done**: Prompt returns structured clarification strings without attempting to answer the question itself.

### Task 8.5: Write Fallback State Machine Orchestrator
- **Estimated Size**: L
- **Risk**: High
- **Prerequisites**: Tasks 8.2 to 8.4, 7.3
- **Description**: Implement `FallbackOrchestrator` in `fallback.py` to route logic paths, catch failures, and dynamically append `ReasoningStepDto` states to `reasoningTrace`.
- **Definition of Done**: Orchestrator successfully traverses all states, handles escalations, and returns final unified payload matching contract.

### Task 8.6: Bind Ingestion and Retrieval endpoints to main.py
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 8.5
- **Description**: Create endpoint `POST /internal/v1/process` routing incoming requests to `FallbackOrchestrator`.
- **Definition of Done**: Executing query via Postman returns full response payload containing `answer` (or clarification), `confidence`, and populated `reasoningTrace` list.
