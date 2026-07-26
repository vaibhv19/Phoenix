import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Project, Document, DocumentChunk
from app.services.retrieval import RetrievalService
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_retrieval_service_and_endpoint(db_session: Session):
    # 1. Setup DB objects
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"retrieval-test-{user_id}@example.com",
        password_hash="pass",
        full_name="Retrieval Test"
    )
    db_session.add(user)
    db_session.flush()
    
    proj_id = uuid.uuid4()
    project = Project(
        id=proj_id,
        user_id=user_id,
        name="Retrieval Project"
    )
    db_session.add(project)
    db_session.flush()

    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        project_id=proj_id,
        file_name="test_retrieval.pdf",
        status="PROCESSING",
        storage_path="/tmp/test.pdf"
    )
    db_session.add(doc)
    db_session.commit()

    # Chunks
    embed_1 = [0.0] * 384
    embed_1[0], embed_1[1] = 0.5, 0.5
    
    embed_2 = [0.0] * 384
    embed_2[0], embed_2[1] = 0.9, 0.1
    
    embed_3 = [0.0] * 384
    embed_3[1] = 1.0
    
    chunk_1 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=0,
        vector_store_id="ret-1",
        content="Machine learning and artificial intelligence.",
        chunk_metadata={"page": 1},
        embedding=embed_1
    )
    chunk_2 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=1,
        vector_store_id="ret-2",
        content="Vector databases search dense embeddings.",
        chunk_metadata={"page": 2},
        embedding=embed_2
    )
    chunk_3 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=2,
        vector_store_id="ret-3",
        content="Cooking pasta with tomato sauce.",
        chunk_metadata={"page": 3},
        embedding=embed_3
    )
    
    db_session.add(chunk_1)
    db_session.add(chunk_2)
    db_session.add(chunk_3)
    db_session.commit()

    try:
        # 1. Test RetrievalService directly with a mocked EmbeddingService
        class MockEmbeddingService:
            def embed_text(self, text: str):
                emb = [0.0] * 384
                emb[0] = 1.0
                return emb

        mock_emb = MockEmbeddingService()
        retrieval_service = RetrievalService(db_session, mock_emb)
        
        # Query "vector databases"
        #
        # Cosine Similarity is: dot_product(u, v) / (norm(u) * norm(v))
        # Query: [1.0, 0.0, ...] -> norm = 1.0
        # Chunk 2: [0.9, 0.1, ...] -> norm = sqrt(0.82) ≈ 0.9055385. dot = 0.9. sim = 0.9 / 0.9055385 ≈ 0.9938837
        # Chunk 1: [0.5, 0.5, ...] -> norm = sqrt(0.5) ≈ 0.7071068. dot = 0.5. sim = 0.5 / 0.7071068 ≈ 0.7071068
        # Chunk 3: [0.0, 1.0, ...] -> norm = 1.0. dot = 0.0. sim = 0.0
        #
        # Keyword BM25 scores:
        # Chunk 2 has both "vector" and "databases" -> positive score
        # Others have 0.0 score.
        # Normalized BM25: Chunk 2: 1.0, Chunk 1: 0.0, Chunk 3: 0.0.
        # Fused scores (alpha = 0.7):
        # Chunk 2: 0.7 * 0.9938837 + 0.3 * 1.0 = 0.9957186
        # Chunk 1: 0.7 * 0.7071068 + 0.3 * 0.0 = 0.4949748
        # Chunk 3: 0.7 * 0.0 + 0.3 * 0.0 = 0.0
        
        results = retrieval_service.retrieve_hybrid(
            document_id=doc_id,
            query="vector databases",
            limit=3,
            alpha=0.7
        )
        
        assert len(results) == 3
        assert results[0][0].id == chunk_2.id
        assert results[0][1] == pytest.approx(0.9957186, abs=1e-5)
        
        assert results[1][0].id == chunk_1.id
        assert results[1][1] == pytest.approx(0.4949748, abs=1e-5)
        
        assert results[2][0].id == chunk_3.id
        assert results[2][1] == pytest.approx(0.0, abs=1e-5)

        # 2. Test FastAPI endpoint (uses real EmbeddingService sentence-transformer)
        payload = {
            "documentId": str(doc_id),
            "query": "vector databases search",
            "limit": 2,
            "alpha": 0.7
        }
        response = client.post("/internal/v1/process-base", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["documentId"] == str(doc_id)
        assert data["query"] == "vector databases search"
        assert len(data["matches"]) == 2
        
        # Chunk 2 should be the top match
        assert data["matches"][0]["id"] == str(chunk_2.id)
        assert data["matches"][0]["content"] == "Vector databases search dense embeddings."
        assert data["matches"][0]["score"] > 0.0

    finally:
        # Cleanup
        db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db_session.query(Document).filter(Document.id == doc_id).delete()
        db_session.query(Project).filter(Project.id == proj_id).delete()
        db_session.query(User).filter(User.id == user_id).delete()
        db_session.commit()
