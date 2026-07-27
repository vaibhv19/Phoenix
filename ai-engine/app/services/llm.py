import httpx
from typing import List, Dict, Any

class LLMService:
    def __init__(
        self,
        provider: str = "mock",
        url: str = "http://localhost:11434",
        model: str = "mistral"
    ):
        self.provider = provider
        self.url = url
        self.model = model

    def generate_answer(self, query: str, contexts: List[str]) -> str:
        """
        Generate answer based on context using LLM or mock fallback.
        """
        system_prompt = (
            "You are an AI assistant. Answer the user query based only on the provided context passages. "
            "If the context does not contain enough information to answer, state that you do not know. "
            "Keep the answer concise and truthful."
        )
        joined_context = "\n---\n".join(contexts)
        user_prompt = f"Query: {query}\n\nContext:\n{joined_context}\n\nAnswer:"
        
        if self.provider == "mock":
            return self._get_mock_answer(query, contexts)
            
        return self._call_ollama(system_prompt, user_prompt)

    def rewrite_query(self, query: str) -> str:
        """
        Rewrite query to expand with synonyms/definitions/technical terms.
        """
        system_prompt = (
            "You are a query rewriter. Rewrite the following user search query to expand it with synonyms, "
            "definitions, or related technical terms to improve retrieval. Output only the optimized query "
            "text and nothing else."
        )
        user_prompt = f"Original Query: {query}"
        
        if self.provider == "mock":
            return f"Optimized query: {query} with context"
            
        return self._call_ollama(system_prompt, user_prompt)

    def generate_clarification(self, query: str, topics: List[str]) -> str:
        """
        Generate polite clarification question when context is insufficient.
        """
        system_prompt = (
            "You are a polite customer support agent. The user's query could not be answered from the document chunks. "
            "Based on the closest matching topics in the document (listed below), ask a polite clarifying question "
            "to help the user refine their search query. Do not attempt to answer the query itself."
        )
        joined_topics = ", ".join(topics)
        user_prompt = f"Query: {query}\n\nTop matching topics:\n{joined_topics}\n\nClarifying Question:"
        
        if self.provider == "mock":
            return f"Could you please clarify if you mean {joined_topics}?"
            
        return self._call_ollama(system_prompt, user_prompt)

    def _call_ollama(self, system_prompt: str, user_prompt: str) -> str:
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
            # Set a 5-second timeout
            response = httpx.post(f"{self.url}/api/chat", json=payload, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return data["message"]["content"].strip()
        except Exception:
            # Silence exception and fallback to mock
            pass
            
        # Fallback to mock on connection error or non-200 response
        if "query rewriter" in system_prompt.lower():
            return f"Optimized query: {user_prompt.split('Original Query: ')[-1]} with context"
        elif "clarification" in system_prompt.lower():
            topics = user_prompt.split("Top matching topics:\n")[-1].split("\n\n")[0]
            return f"Could you please clarify if you mean {topics}?"
        else:
            query = user_prompt.split("Query: ")[-1].split("\n\n")[0]
            return f"Mocked answer based on context for query: '{query}'"

    def _get_mock_answer(self, query: str, contexts: List[str]) -> str:
        return f"Mocked answer based on context for query: '{query}'"
