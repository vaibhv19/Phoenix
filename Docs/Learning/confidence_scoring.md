# Engineering Note — Confidence Scoring Engine

## 1. Problem Being Solved
When building RAG (Retrieval-Augmented Generation) applications, retrieving context blindly from a database and sending it to an LLM is a major cause of hallucinations. If the query is completely irrelevant to the database documents, or the database contains no useful information on the topic, both vector search and keyword search will still return results—with low similarity or zero semantic overlap. The Confidence Scoring Engine evaluates the reliability and precision of the retrieved document context prior to passing it to subsequent RAG or generation layers.

## 2. Why This Approach Was Selected
We selected a Composite Confidence Scoring ($CS$) system that combines:
1. **Absolute strength of the semantic match** (`MaxSim`): Cosine similarity of the top-ranked vector search result.
2. **Consensus between search paradigms** (`Agreement`): The overlap between the Top-3 vector search results and the Top-5 BM25 keyword search results.

This approach balances semantic understanding (vector match score) with exact keyword presence (BM25 matches). Weighing them dynamically ($CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$) ensures that even if semantic match is moderately high, lack of keyword overlap pulls down the score, and vice versa.

## 3. Mathematical Intuition

### MaxSim
MaxSim represents the highest similarity score obtained from vector search:
$$MaxSim = \max(Sim(v_i, q))$$
For cosine similarity, this resides in $[0.0, 1.0]$ for relevant documents.

### Agreement consensus metric
Agreement checks the consensus between vector space relevance and exact token match relevance.
$$Agreement = \frac{|Vector_{top3} \cap BM25_{top5}|}{3}$$
Dividing by 3 normalizes the score into discrete buckets: $0.0$ (no overlap), $0.33$, $0.66$, or $1.0$ (perfect consensus).

### Composite Confidence Score ($CS$)
$$CS = 0.6 \cdot MaxSim + 0.4 \cdot Agreement$$
This yields a unified metric $CS \in [0.0, 1.0]$. 
Based on $CS$, retrieval quality can be classified as:
- **Green** ($CS \geq 0.75$): Highly reliable context.
- **Yellow** ($0.50 \le CS < 0.75$): Partially reliable context (triggers Query Rewriting).
- **Orange** ($0.35 \le CS < 0.50$): Marginal context (triggers FlashRank Reranking).
- **Red** ($CS < 0.35$): Unreliable context (triggers Clarification Question).

## 4. Alternative Approaches
- **Pure Semantic Cutoff**: Setting a hard threshold on the cosine similarity score. While simple, cosine similarity thresholds are highly sensitive to embedding models, corpus distribution, and query lengths, leading to high false positive/negative rates.
- **LLM-Based Evaluation**: Prompting an LLM to evaluate if the context matches the query. While accurate, it introduces significant latency (hundreds of milliseconds or seconds) and cost. Our mathematical scoring runs in less than a millisecond.

## 5. Phoenix-Specific Implementation & Usage
The confidence scoring logic is written inside `app/services/confidence.py` using three classes:
* `MaxSimExtractor`: Retrieves the first score in the sorted vector search list and clamps it to $[0.0, 1.0]$.
* `AgreementCalculator`: Extracts and intersects chunk IDs from the Top-3 vector results and Top-5 keyword results.
* `ConfidenceService`: Computes the weighted composite score.

It is coordinated by `RetrievalService.retrieve_hybrid` and returned through the baseline endpoint:
`POST /internal/v1/process-base` -> `"confidenceScore": float`

## 6. Common Pitfalls & Debugging Tips
- **List Index Bounds**: When the document corpus has fewer than 3 chunks in total, `vector_results[:3]` and `keyword_results[:5]` will return fewer items. Python slices handle this gracefully without throwing `IndexError`, but tests must account for the lower counts when calculating the denominator of Agreement.
- **Arbitrary Ordering of 0.0 BM25 Scores**: In a very small corpus, chunks with $0.0$ BM25 scores are still returned by `KeywordSearchService` because `limit=None` scores the entire corpus. If not careful, these can match vector chunks and falsely inflate the agreement count.
  *Fix*: Set default scores and order them carefully.

## 7. Interview Discussion Points
- **Q**: What happens to confidence scoring if a document is very short (e.g. 1 chunk)?
  *A*: If a document has only 1 chunk, the intersection size can be at most 1. The maximum Agreement is $1 / 3 \approx 0.333$. The Composite Confidence Score will be lower (max $CS = 0.6 \cdot 1.0 + 0.4 \cdot 0.333 \approx 0.733$), which is classified as Yellow. This correctly reflects that short document contexts have less corroborating consensus data.
- **Q**: Can the weights of MaxSim and Agreement be adjusted?
  *A*: Yes, the weights are currently hardcoded to $0.6$ and $0.4$, but they can easily be parameterized or dynamically computed in future iterations depending on the corpus type.
