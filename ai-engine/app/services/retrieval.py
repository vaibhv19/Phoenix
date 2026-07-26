import uuid
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.services.vector_store import EmbeddingService
from app.services.search_vector import VectorSearchService
from app.services.search_keyword import KeywordSearchService
from app.services.fusion import WLCFusion
from app.models import DocumentChunk

class RetrievalService:
    def __init__(self, db: Session, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    def retrieve_hybrid(
        self,
        document_id: uuid.UUID,
        query: str,
        limit: int = 5,
        alpha: float = 0.7
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Coordinated hybrid retrieval:
        1. Generates the embedding for the query.
        2. Retrieves top vector matches (fetches limit * 2 candidate chunks).
        3. Retrieves keyword matches for all chunks in the document.
        4. Fuses the results using MinMaxScaler normalization and WLC fusion.
        5. Returns the top 'limit' fused matches.
        """
        # 1. Generate query embedding
        query_embedding = self.embedding_service.embed_text(query)
        
        # 2. Vector search (fetch limit * 2 candidate chunks to ensure good fusion coverage)
        vector_limit = limit * 2
        vector_results = VectorSearchService.search(
            self.db,
            document_id=document_id,
            query_embedding=query_embedding,
            limit=vector_limit
        )
        
        # 3. Keyword search (score all chunks for the document to get comprehensive BM25 coverage)
        keyword_results = KeywordSearchService.search(
            self.db,
            document_id=document_id,
            query_str=query,
            limit=None  # None scores all chunks
        )
        
        # 4. Fuse scores
        fused_results = WLCFusion.fuse(
            vector_results=vector_results,
            keyword_results=keyword_results,
            alpha=alpha
        )
        
        # 5. Return top 'limit' results
        return fused_results[:limit]
