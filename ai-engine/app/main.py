import time
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.services.ingestion import PDFExtractor, DocumentChunker
from app.services.vector_store import EmbeddingService, VectorStoreService
from app.services.retrieval import RetrievalService

app = FastAPI(title=settings.app_name)

# Initialize embedding service singleton at startup
embedding_service = EmbeddingService()

class IngestConfig(BaseModel):
    chunkSize: int
    chunkOverlap: int

class IngestRequest(BaseModel):
    documentId: UUID
    filePath: str
    config: IngestConfig

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/internal/v1/ingest")
def ingest_document(request: IngestRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        # 1. Parse text from pages
        pages = PDFExtractor.extract_pages(request.filePath)
        
        # 2. Split pages into semantic chunks
        chunks = DocumentChunker.chunk_pages(
            pages,
            chunk_size=request.config.chunkSize,
            chunk_overlap=request.config.chunkOverlap
        )
        
        if not chunks:
            raise ValueError("No text chunks could be extracted from PDF file.")
        
        # 3. Generate dense vectors
        texts = [c["content"] for c in chunks]
        embeddings = embedding_service.embed_batch(texts)
        
        # 4. Persist chunks in vector store
        inserted_count = VectorStoreService.insert_document_chunks(
            db,
            request.documentId,
            chunks,
            embeddings
        )
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            "documentId": request.documentId,
            "chunkCount": inserted_count,
            "embeddingStatus": "COMPLETED",
            "vectorIndexName": f"idx_doc_{request.documentId}",
            "processingTimeMs": processing_time_ms
        }
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        return {
            "documentId": request.documentId,
            "chunkCount": 0,
            "embeddingStatus": "FAILED",
            "vectorIndexName": "",
            "processingTimeMs": processing_time_ms
        }

class RetrievalRequest(BaseModel):
    documentId: UUID
    query: str
    limit: int = 5
    alpha: float = 0.7

@app.post("/internal/v1/process-base")
def process_base_retrieval(
    request: RetrievalRequest,
    db: Session = Depends(get_db)
):
    try:
        retrieval_service = RetrievalService(db, embedding_service)
        results, confidence_score = retrieval_service.retrieve_hybrid(
            document_id=request.documentId,
            query=request.query,
            limit=request.limit,
            alpha=request.alpha
        )
        
        matches = []
        for chunk, score in results:
            matches.append({
                "id": str(chunk.id),
                "documentId": str(chunk.document_id),
                "chunkIndex": chunk.chunk_index,
                "content": chunk.content,
                "metadata": chunk.chunk_metadata,
                "score": score
            })
            
        return {
            "documentId": request.documentId,
            "query": request.query,
            "matches": matches,
            "confidenceScore": confidence_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

