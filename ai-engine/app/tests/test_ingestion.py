from unittest.mock import MagicMock, patch
import pytest
from app.services.ingestion import PDFExtractor

@patch("app.services.ingestion.os.path.exists")
@patch("app.services.ingestion.PdfReader")
def test_pdf_extractor_success(mock_pdf_reader_cls, mock_exists):
    mock_exists.return_value = True

    # Setup mocked pages
    mock_page_1 = MagicMock()
    mock_page_1.extract_text.return_value = "Page 1 Content"
    mock_page_2 = MagicMock()
    mock_page_2.extract_text.return_value = "Page 2 Content"

    mock_reader = MagicMock()
    mock_reader.pages = [mock_page_1, mock_page_2]
    mock_pdf_reader_cls.return_value = mock_reader

    pages = PDFExtractor.extract_pages("dummy.pdf")

    assert len(pages) == 2
    assert pages[0]["page"] == 1
    assert pages[0]["text"] == "Page 1 Content"
    assert pages[1]["page"] == 2
    assert pages[1]["text"] == "Page 2 Content"

@patch("app.services.ingestion.os.path.exists")
def test_pdf_extractor_file_not_found(mock_exists):
    mock_exists.return_value = False

    with pytest.raises(FileNotFoundError):
        PDFExtractor.extract_pages("nonexistent.pdf")
