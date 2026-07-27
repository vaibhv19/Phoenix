import uuid
import pytest
from app.models import DocumentChunk
from app.services.confidence import MaxSimExtractor, AgreementCalculator, ConfidenceService

def create_mock_chunk(chunk_id=None):
    return DocumentChunk(
        id=chunk_id or uuid.uuid4(),
        document_id=uuid.uuid4(),
        content="Dummy content",
        chunk_index=0
    )

def test_maxsim_extractor():
    # 1. Standard list
    chunk_a = create_mock_chunk()
    chunk_b = create_mock_chunk()
    vector_results = [
        (chunk_a, 0.85),
        (chunk_b, 0.60)
    ]
    assert MaxSimExtractor.extract(vector_results) == pytest.approx(0.85)

    # 2. Empty list
    assert MaxSimExtractor.extract([]) == 0.0

    # 3. Clamping checks
    vector_results_high = [(chunk_a, 1.2)]
    assert MaxSimExtractor.extract(vector_results_high) == 1.0

    vector_results_low = [(chunk_a, -0.5)]
    assert MaxSimExtractor.extract(vector_results_low) == 0.0

def test_agreement_calculator():
    # Setup mock chunks
    chunk_1 = create_mock_chunk()
    chunk_2 = create_mock_chunk()
    chunk_3 = create_mock_chunk()
    chunk_4 = create_mock_chunk()
    chunk_5 = create_mock_chunk()
    chunk_6 = create_mock_chunk()

    # Top 3 Vector
    vector_results = [
        (chunk_1, 0.9),
        (chunk_2, 0.8),
        (chunk_3, 0.7)
    ]

    # 1. 0 Matches
    keyword_results_0 = [
        (chunk_4, 10.0),
        (chunk_5, 9.0),
        (chunk_6, 8.0)
    ]
    assert AgreementCalculator.calculate(vector_results, keyword_results_0) == 0.0

    # 2. 1 Match (chunk_1 matches)
    keyword_results_1 = [
        (chunk_1, 10.0),
        (chunk_4, 9.0),
        (chunk_5, 8.0)
    ]
    assert AgreementCalculator.calculate(vector_results, keyword_results_1) == pytest.approx(0.33333, abs=1e-4)

    # 3. 2 Matches (chunk_1, chunk_3 match)
    keyword_results_2 = [
        (chunk_1, 10.0),
        (chunk_3, 9.0),
        (chunk_4, 8.0)
    ]
    assert AgreementCalculator.calculate(vector_results, keyword_results_2) == pytest.approx(0.66667, abs=1e-4)

    # 4. 3 Matches (chunk_1, chunk_2, chunk_3 match)
    keyword_results_3 = [
        (chunk_3, 10.0),
        (chunk_2, 9.0),
        (chunk_1, 8.0)
    ]
    assert AgreementCalculator.calculate(vector_results, keyword_results_3) == 1.0

    # 5. Empty inputs
    assert AgreementCalculator.calculate([], []) == 0.0

def test_confidence_service_scenarios():
    chunk_1 = create_mock_chunk()
    chunk_2 = create_mock_chunk()
    chunk_3 = create_mock_chunk()
    chunk_4 = create_mock_chunk()
    
    # Scenario A: MaxSim is high (0.90) but Agreement is 0.0 (Score = 0.54)
    vector_a = [(chunk_1, 0.90), (chunk_2, 0.70)]
    keyword_a = [(chunk_3, 10.0), (chunk_4, 9.0)]
    assert ConfidenceService.calculate_confidence(vector_a, keyword_a) == pytest.approx(0.54, abs=1e-5)

    # Scenario B: MaxSim is low (0.40) but Agreement is 1.0 (Score = 0.64)
    vector_b = [(chunk_1, 0.40), (chunk_2, 0.30), (chunk_3, 0.20)]
    keyword_b = [(chunk_1, 10.0), (chunk_2, 9.0), (chunk_3, 8.0)]
    assert ConfidenceService.calculate_confidence(vector_b, keyword_b) == pytest.approx(0.64, abs=1e-5)

    # Scenario C: MaxSim is high (0.85) and Agreement is 1.0 (Score = 0.91)
    vector_c = [(chunk_1, 0.85), (chunk_2, 0.80), (chunk_3, 0.75)]
    keyword_c = [(chunk_1, 10.0), (chunk_2, 9.0), (chunk_3, 8.0)]
    assert ConfidenceService.calculate_confidence(vector_c, keyword_c) == pytest.approx(0.91, abs=1e-5)

    # Scenario D: MaxSim is low (0.25) and Agreement is 0.0 (Score = 0.15)
    vector_d = [(chunk_1, 0.25), (chunk_2, 0.20)]
    keyword_d = [(chunk_3, 10.0)]
    assert ConfidenceService.calculate_confidence(vector_d, keyword_d) == pytest.approx(0.15, abs=1e-5)
