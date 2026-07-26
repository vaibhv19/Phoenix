import os
from typing import List, Dict, Any
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

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

class DocumentChunker:

    @staticmethod
    def chunk_pages(pages: List[Dict[str, Any]], chunk_size: int = 800, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
        """
        Splits extracted pages into character-bounded semantic chunks.
        Each chunk preserves the page number and index:
        [{"content": "...", "chunk_index": 0, "metadata": {"page_number": 1}}]
        """
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

        chunks = []
        chunk_idx = 0

        for page in pages:
            text = page["text"]
            page_num = page["page"]

            split_texts = splitter.split_text(text)

            for part in split_texts:
                chunks.append({
                    "content": part,
                    "chunk_index": chunk_idx,
                    "metadata": {
                        "page_number": page_num
                    }
                })
                chunk_idx += 1

        return chunks
