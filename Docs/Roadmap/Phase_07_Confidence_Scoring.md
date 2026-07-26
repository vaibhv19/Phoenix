# Phase 7 — Confidence Scoring

## 1. Module Overview: Retrieval Confidence Calculator

### Purpose
To evaluate the reliability and precision of the retrieved document context. It calculates a Composite Confidence Score ($CS$) combining the absolute strength of the semantic vector match with the degree of consensus between vector and keyword search.

### Dependencies
- Phase 6 (Vector and Keyword search results active).

### Inputs
- List of Top-3 vector search results.
- List of Top-5 BM25 keyword search results.

### Outputs
- Composite Confidence Score float ($CS \in [0.0, 1.0]$).

---

## 2. Intended Folder Structure (Python AI Engine)

The confidence scorer layout:

```text
phoenix-ai/app/
└── services/
    └── confidence.py                # Composite Confidence Score logic
```

---

## 3. Mathematical Specifications

### Composite Confidence Score ($CS$) Formula:
  $$CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$$

### Scorer Details:
1.  **MaxSim**: The raw cosine similarity score of the top-ranked vector chunk.
2.  **Agreement**: A normalized consensus score calculated as:
    $$Agreement = \frac{|Vector_{top3} \cap BM25_{top5}|}{3}$$
    - Vector IDs of the Top-3 vector results are intersected with the Vector IDs of the Top-5 BM25 results.
    - Value is normalized by dividing the intersection count by 3 (yielding values $0.0$, $0.33$, $0.66$, or $1.0$).

---

## 4. Atomic Implementation Task List

### Task 7.1: Implement MaxSim Extractor
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 6.1
- **Description**: Implement helper to retrieve the highest similarity score from the raw vector search query results. 
- **Definition of Done**: Unit test verifies return value matches the maximum cosine score present in vector results.

### Task 7.2: Implement Agreement consensus calculator
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Tasks 6.1, 6.2
- **Description**: Implement logic to find the intersection count of chunk IDs between the Top-3 Vector and Top-5 BM25 search results, returning a scaled float value from $0.0$ to $1.0$.
- **Definition of Done**: Unit tests verify various overlap states return expected ratios (e.g. 0 matches returns `0.0`, 2 matches returns `0.667`, 3 matches returns `1.0`).

### Task 7.3: Implement Composite Confidence Score Formula
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Tasks 7.1, 7.2
- **Description**: Code the composite formula $CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$ inside `confidence.py`.
- **Definition of Done**: Functional method returns correct values; boundary assertions pass.

### Task 7.4: Write Unit Tests for Scorer combinations
- **Estimated Size**: S
- **Risk**: Low
- **Prerequisites**: Task 7.3
- **Description**: Create exhaustive test cases verifying extreme conditions:
  - MaxSim is high ($0.90$) but Agreement is $0.0$ (Score = $0.54$, Yellow).
  - MaxSim is low ($0.40$) but Agreement is $1.0$ (Score = $0.64$, Yellow).
  - MaxSim is high ($0.85$) and Agreement is $1.0$ (Score = $0.91$, Green).
  - MaxSim is low ($0.25$) and Agreement is $0.0$ (Score = $0.15$, Red).
- **Definition of Done**: All test scenarios execute and assert correct scoring calculations.
