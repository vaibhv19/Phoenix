import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("app.main.PDFExtractor.extract_pages")
@patch("app.main.VectorStoreService.insert_document_chunks")
def test_ingest_document_endpoint_success(mock_insert, mock_extract):
    mock_extract.return_value = [
        {"page": 1, "text": "This is page 1 content. Technical documentation."}
    ]
    mock_insert.return_value = 1

    doc_id = uuid.uuid4()
    payload = {
        "documentId": str(doc_id),
        "filePath": "dummy.pdf",
        "config": {
            "chunkSize": 800,
            "chunkOverlap": 150
        }
    }

    response = client.post("/internal/v1/ingest", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["documentId"] == str(doc_id)
    assert data["chunkCount"] == 1
    assert data["embeddingStatus"] == "COMPLETED"
    assert "vectorIndexName" in data
    assert data["processingTimeMs"] >= 0

@patch("app.main.PDFExtractor.extract_pages")
def test_ingest_document_endpoint_failure(mock_extract):
    mock_extract.side_effect = RuntimeError("Failed to read PDF")

    doc_id = uuid.uuid4()
    payload = {
        "documentId": str(doc_id),
        "filePath": "dummy.pdf",
        "config": {
            "chunkSize": 800,
            "chunkOverlap": 150
        }
    }

    response = client.post("/internal/v1/ingest", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["documentId"] == str(doc_id)
    assert data["chunkCount"] == 0
    assert data["embeddingStatus"] == "FAILED"
