# Release Notes: Phoenix v1.0.0 (Production Stable)

This document contains the release notes for **Phoenix v1.0.0**, detailing the implemented features, architectural milestones, system limitations, and the future development roadmap.

---

## 1. Release Summary & Implemented Functionality

Phoenix is a transparent, self-healing Hybrid RAG workspace optimized for local execution over technical documentation. The v1.0.0 release establishes a stable, production-ready framework across all layers of the monorepo:

* **Spring Boot API Gateway**: Manages stateful/stateless auth transformations, JWT parsing, and project-isolated database queries.
* **FastAPI AI Engine**: Handles PDF text extraction, SentenceTransformer embedding batch calculations, dynamic BM25 Okapi corpus generation, and composite confidence score checks.
* **React Client Console**: Implements a split-screen developer console. Surfaced citations flash matches in the context viewer and a timeline reveals RAG state transitions.

---

## 2. Major Architectural Milestones

* **Unified Database Architecture**: Mapped PostgreSQL tables to support the `vector` extension natively. Embedded vectors are saved in the relational database alongside metadata, allowing atomic cascades on delete.
* **Consensus-Driven Confidence Scoring**: Fuses cosine vector similarity and keyword overlap using consensus calculations:
  $$CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$$
* **Tiered Fallback Routing State Machine**: Implements self-correcting query pipelines to mitigate model hallucinations:
  * *Green ($CS \ge 0.75$)*: Direct response synthesis.
  * *Yellow ($0.50 \le CS < 0.75$)*: Query expansion and re-retrieval.
  * *Orange ($0.35 \le CS < 0.50$)*: Top candidate rescoring using CPU-optimized `FlashRank` Cross-Encoder.
  * *Red ($CS < 0.35$)*: Policed clarification queries instead of answering off-topic questions.
* **Latency & Timeout Protections**: Outbound RestClient and python HTTPX connection timeouts have been raised to **300 seconds** to accommodate local model first-run weight loads.

---

## 3. Known System Limitations

* **Single-Document RAG Boundary**: Context retrieval is limited to a single uploaded PDF manual per query session; cross-document RAG is not supported in the initial scope.
* **Local Inference Latency**: Character generation rates depend directly on local host CPU/GPU capabilities. Cold-starts on low-compute machines can cause up to 60-90 seconds of processing delay on first query.
* **Binary Document Support**: Ingestion is restricted to PDF files (no support for Microsoft Word, Excel, raw HTML, or text files).

---

## 4. Future Roadmap & Planned Enhancements

- [ ] **Real-time STOMP WebSockets streaming**: Stream character tokens as they are generated to reduce perceived user latency.
- [ ] **Multi-Document search scope**: Enable cross-referencing across multiple documents within a single workspace.
- [ ] **Dynamic alpha tuning**: Allow the WLC fusion alpha coefficient to adjust automatically based on query density and term type (e.g. automatically lower alpha for queries containing code constants).
