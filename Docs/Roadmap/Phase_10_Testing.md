# Phase 10 — Testing

## 1. Module Overview: Testing & Benchmarking Suite

### Purpose
To execute rigorous integration testing, validation boundary checks, and system benchmarks. It includes the "Property Key Sensitivity Test" to empirically demonstrate the accuracy advantage of hybrid search over vector-only search.

### Dependencies
- Complete Phoenix stack fully implemented (Phases 1 to 9).

---

## 2. Intended Folder Structure (Testing Suites)

The testing scripts and suite structures will reside in their respective repositories:

```text
phoenix/
├── phoenix-backend/src/test/java/com/resume/phoenix/
│   ├── auth/SecurityBoundaryTest.java # Tenant cross-access tests
│   └── document/UploadValidationTest.java # Limit checks & API tests
├── phoenix-ai/tests/
│   ├── test_state_machine.py          # State transition tests
│   └── test_sensitivity.py            # Property Key Sensitivity Suite
└── phoenix-frontend/src/tests/
    └── components/ChatInteraction.test.js # React UI interaction tests
```

---

## 3. Testing Strategies & Benchmarks

### Property Key Sensitivity Test:
- **Objective**: Assert that Vector + BM25 hybrid search retrieves exact technical keys that vector-only search misses.
- **Dataset**: A set of 20 sample exact-term configuration queries (e.g., `logging.level.org.springframework`, `spring.jpa.hibernate.ddl-auto`).
- **Metric**: Hit Rate @ 1 (fraction of queries where the correct containing document chunk is the top-ranked result).
- **Benchmark Script**: Python script that runs retrieval on all 20 queries using:
  1. Pure vector retrieval.
  2. WLC Hybrid retrieval.
- **Success Criteria**: Hybrid search must achieve a significantly higher Hit Rate @ 1 compared to the vector-only baseline.

### State Machine Transition Verifications:
- Mock the confidence score generator to assert the system executes:
  - Green path when $CS > 0.75$.
  - Yellow path when $0.50 \le CS < 0.75$ (verifying rewritten query output).
  - Orange path when $0.35 \le CS < 0.50$ (asserting re-ranked index sequence matches Cross-Encoder output).
  - Red path when $CS < 0.35$ (verifying clarification response formatting).

---

## 4. Atomic Implementation Task List

### Task 10.1: Implement Security Boundary Isolation Tests
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 3.5
- **Description**: Write integration tests in Spring Boot asserting that requesting document references or query histories using a JWT token belonging to User B against Project A (owned by User A) throws access exceptions.
- **Definition of Done**: Multi-tenant access attempts return HTTP 403 Forbidden; all security checks pass.

### Task 10.2: Implement Upload Validation Constraint Tests
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 4.6
- **Description**: Add tests in Spring Boot verifying validation limits (e.g., uploading files exceeding size constraints, empty text names, invalid extensions).
- **Definition of Done**: Tests verify invalid request payloads return HTTP 400 Bad Request.

### Task 10.3: Create Fallback State Machine Path Mock Tests
- **Estimated Size**: M
- **Risk**: Medium
- **Prerequisites**: Task 8.5
- **Description**: In the Python suite, mock model predictions and compute routines to test all execution paths of the fallback state machine.
- **Definition of Done**: Tests assert that the state transitions output correct DTO arrays inside `reasoningTrace`.

### Task 10.4: Build Property Key Sensitivity Benchmark Test
- **Estimated Size**: M
- **Risk**: Low
- **Prerequisites**: Task 6.4
- **Description**: Implement `test_sensitivity.py` containing 20 exact-key test queries. Run both pipelines (vector-only vs hybrid search), log outcomes, and print comparison results.
- **Definition of Done**: Script executes, prints comparison logs, and shows that WLC hybrid search achieves higher Hit Rate @ 1.

### Task 10.5: Build React Component Render Tests
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 9.6
- **Description**: Implement Jest/React Testing Library tests asserting chat rendering, citation matrix scrolling, and the timeline collapsing.
- **Definition of Done**: Frontend component rendering tests pass successfully.
