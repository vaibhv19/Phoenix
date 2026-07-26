import pytest
from app.services.vector_store import EmbeddingService

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
