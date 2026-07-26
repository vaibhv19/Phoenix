import uuid
from typing import List, Tuple
from sqlalchemy import cast, Float
from sqlalchemy.orm import Session
from app.models import DocumentChunk

class VectorSearchService:
    @staticmethod
    def search(
        db: Session,
        document_id: uuid.UUID,
        query_embedding: List[float],
        limit: int = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Execute cosine similarity search on DocumentChunk using pgvector.
        Limits the query to the parent document_id.
        Returns a list of tuples (DocumentChunk, similarity_score).
        """
        # Cosine distance in pgvector SQLAlchemy is represented by the `<=>` operator.
        # We cast the resulting expression to Float to prevent SQLAlchemy from propagating
        # the Vector type to arithmetic operations like (1.0 - cosine_distance).
        cosine_distance = cast(
            DocumentChunk.embedding.op('<=>')(query_embedding),
            Float
        )
        
        # Cosine Similarity is 1.0 - Cosine Distance
        results = db.query(
            DocumentChunk,
            (1.0 - cosine_distance).label("similarity")
        ).filter(
            DocumentChunk.document_id == document_id
        ).order_by(
            cosine_distance
        ).limit(
            limit
        ).all()
        
        return [(chunk, float(similarity)) for chunk, similarity in results]
