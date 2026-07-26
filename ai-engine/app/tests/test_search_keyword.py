import uuid
import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Project, Document, DocumentChunk
from app.services.search_keyword import custom_tokenizer, KeywordSearchService

def test_custom_tokenizer():
    text = "Hello, World! This is a simple test..."
    tokens = custom_tokenizer(text)
    
    # "this", "is", "a" are stop words and should be removed. Casing is lowercased. Punctuation removed.
    assert tokens == ["hello", "world", "simple", "test"]

@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_keyword_search_success(db_session: Session):
    # 1. Create User, Project, Document
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"keyword-test-{user_id}@example.com",
        password_hash="pass",
        full_name="Keyword Test"
    )
    db_session.add(user)
    db_session.flush()
    
    proj_id = uuid.uuid4()
    project = Project(
        id=proj_id,
        user_id=user_id,
        name="Keyword Project"
    )
    db_session.add(project)
    db_session.flush()

    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        project_id=proj_id,
        file_name="test_keyword.pdf",
        status="PROCESSING",
        storage_path="/tmp/test.pdf"
    )
    db_session.add(doc)
    
    # Create another document to verify filtering
    other_doc_id = uuid.uuid4()
    other_doc = Document(
        id=other_doc_id,
        project_id=proj_id,
        file_name="test_keyword_other.pdf",
        status="PROCESSING",
        storage_path="/tmp/other.pdf"
    )
    db_session.add(other_doc)
    db_session.commit()

    # Chunks
    chunk_1 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=0,
        vector_store_id="keyword-1",
        content="Retrieval engines use vector database systems.",
        chunk_metadata={"page": 1}
    )
    chunk_2 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=1,
        vector_store_id="keyword-2",
        content="Cooking recipes for chocolate chip cookies.",
        chunk_metadata={"page": 2}
    )
    # We add a third chunk to ensure the corpus size is 3, which allows BM25 to calculate
    # positive scores for terms that appear in only 1 of the documents.
    chunk_3 = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=2,
        vector_store_id="keyword-3",
        content="Gardening tips for growing organic tomatoes.",
        chunk_metadata={"page": 3}
    )
    chunk_other = DocumentChunk(
        id=uuid.uuid4(),
        document_id=other_doc_id,
        chunk_index=0,
        vector_store_id="keyword-other",
        content="Retrieval engines search for vector documents.",
        chunk_metadata={"page": 1}
    )
    db_session.add(chunk_1)
    db_session.add(chunk_2)
    db_session.add(chunk_3)
    db_session.add(chunk_other)
    db_session.commit()

    try:
        # Search query is "vector engines"
        # chunk_1 contains "vector" and "engines", so it should have a positive score
        # chunk_2 and chunk_3 have no overlap, so they should have score 0.0
        results = KeywordSearchService.search(db_session, doc_id, "vector engines", limit=5)
        
        # Verify size and filtering
        assert len(results) == 3
        
        # Verify chunk_1 is first and has score > 0
        assert results[0][0].id == chunk_1.id
        assert results[0][1] > 0.0
        
        # Verify chunk_2 and chunk_3 are scored 0.0
        assert results[1][1] == 0.0
        assert results[2][1] == 0.0
        
        # Verify other document chunk was filtered out
        for chunk, _ in results:
            assert chunk.document_id == doc_id
            
        # Test search with no limit
        all_results = KeywordSearchService.search(db_session, doc_id, "vector engines", limit=None)
        assert len(all_results) == 3
        
    finally:
        # Cleanup
        db_session.query(DocumentChunk).filter(DocumentChunk.document_id.in_([doc_id, other_doc_id])).delete()
        db_session.query(Document).filter(Document.id.in_([doc_id, other_doc_id])).delete()
        db_session.query(Project).filter(Project.id == proj_id).delete()
        db_session.query(User).filter(User.id == user_id).delete()
        db_session.commit()
