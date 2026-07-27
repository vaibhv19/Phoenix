import uuid
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.models import DocumentChunk
from app.services.fallback import FallbackOrchestrator, ReasoningStepDto
from app.services.retrieval import RetrievalService
from app.services.llm import LLMService
from app.services.reranking import RerankingService

client = TestClient(app)

@pytest.fixture
def mock_retrieval_service():
    service = MagicMock(spec=RetrievalService)
    service.embedding_service = MagicMock()
    service.embedding_service.embed_text.return_value = [0.1] * 384
    service.db = MagicMock()
    return service

@pytest.fixture
def mock_llm_service():
    service = MagicMock(spec=LLMService)
    service.generate_answer.return_value = "Mocked LLM Answer"
    service.rewrite_query.return_value = "Mocked Rewritten Query"
    service.generate_clarification.return_value = "Mocked Clarification Question"
    return service

@pytest.fixture
def mock_reranking_service():
    service = MagicMock(spec=RerankingService)
    return service

def test_orchestrator_green_path(mock_retrieval_service, mock_llm_service, mock_reranking_service):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="Green content")
    
    mock_retrieval_service.retrieve_hybrid.return_value = ([(chunk, 0.85)], 0.85)
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.85
    assert "Mocked LLM Answer" in result["answer"]
    assert len(result["reasoningTrace"]) == 2
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "ANSWER_GENERATION"
    assert len(result["matches"]) == 1

def test_orchestrator_yellow_path_success(mock_retrieval_service, mock_llm_service, mock_reranking_service):
    doc_id = uuid.uuid4()
    chunk1 = DocumentChunk(id=uuid.uuid4(), content="Yellow 1")
    chunk2 = DocumentChunk(id=uuid.uuid4(), content="Yellow 2")
    
    mock_retrieval_service.retrieve_hybrid.side_effect = [
        ([(chunk1, 0.60)], 0.60),
        ([(chunk2, 0.78)], 0.78)
    ]
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.78
    assert len(result["reasoningTrace"]) == 3
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "FALLBACK_REWRITE"
    assert result["reasoningTrace"][2].state == "ANSWER_GENERATION"
    assert len(result["matches"]) == 1
    assert result["matches"][0][0].content == "Yellow 2"

@patch("app.services.fallback.VectorSearchService.search")
@patch("app.services.fallback.KeywordSearchService.search")
@patch("app.services.fallback.WLCFusion.fuse")
def test_orchestrator_orange_path_success(mock_fuse, mock_keyword, mock_vector, mock_retrieval_service, mock_llm_service, mock_reranking_service):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="Orange content")
    
    mock_retrieval_service.retrieve_hybrid.return_value = ([(chunk, 0.45)], 0.45)
    
    mock_vector.return_value = []
    mock_keyword.return_value = []
    mock_fuse.return_value = [(chunk, 0.45)]
    
    mock_reranking_service.rerank.return_value = [(chunk, 0.55)]
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.55
    assert len(result["reasoningTrace"]) == 4
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "FALLBACK_RERANK"
    assert result["reasoningTrace"][2].state == "RERANK_EVALUATION"
    assert result["reasoningTrace"][3].state == "ANSWER_GENERATION"
    assert len(result["matches"]) == 1

@patch("app.services.fallback.VectorSearchService.search")
def test_orchestrator_red_path(mock_vector, mock_retrieval_service, mock_llm_service, mock_reranking_service):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="Red content")
    
    mock_retrieval_service.retrieve_hybrid.return_value = ([(chunk, 0.20)], 0.20)
    mock_vector.return_value = [(chunk, 0.20)]
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.20
    assert result["answer"] == "Mocked Clarification Question"
    assert len(result["reasoningTrace"]) == 3
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "FALLBACK_CLARIFY"
    assert result["reasoningTrace"][2].state == "CLARIFICATION_GENERATION"
    assert len(result["matches"]) == 0

