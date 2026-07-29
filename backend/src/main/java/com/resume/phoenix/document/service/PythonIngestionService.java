package com.resume.phoenix.document.service;

import com.resume.phoenix.document.dto.IngestRequest;
import com.resume.phoenix.document.dto.IngestResponse;
import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.entity.DocumentStatus;
import com.resume.phoenix.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonIngestionService {

    private final RestClient.Builder restClientBuilder;
    private final DocumentRepository documentRepository;

    @Async
    public void triggerIngestionAsync(Document document) {
        log.info("Triggering async ingestion for document: {}", document.getId());
        RestClient restClient = restClientBuilder.build();

        IngestRequest.IngestConfig config = IngestRequest.IngestConfig.builder()
                .chunkSize(800)
                .chunkOverlap(150)
                .build();

        IngestRequest ingestRequest = IngestRequest.builder()
                .documentId(document.getId())
                .filePath(document.getStoragePath())
                .config(config)
                .build();

        try {
            IngestResponse response = restClient.post()
                    .uri("/internal/v1/ingest")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ingestRequest)
                    .retrieve()
                    .body(IngestResponse.class);

            if (response != null && "COMPLETED".equalsIgnoreCase(response.getEmbeddingStatus())) {
                document.setStatus(DocumentStatus.READY);
                document.setChunkCount(response.getChunkCount());
                log.info("Ingestion completed successfully for document: {}, chunks: {}", document.getId(), response.getChunkCount());
            } else {
                document.setStatus(DocumentStatus.FAILED);
                log.warn("Ingestion failed (unexpected status) for document: {}", document.getId());
            }
        } catch (Exception e) {
            document.setStatus(DocumentStatus.FAILED);
            log.error("Network exception or server error during async ingestion for document: {}", document.getId(), e);
        }

        if (documentRepository.existsById(document.getId())) {
            documentRepository.save(document);
        } else {
            log.warn("Document {} was deleted before async ingestion completed. Skipping database save.", document.getId());
        }
    }
}
