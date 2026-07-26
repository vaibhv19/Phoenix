from typing import List, Tuple
from app.models import DocumentChunk

class MinMaxScaler:
    @staticmethod
    def normalize(scores: List[float]) -> List[float]:
        """
        Normalize raw BM25 scores in a query batch using MinMaxScaler.
        If all scores are identical, return [0.0] for all to prevent division-by-zero.
        Scale output strictly to [0.0, 1.0].
        """
        if not scores:
            return []
        min_val = min(scores)
        max_val = max(scores)
        diff = max_val - min_val
        epsilon = 1e-6
        
        normalized = []
        for s in scores:
            norm_s = (s - min_val) / (diff + epsilon)
            # Clamp strictly to [0.0, 1.0]
            norm_s = max(0.0, min(1.0, norm_s))
            normalized.append(norm_s)
        return normalized

class WLCFusion:
    @staticmethod
    def fuse(
        vector_results: List[Tuple[DocumentChunk, float]],
        keyword_results: List[Tuple[DocumentChunk, float]],
        alpha: float = 0.7
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Fuse vector search results and normalized BM25 search results
        using a Weighted Linear Combination (WLC) score fusion.
        Match chunks across both lists by their database primary keys.
        Sort in descending order of final fused scores.
        """
        # If keyword results is provided, extract and normalize their raw scores.
        if keyword_results:
            raw_keyword_scores = [score for _, score in keyword_results]
            normalized_keyword_scores = MinMaxScaler.normalize(raw_keyword_scores)
            keyword_map = {
                chunk.id: score 
                for (chunk, _), score in zip(keyword_results, normalized_keyword_scores)
            }
        else:
            keyword_map = {}

        vector_map = {chunk.id: score for chunk, score in vector_results}

        # Gather all unique chunks by ID
        unique_chunks = {}
        for chunk, _ in vector_results:
            unique_chunks[chunk.id] = chunk
        for chunk, _ in keyword_results:
            unique_chunks[chunk.id] = chunk

        # Compute fused score for each unique chunk
        fused = []
        for chunk_id, chunk in unique_chunks.items():
            sim_vector = vector_map.get(chunk_id, 0.0)
            score_bm25_norm = keyword_map.get(chunk_id, 0.0)
            
            # WLC Fusion Formula
            score_final = alpha * sim_vector + (1.0 - alpha) * score_bm25_norm
            fused.append((chunk, score_final))

        # Sort in descending order of the final fused scores
        fused.sort(key=lambda x: x[1], reverse=True)
        return fused
