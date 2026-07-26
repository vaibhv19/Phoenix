import re
import string
import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from rank_bm25 import BM25Okapi
from app.models import DocumentChunk

# Standard English stop words
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have",
    "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him",
    "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt",
    "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some",
    "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there",
    "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent",
    "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why",
    "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your",
    "yours", "yourself", "yourselves"
}

def custom_tokenizer(text: str) -> List[str]:
    """
    Tokenizer that:
    1. Converts text to lowercase.
    2. Removes punctuation by replacing it with space.
    3. Splits by whitespace.
    4. Filters out English stop words and empty tokens.
    """
    text = text.lower()
    # Replace punctuation with space
    text = re.sub(f"[{re.escape(string.punctuation)}]", " ", text)
    # Split by whitespace
    tokens = text.split()
    # Filter out stop words
    return [t for t in tokens if t not in STOP_WORDS]

class KeywordSearchService:
    @staticmethod
    def search(
        db: Session,
        document_id: uuid.UUID,
        query_str: str,
        limit: Optional[int] = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Execute BM25 keyword search on DocumentChunks belonging to the given document_id.
        Builds the BM25 index on-the-fly from database chunk texts.
        Returns a list of tuples (DocumentChunk, raw_bm25_score) sorted in descending order of score.
        If limit is None, scores all chunks and returns them sorted.
        """
        # Fetch all chunks for this document
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).order_by(
            DocumentChunk.chunk_index
        ).all()
        
        if not chunks:
            return []
            
        # Tokenize corpus
        corpus = [custom_tokenizer(c.content or "") for c in chunks]
        
        # Initialize BM25 Okapi index
        bm25 = BM25Okapi(corpus)
        
        # Tokenize query
        query_tokens = custom_tokenizer(query_str)
        
        # Calculate BM25 scores
        scores = bm25.get_scores(query_tokens)
        
        # Zip and cast scores to floats
        chunk_scores = [
            (chunk, float(score))
            for chunk, score in zip(chunks, scores)
        ]
        
        # Sort by score descending
        chunk_scores.sort(key=lambda x: x[1], reverse=True)
        
        if limit is not None:
            return chunk_scores[:limit]
        return chunk_scores
