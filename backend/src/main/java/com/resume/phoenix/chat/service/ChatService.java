package com.resume.phoenix.chat.service;

import com.resume.phoenix.chat.dto.ChatRequest;
import com.resume.phoenix.chat.dto.ChatResponse;
import com.resume.phoenix.chat.entity.QueryHistory;
import com.resume.phoenix.chat.repository.QueryHistoryRepository;
import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.repository.DocumentRepository;
import com.resume.phoenix.exception.ResourceNotFoundException;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final QueryHistoryRepository queryHistoryRepository;
    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final RestClient.Builder restClientBuilder;

    @Transactional
    public ChatResponse queryRAG(ChatRequest request, UUID userId) {
        log.info("Processing RAG query for documentId: {}, userId: {}", request.getDocumentId(), userId);

        // 1. Verify document exists
        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + request.getDocumentId()));

        // 2. Verify project exists
        Project project = projectRepository.findById(document.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + document.getProjectId()));

        // 3. Verify user has access to project
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + project.getId());
        }

        // 4. Query Python AI engine
        RestClient restClient = restClientBuilder.build();
        Map<String, Object> requestBody = Map.of(
                "documentId", request.getDocumentId(),
                "query", request.getQuery(),
                "limit", 5,
                "alpha", 0.7
        );

        ChatResponse apiResponse;
        try {
            apiResponse = restClient.post()
                    .uri("/internal/v1/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(ChatResponse.class);
        } catch (Exception e) {
            log.error("Failed to query Python AI engine for document: {}", request.getDocumentId(), e);
            throw new RuntimeException("AI retrieval engine error: " + e.getMessage(), e);
        }

        if (apiResponse == null) {
            throw new RuntimeException("Empty response from AI retrieval engine.");
        }

        // 5. Generate chatId and persist query logs in DB
        UUID chatId = UUID.randomUUID();
        apiResponse.setChatId(chatId);
        apiResponse.setQuestion(request.getQuery());

        QueryHistory queryHistory = QueryHistory.builder()
                .id(chatId)
                .projectId(project.getId())
                .question(request.getQuery())
                .answer(apiResponse.getAnswer())
                .confidenceScore(java.math.BigDecimal.valueOf(apiResponse.getConfidenceScore()))
                .fallbackTrace(apiResponse.getReasoningTrace())
                .build();

        queryHistoryRepository.save(queryHistory);
        log.info("Query successfully processed and saved with chatId: {}", chatId);

        return apiResponse;
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChatHistory(UUID projectId, UUID userId) {
        log.info("Fetching chat history for projectId: {}, userId: {}", projectId, userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + projectId);
        }

        List<QueryHistory> histories = queryHistoryRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        return histories.stream()
                .map(h -> ChatResponse.builder()
                        .chatId(h.getId())
                        .question(h.getQuestion())
                        .answer(h.getAnswer())
                        .confidenceScore(h.getConfidenceScore() != null ? h.getConfidenceScore().doubleValue() : 0.0)
                        .reasoningTrace(h.getFallbackTrace())
                        .matches(List.of()) // database schema doesn't store matches, map empty list
                        .build())
                .collect(Collectors.toList());
    }
}
