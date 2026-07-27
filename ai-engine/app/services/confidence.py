import uuid
from typing import List, Tuple
from app.models import DocumentChunk

class MaxSimExtractor:
    @staticmethod
    def extract(vector_results: List[Tuple[DocumentChunk, float]]) -> float:
        """
        Extract the maximum cosine similarity score from vector results.
        Since vector_results are sorted in descending order, this is the first score.
        Clamps the score strictly to the range [0.0, 1.0].
        """
        if not vector_results:
            return 0.0
        score = vector_results[0][1]
        return max(0.0, min(1.0, float(score)))

class AgreementCalculator:
    @staticmethod
    def calculate(
        vector_results: List[Tuple[DocumentChunk, float]],
        keyword_results: List[Tuple[DocumentChunk, float]]
    ) -> float:
        """
        Calculate consensus agreement score:
        Agreement = |Vector_top3 ∩ BM25_top5| / 3
        """
        top3_vector_ids = {chunk.id for chunk, _ in vector_results[:3]}
        top5_keyword_ids = {chunk.id for chunk, _ in keyword_results[:5]}
        
        if not top3_vector_ids:
            return 0.0
            
        intersection = top3_vector_ids.intersection(top5_keyword_ids)
        return len(intersection) / 3.0

class ConfidenceService:
    @staticmethod
    def calculate_confidence(
        vector_results: List[Tuple[DocumentChunk, float]],
        keyword_results: List[Tuple[DocumentChunk, float]]
    ) -> float:
        """
        Compute Composite Confidence Score (CS):
        CS = 0.6 * MaxSim + 0.4 * Agreement
        """
        max_sim = MaxSimExtractor.extract(vector_results)
        agreement = AgreementCalculator.calculate(vector_results, keyword_results)
        
        cs = 0.6 * max_sim + 0.4 * agreement
        return max(0.0, min(1.0, cs))
