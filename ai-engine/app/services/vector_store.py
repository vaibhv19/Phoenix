import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from app.models import DocumentChunk
from app.config import settings

class EmbeddingService:
    def __init__(self, model_name: str = None):
        if model_name is None:
            model_name = settings.embedding_model
        self.model = SentenceTransformer(model_name)

    def embed_text(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional embedding vector for the input text.
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a batch of texts.
        """
        if not texts:
            return []
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

class VectorStoreService:
    @staticmethod
    def insert_document_chunks(
        db: Session,
        document_id: uuid.UUID,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> int:
        """
        Deletes existing chunks for the document_id, then inserts the new chunks and embeddings.
        Returns the number of chunks inserted.
        """
        # Delete existing chunks for idempotency
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

        # Insert new chunks
        for i, chunk in enumerate(chunks):
            chunk_uuid = uuid.uuid4()
            db_chunk = DocumentChunk(
                id=chunk_uuid,
                document_id=document_id,
                chunk_index=chunk["chunk_index"],
                vector_store_id=str(chunk_uuid),
                content=chunk["content"],
                chunk_metadata=chunk["metadata"],
                embedding=embeddings[i]
            )
            db.add(db_chunk)

        db.commit()
        return len(chunks)
