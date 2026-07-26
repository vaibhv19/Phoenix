import uuid
import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Project, Document, DocumentChunk
from app.services.search_vector import VectorSearchService

@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_vector_search_success(db_session: Session):
    # 1. Create User, Project, Document
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"vector-test-{user_id}@example.com",
        password_hash="pass",
        full_name="Vector Test"
    )
    db_session.add(user)
    db_session.flush()
    
    proj_id = uuid.uuid4()
    project = Project(
        id=proj_id,
        user_id=user_id,
        name="Vector Project"
    )
    db_session.add(project)
    db_session.flush()

    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        project_id=proj_id,
        file_name="test_vector.pdf",
        status="PROCESSING",
        storage_path="/tmp/test.pdf"
    )
    db_session.add(doc)
    
    # Create another document to verify filtering
    other_doc_id = uuid.uuid4()
    other_doc = Document(
        id=other_doc_id,
        project_id=proj_id,
        file_name="test_vector_other.pdf",
        status="PROCESSING",
        storage_path="/tmp/other.pdf"
    )
    db_session.add(other_doc)
    db_session.commit()

    # Chunks: chunk 1 has embedding [1.0, 0.0, ...]
    # chunk 2 has embedding [0.0, 1.0, ...]
    # other doc chunk has embedding [1.0, 0.0, ...]
    embed_1 = [0.0] * 384
    embed_1[0] = 1.0
    
    embed_2 = [0.0] * 384
    embed_2[1] = 1.0
    
    chunk_1 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=0,
        vector_store_id="vector-1",
        content="This is chunk one text.",
        chunk_metadata={"page": 1},
        embedding=embed_1
    )
    chunk_2 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=1,
        vector_store_id="vector-2",
        content="This is chunk two text.",
        chunk_metadata={"page": 2},
        embedding=embed_2
    )
    chunk_other = DocumentChunk(
        id=uuid.uuid4(),
        document_id=other_doc_id,
        chunk_index=0,
        vector_store_id="vector-other",
        content="This is chunk other text.",
        chunk_metadata={"page": 1},
        embedding=embed_1
    )
    db_session.add(chunk_1)
    db_session.add(chunk_2)
    db_session.add(chunk_other)
    db_session.commit()

    try:
        # Search query embedding is exact match to embed_1
        query_embedding = embed_1
        results = VectorSearchService.search(db_session, doc_id, query_embedding, limit=5)
        
        # Verify result size and filtering
        assert len(results) == 2
        
        # Verify first result is chunk_1 with similarity 1.0
        assert results[0][0].id == chunk_1.id
        assert results[0][1] == pytest.approx(1.0, abs=1e-5)
        
        # Verify second result is chunk_2 with similarity 0.0
        assert results[1][0].id == chunk_2.id
        assert results[1][1] == pytest.approx(0.0, abs=1e-5)
        
        # Verify other document chunk was filtered out
        for chunk, _ in results:
            assert chunk.document_id == doc_id
            
    finally:
        # Cleanup
        db_session.query(DocumentChunk).filter(DocumentChunk.document_id.in_([doc_id, other_doc_id])).delete()
        db_session.query(Document).filter(Document.id.in_([doc_id, other_doc_id])).delete()
        db_session.query(Project).filter(Project.id == proj_id).delete()
        db_session.query(User).filter(User.id == user_id).delete()
        db_session.commit()