@patch("app.main.FallbackOrchestrator.process_query")
def test_process_endpoint_success(mock_process):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="API content")
    
    mock_process.return_value = {
        "answer": "API Answer",
        "confidenceScore": 0.85,
        "reasoningTrace": [
            ReasoningStepDto(state="INITIAL_RETRIEVAL", confidenceScore=0.85, description="Initial"),
            ReasoningStepDto(state="ANSWER_GENERATION", confidenceScore=0.85, description="Generated")
        ],
        "matches": [(chunk, 0.85)]
    }
    
    payload = {
        "documentId": str(doc_id),
        "query": "Who is Phoenix?",
        "limit": 5,
        "alpha": 0.7
    }
    
    response = client.post("/internal/v1/process", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["answer"] == "API Answer"
    assert data["confidenceScore"] == 0.85
    assert len(data["reasoningTrace"]) == 2
    assert data["reasoningTrace"][0]["state"] == "INITIAL_RETRIEVAL"
    assert len(data["matches"]) == 1
    assert data["matches"][0]["content"] == "API content"

@patch("app.services.fallback.VectorSearchService.search")
@patch("app.services.fallback.KeywordSearchService.search")
@patch("app.services.fallback.WLCFusion.fuse")
def test_orchestrator_yellow_path_escalates_to_orange(
    mock_fuse, mock_keyword, mock_vector,
    mock_retrieval_service, mock_llm_service, mock_reranking_service
):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="Escalated Orange content")
    
    # cs_1 = 0.60 (yellow), cs_2 = 0.40 (orange/escalated)
    mock_retrieval_service.retrieve_hybrid.side_effect = [
        ([], 0.60),
        ([], 0.40)
    ]
    
    mock_vector.return_value = []
    mock_keyword.return_value = []
    mock_fuse.return_value = [(chunk, 0.40)]
    mock_reranking_service.rerank.return_value = [(chunk, 0.55)]
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.55
    assert len(result["reasoningTrace"]) == 5
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "FALLBACK_REWRITE"
    assert result["reasoningTrace"][2].state == "ESCALATION"
    assert result["reasoningTrace"][3].state == "RERANK_EVALUATION"
    assert result["reasoningTrace"][4].state == "ANSWER_GENERATION"
    assert len(result["matches"]) == 1

@patch("app.services.fallback.VectorSearchService.search")
@patch("app.services.fallback.KeywordSearchService.search")
@patch("app.services.fallback.WLCFusion.fuse")
def test_orchestrator_orange_path_escalates_to_red(
    mock_fuse, mock_keyword, mock_vector,
    mock_retrieval_service, mock_llm_service, mock_reranking_service
):
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(id=uuid.uuid4(), content="Low rerank content")
    
    # cs_1 = 0.45 (orange)
    mock_retrieval_service.retrieve_hybrid.return_value = ([], 0.45)
    
    mock_vector.return_value = [(chunk, 0.30)]
    mock_keyword.return_value = []
    mock_fuse.return_value = [(chunk, 0.45)]
    mock_reranking_service.rerank.return_value = [(chunk, 0.30)] # rs = 0.30 (red/escalated)
    
    orchestrator = FallbackOrchestrator(mock_retrieval_service, mock_llm_service, mock_reranking_service)
    result = orchestrator.process_query(doc_id, "Test query")
    
    assert result["confidenceScore"] == 0.30
    assert result["answer"] == "Mocked Clarification Question"
    assert len(result["reasoningTrace"]) == 5
    assert result["reasoningTrace"][0].state == "INITIAL_RETRIEVAL"
    assert result["reasoningTrace"][1].state == "FALLBACK_RERANK"
    assert result["reasoningTrace"][2].state == "RERANK_EVALUATION"
    assert result["reasoningTrace"][3].state == "ESCALATION"
    assert result["reasoningTrace"][4].state == "CLARIFICATION_GENERATION"
    assert len(result["matches"]) == 0
