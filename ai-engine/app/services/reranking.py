from typing import List, Tuple, Dict, Any
from app.models import DocumentChunk

class RerankingService:
    def __init__(self, provider: str = "mock", model_name: str = "ms-marco-MiniLM-L-6-v2"):
        self.provider = provider
        self.model_name = model_name
        self.ranker = None
        
        if self.provider != "mock":
            try:
                from flashrank import Ranker
                # Initialize default lightweight model
                self.ranker = Ranker(model_name=self.model_name)
            except Exception:
                # Fall back to mock on failure
                self.provider = "mock"

    def rerank(
        self,
        query: str,
        chunks: List[DocumentChunk],
        limit: int = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Rerank document chunks against the user query using FlashRank.
        Returns a list of (DocumentChunk, score) sorted in descending order of score.
        """
        if not chunks:
            return []

        if self.provider == "mock" or not self.ranker:
            # Deterministic mock scoring: chunks sorted with simulated scores
            reranked_mock = []
            for i, chunk in enumerate(chunks):
                # Simulated score from 0.85 downwards
                sim_score = max(0.0, min(1.0, 0.85 - (i * 0.05)))
                reranked_mock.append((chunk, sim_score))
            reranked_mock.sort(key=lambda x: x[1], reverse=True)
            return reranked_mock[:limit]

        try:
            from flashrank import RerankRequest
            
            # Format passages for FlashRank
            passages = [
                {
                    "id": str(chunk.id),
                    "text": chunk.content or ""
                }
                for chunk in chunks
            ]
            
            request = RerankRequest(query=query, passages=passages)
            results = self.ranker.rerank(request)
            
            # Map back to DocumentChunk objects
            chunk_map = {str(chunk.id): chunk for chunk in chunks}
            reranked = []
            for res in results:
                chunk_id = res["id"]
                score = float(res["score"])
                if chunk_id in chunk_map:
                    reranked.append((chunk_map[chunk_id], score))
                    
            return reranked[:limit]
            
        except Exception:
            # Fallback to mock on runtime error
            self.provider = "mock"
            return self.rerank(query, chunks, limit)
