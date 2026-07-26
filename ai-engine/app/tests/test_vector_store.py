import uuid
import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Project, Document, DocumentChunk
from app.services.vector_store import EmbeddingService, VectorStoreService

@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_embedding_service_success():
    service = EmbeddingService()
    text = "Hello Phoenix AI Engine"
    vector = service.embed_text(text)

    assert isinstance(vector, list)
    assert len(vector) == 384
    assert all(isinstance(val, float) for val in vector)

def test_embedding_service_batch():
    service = EmbeddingService()
    texts = ["First chunk text", "Second chunk text"]
    vectors = service.embed_batch(texts)

    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384

def test_insert_document_chunks_db(db_session: Session):
    # 1. Create User and flush
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"integration-{user_id}@example.com",
        password_hash="pass",
        full_name="Integration Test"
    )
    db_session.add(user)
    db_session.flush()
    
    # 2. Create Project and flush
    proj_id = uuid.uuid4()
    project = Project(
        id=proj_id,
        user_id=user_id,
        name="Integration Project"
    )
    db_session.add(project)
    db_session.flush()

    # 3. Create parent document to satisfy Foreign Key constraint
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        project_id=proj_id,
        file_name="test_integration.pdf",
        status="PROCESSING",
        storage_path="/tmp/test.pdf"
    )
    db_session.add(doc)
    db_session.commit()

    # Setup chunks and mock embeddings
    chunks = [
        {"chunk_index": 0, "content": "Chunk 1 Content", "metadata": {"page_number": 1}},
        {"chunk_index": 1, "content": "Chunk 2 Content", "metadata": {"page_number": 2}}
    ]
    embeddings = [
        [0.1] * 384,
        [0.2] * 384
    ]

    try:
        # Call insertion service
        inserted_count = VectorStoreService.insert_document_chunks(
            db_session,
            doc_id,
            chunks,
            embeddings
        )

        assert inserted_count == 2

        # Verify insertion and data types
        db_chunks = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).all()
        assert len(db_chunks) == 2
        assert db_chunks[0].content == "Chunk 1 Content"
        assert db_chunks[0].chunk_metadata == {"page_number": 1}
        assert len(db_chunks[0].embedding) == 384

        # Test idempotency (re-inserting overwrites previous)
        new_chunks = [
            {"chunk_index": 0, "content": "Updated Chunk 1", "metadata": {"page_number": 1}}
        ]
        new_embeddings = [
            [0.3] * 384
        ]
        
        re_inserted_count = VectorStoreService.insert_document_chunks(
            db_session,
            doc_id,
            new_chunks,
            new_embeddings
        )
        assert re_inserted_count == 1

        db_chunks_after = db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
        assert len(db_chunks_after) == 1
        assert db_chunks_after[0].content == "Updated Chunk 1"

    finally:
        # Clear out test database records in reverse dependency order
        db_session.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db_session.query(Document).filter(Document.id == doc_id).delete()
        db_session.query(Project).filter(Project.id == proj_id).delete()
        db_session.query(User).filter(User.id == user_id).delete()
        db_session.commit()
