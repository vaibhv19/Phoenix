import uuid
import pytest
from app.models import DocumentChunk
from app.services.fusion import MinMaxScaler, WLCFusion

def test_minmax_scaler_standard():
    scores = [12.5, 6.0, 0.0]
    normalized = MinMaxScaler.normalize(scores)
    
    assert len(normalized) == 3
    # Check max value scales to ~1.0
    assert normalized[0] == pytest.approx(1.0, abs=1e-5)
    # Check middle value: (6.0 - 0.0) / (12.5 - 0.0) = 0.48
    assert normalized[1] == pytest.approx(0.48, abs=1e-5)
    # Check min value scales to 0.0
    assert normalized[2] == pytest.approx(0.0, abs=1e-5)

def test_minmax_scaler_identical():
    scores = [5.0, 5.0, 5.0]
    normalized = MinMaxScaler.normalize(scores)
    
    assert len(normalized) == 3
    assert all(val == 0.0 for val in normalized)

def test_minmax_scaler_empty():
    assert MinMaxScaler.normalize([]) == []

def test_wlc_fusion_success():
    doc_id = uuid.uuid4()
    
    # Create mock chunks
    chunk_a = DocumentChunk(id=uuid.uuid4(), document_id=doc_id, content="Chunk A")
    chunk_b = DocumentChunk(id=uuid.uuid4(), document_id=doc_id, content="Chunk B")
    chunk_c = DocumentChunk(id=uuid.uuid4(), document_id=doc_id, content="Chunk C")
    
    # Vector results: Chunk A has 0.8, Chunk B has 0.6
    vector_results = [
        (chunk_a, 0.8),
        (chunk_b, 0.6)
    ]
    
    # Keyword results (raw scores): Chunk B has 10.0, Chunk C has 5.0
    # In min-max, Chunk B gets 1.0, Chunk C gets 0.0
    keyword_results = [
        (chunk_b, 10.0),
        (chunk_c, 5.0)
    ]
    
    # Let's fuse with alpha = 0.7
    # For Chunk A: alpha * 0.8 + (1 - alpha) * 0.0 = 0.7 * 0.8 = 0.56
    # For Chunk B: alpha * 0.6 + (1 - alpha) * 1.0 = 0.7 * 0.6 + 0.3 * 1.0 = 0.42 + 0.30 = 0.72
    # For Chunk C: alpha * 0.0 + (1 - alpha) * 0.0 = 0.0
    
    fused_results = WLCFusion.fuse(vector_results, keyword_results, alpha=0.7)
    
    assert len(fused_results) == 3
    
    # Sorted order should be Chunk B, Chunk A, Chunk C
    assert fused_results[0][0].id == chunk_b.id
    assert fused_results[0][1] == pytest.approx(0.72, abs=1e-5)
    
    assert fused_results[1][0].id == chunk_a.id
    assert fused_results[1][1] == pytest.approx(0.56, abs=1e-5)
    
    assert fused_results[2][0].id == chunk_c.id
    assert fused_results[2][1] == pytest.approx(0.0, abs=1e-5)
