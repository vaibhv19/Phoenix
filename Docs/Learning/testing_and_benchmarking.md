# Engineering Note: Testing & Benchmarking Suite

## 1. Problem Being Solved
Ensuring correctness, safety, reliability, and accuracy across all layers of the Phoenix hybrid retrieval system:
1. **Security & Tenant Isolation**: Verifying that tenant access boundaries are impenetrable (User B cannot read/write User A's data).
2. **Upload Constraints**: Ensuring corrupt, empty, or invalid file payloads are caught immediately at the entry point.
3. **State Machine Correctness**: Validating that all fallback/escalation transitions in the FastAPI AI engine behave deterministically.
4. **Retrieval Benchmark (Property Key Sensitivity)**: Proving empirically that a hybrid search pipeline out-performs a vector-only baseline for exact configuration key lookups (e.g., `logging.level.org.springframework`).
5. **Frontend Reliability**: Testing that the React UI renders, collapses reasoning timelines, and handles scrolls/interactions deterministically.

---

## 2. Why This Testing Approach Was Selected
- **Backend (MockMvc + SpringBootTest)**: Leveraged Spring Boot's built-in `MockMvc` to issue mock HTTP requests against controllers. This validates the entire Spring Security config, JWT authentication, and transactional rollback mechanisms without running a full servlet web server.
- **AI Engine (pytest + pgvector Integration)**: Leveraged `pytest` with a live Postgres database transaction/setup to test search methods with real `sentence-transformers` embeddings, verifying calculations in the actual runtime environment.
- **Retrieval Benchmark (Hit Rate @ 1)**: Formulated the benchmark with 20 exact-term config queries alongside 20 highly similar distractor chunks. Hit Rate @ 1 is the standard metric for top-rank retrieval accuracy.
- **Frontend (Vitest + React Testing Library)**: Vitest is the native testing framework for Vite, offering fast execution. React Testing Library focuses on user-centric testing rather than implementation details.

---

## 3. Alternative Approaches
- **End-to-End Testing (e.g., Playwright / Cypress)**: High overhead and slow execution, making them less suitable for developers' fast feedback loops.
- **Mock Embedding Vectors in Benchmarks**: While faster, it does not validate the real-world semantic overlap that dense transformers (`all-MiniLM-L6-v2`) have on dot-separated keys, which is the core problem BM25 resolves.
- **Mocking the Database in Repository Tests**: Mocking JPA repositories can hide syntax errors, database-specific dialec discrepancies, or constraint violations. Using active database test suites with rollback transactions is far more robust.

---

## 4. Internal Implementation & Phoenix Usage

### Backend Validation
- **`SecurityBoundaryTest`**: Builds projects owned by User A and User B. Employs `.with(user(userB))` mock users to verify that User B's attempts to delete Project A, upload files to Project A, or check statuses of Project A's documents return `403 Forbidden`.
- **`UploadValidationTest`**: Uploads files with invalid extensions (e.g. `.txt`) or empty content and checks for `400 Bad Request` exceptions mapped via `GlobalExceptionHandler`.

### State Machine Escalation Testing
- Added tests in `test_fallback.py` simulating escalation paths:
  - **Yellow-to-Orange**: When initial retrieval is $0.60$ (yellow) and rewritten query retrieval is $0.40$ (orange), verify escalation to routing through FlashRank reranker.
  - **Orange-to-Red**: When reranking returns $0.30$ (red), verify escalation to clarification question generation.

### Property Key Sensitivity Test (`test_sensitivity.py`)
Inserts 40 chunks (20 targets, 20 distractors) and evaluates Hit Rate @ 1.
- **Vector Search**: Computes cosine similarity of dense embeddings. Gets confused on technical keys like `server.port` due to semantic similarity with general server explanations.
- **Hybrid Search**: Performs MinMax scaling on vector and BM25 scores, combining them with WLC fusion ($\alpha=0.7$). BM25 matches exact dot-separated terms perfectly, raising target chunks to rank 1.

---

## 5. Important Test Classes & Commands

### Backend Tests
- **Location**: `backend/src/test/java/com/resume/phoenix/`
- **Command**: `mvn test` (to run the entire suite) or `mvn test -Dtest=SecurityBoundaryTest,UploadValidationTest`

### AI Engine Tests & Benchmark
- **Location**: `ai-engine/app/tests/`
- **Command**: `.venv\Scripts\python -m pytest app/tests/test_fallback.py app/tests/test_sensitivity.py -s`

### Frontend Tests
- **Location**: `frontend/src/tests/`
- **Command**: `npm run test`

---

## 6. Common Pitfalls & Debugging Tips
1. **JSDOM missing `scrollIntoView`**:
   - *Pitfall*: Calling `scrollIntoView` inside JSDOM throws a TypeError.
   - *Fix*: Mock `window.HTMLElement.prototype.scrollIntoView = () => {}` in `setupTests.js`.
2. **First-run SentenceTransformers Overhead**:
   - *Pitfall*: The first time `test_sensitivity.py` runs, it downloads `all-MiniLM-L6-v2` from Hugging Face Hub, causing tests to take 20-30 seconds.
   - *Debugging*: Run with `-s` flag to monitor Hugging Face download progress bars.
3. **Database Cleanup order**:
   - *Pitfall*: Chunks reference documents which reference projects which reference users. Deleting users before chunks causes foreign key constraint violations.
   - *Fix*: Always delete records in reverse dependency order: `DocumentChunk` -> `Document` -> `Project` -> `User`.

---

## 7. Interview Discussion Points
- **Why do dense vectors fail on dot-separated keys?**
  Dense models like SentenceTransformers compress sentences into semantic vector spaces. Dot-separated strings (like `spring.jpa.show-sql`) are out-of-vocabulary tokens that get tokenized into subwords. The semantic embedding space clusters them near other general SQL or Spring concepts. Keyword indices like BM25 look for exact matching tokens (like `show`, `sql`, `spring`, `jpa`), resolving ambiguity instantly.
- **Why use transactional rollbacks in integration tests?**
  Using `@Transactional` on a test method wraps the test execution in a database transaction that automatically rolls back at the end of the test. This guarantees that test side effects never pollute the database, preventing flaky tests.
