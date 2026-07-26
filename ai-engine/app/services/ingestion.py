import os
from typing import List, Dict, Any
from pypdf import PdfReader

class PDFExtractor:

    @staticmethod
    def extract_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text page-by-page from a PDF file.
        Returns a list of dictionaries with page number and text:
        [{"text": "...", "page": 1}]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")

        pages = []
        try:
            reader = PdfReader(file_path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                text = text.strip()
                pages.append({
                    "text": text,
                    "page": i + 1
                })
        except Exception as e:
            raise RuntimeError(f"Failed to parse PDF file: {str(e)}")

        return pages
