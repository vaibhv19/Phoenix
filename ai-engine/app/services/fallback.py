import uuid
from typing import List, Tuple, Dict, Any
from pydantic import BaseModel

from app.models import DocumentChunk
from app.services.retrieval import RetrievalService
from app.services.search_vector import VectorSearchService
from app.services.search_keyword import KeywordSearchService
from app.services.fusion import WLCFusion
from app.services.llm import LLMService
from app.services.reranking import RerankingService

class ReasoningStepDto(BaseModel):
    state: str
    confidenceScore: float
    description: str

class FallbackOrchestrator:
    def __init__(
        self,
        retrieval_service: RetrievalService,
        llm_service: LLMService,
        reranking_service: RerankingService
    ):
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service
        self.reranking_service = reranking_service

    def process_query(
        self,
        document_id: uuid.UUID,
        query: str,
        limit: int = 5,
        alpha: float = 0.7
    ) -> Dict[str, Any]:
        reasoning_trace: List[ReasoningStepDto] = []
        
        # 1. INITIAL_RETRIEVAL
        results, cs_1 = self.retrieval_service.retrieve_hybrid(
            document_id=document_id,
            query=query,
            limit=limit,
            alpha=alpha
        )
        
        reasoning_trace.append(ReasoningStepDto(
            state="INITIAL_RETRIEVAL",
            confidenceScore=cs_1,
            description=f"Initial retrieval completed. Confidence score: {cs_1:.4f}."
        ))
        
        # Branch evaluation
        if cs_1 >= 0.75:
            # Green Path
            contexts = [chunk.content for chunk, _ in results]
            answer = self.llm_service.generate_answer(query, contexts)
            
            reasoning_trace.append(ReasoningStepDto(
                state="ANSWER_GENERATION",
                confidenceScore=cs_1,
                description="Confidence is green (>= 0.75). Generating answer based on retrieved context."
            ))
            
            return {
                "answer": answer,
                "confidenceScore": cs_1,
                "reasoningTrace": reasoning_trace,
                "matches": results
            }
            
        elif 0.50 <= cs_1 < 0.75:
            # Yellow Path: FALLBACK_REWRITE
            rewritten_query = self.llm_service.rewrite_query(query)
            results_2, cs_2 = self.retrieval_service.retrieve_hybrid(
                document_id=document_id,
                query=rewritten_query,
                limit=limit,
                alpha=alpha
            )
            
            reasoning_trace.append(ReasoningStepDto(
                state="FALLBACK_REWRITE",
                confidenceScore=cs_2,
                description=f"Confidence is yellow ({cs_1:.4f}). Rewrote query to '{rewritten_query}'. Secondary retrieval confidence: {cs_2:.4f}."
            ))
            
            if cs_2 >= 0.75:
                # Rewrite successful, Green Path
                contexts = [chunk.content for chunk, _ in results_2]
                answer = self.llm_service.generate_answer(rewritten_query, contexts)
                
                reasoning_trace.append(ReasoningStepDto(
                    state="ANSWER_GENERATION",
                    confidenceScore=cs_2,
                    description="Secondary retrieval confidence is green (>= 0.75). Generating answer."
                ))
                
                return {
                    "answer": answer,
                    "confidenceScore": cs_2,
                    "reasoningTrace": reasoning_trace,
                    "matches": results_2
                }
            else:
                # Escalation to Orange Path (FALLBACK_RERANK)
                reasoning_trace.append(ReasoningStepDto(
                    state="ESCALATION",
                    confidenceScore=cs_2,
                    description=f"Secondary retrieval confidence {cs_2:.4f} below green threshold. Escalating to FlashRank reranking."
                ))
                return self._run_rerank(document_id, rewritten_query, limit, alpha, reasoning_trace)
                
        elif 0.35 <= cs_1 < 0.50:
            # Orange Path: FALLBACK_RERANK
            reasoning_trace.append(ReasoningStepDto(
                state="FALLBACK_RERANK",
                confidenceScore=cs_1,
                description=f"Confidence is orange ({cs_1:.4f}). Initiating FlashRank reranking."
            ))
            return self._run_rerank(document_id, query, limit, alpha, reasoning_trace)
            
        else:
            # Red Path: FALLBACK_CLARIFY
            reasoning_trace.append(ReasoningStepDto(
                state="FALLBACK_CLARIFY",
                confidenceScore=cs_1,
                description=f"Confidence is red ({cs_1:.4f}). Initiating clarification fallback."
            ))
            return self._run_clarification(document_id, query, cs_1, reasoning_trace)

    def _run_rerank(
        self,
        document_id: uuid.UUID,
        query: str,
        limit: int,
        alpha: float,
        reasoning_trace: List[ReasoningStepDto]
    ) -> Dict[str, Any]:
        # Compile top-20 chunks for FlashRank
        query_embedding = self.retrieval_service.embedding_service.embed_text(query)
        vector_results_20 = VectorSearchService.search(
            self.retrieval_service.db,
            document_id=document_id,
            query_embedding=query_embedding,
            limit=20
        )
        keyword_results_20 = KeywordSearchService.search(
            self.retrieval_service.db,
            document_id=document_id,
            query_str=query,
            limit=None
        )
        fused_20 = WLCFusion.fuse(vector_results_20, keyword_results_20, alpha)
        candidate_chunks = [chunk for chunk, _ in fused_20[:20]]
        
        # Run reranking
        reranked_results = self.reranking_service.rerank(query, candidate_chunks, limit=limit)
        
        rs = 0.0
        if reranked_results:
            rs = reranked_results[0][1]
            
        reasoning_trace.append(ReasoningStepDto(
            state="RERANK_EVALUATION",
            confidenceScore=rs,
            description=f"FlashRank completed. Top reranked score: {rs:.4f}."
        ))
        
        if rs >= 0.50:
            contexts = [chunk.content for chunk, _ in reranked_results]
            answer = self.llm_service.generate_answer(query, contexts)
            
            reasoning_trace.append(ReasoningStepDto(
                state="ANSWER_GENERATION",
                confidenceScore=rs,
                description="Reranked score is orange-acceptable (>= 0.50). Generating answer."
            ))
            
            return {
                "answer": answer,
                "confidenceScore": rs,
                "reasoningTrace": reasoning_trace,
                "matches": reranked_results
            }
        else:
            reasoning_trace.append(ReasoningStepDto(
                state="ESCALATION",
                confidenceScore=rs,
                description=f"Reranked score {rs:.4f} below orange threshold. Escalating to clarification."
            ))
            return self._run_clarification(document_id, query, rs, reasoning_trace)

    def _run_clarification(
        self,
        document_id: uuid.UUID,
        query: str,
        final_score: float,
        reasoning_trace: List[ReasoningStepDto]
    ) -> Dict[str, Any]:
        # Get top-3 closest matching vector chunks for context/metadata topics
        query_embedding = self.retrieval_service.embedding_service.embed_text(query)
        vector_results_3 = VectorSearchService.search(
            self.retrieval_service.db,
            document_id=document_id,
            query_embedding=query_embedding,
            limit=3
        )
        
        topics = []
        for chunk, _ in vector_results_3:
            if chunk.content:
                snippet = chunk.content[:100].strip()
                topics.append(snippet)
                
        clarification = self.llm_service.generate_clarification(query, topics)
        
        reasoning_trace.append(ReasoningStepDto(
            state="CLARIFICATION_GENERATION",
            confidenceScore=final_score,
            description="Polite clarification question generated due to low retrieval confidence."
        ))
        
        return {
            "answer": clarification,
            "confidenceScore": final_score,
            "reasoningTrace": reasoning_trace,
            "matches": []  # Empty matches as answer was aborted
        }
