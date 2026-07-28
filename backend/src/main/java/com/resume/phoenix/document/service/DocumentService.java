package com.resume.phoenix.document.service;

import com.resume.phoenix.document.dto.DocumentResponse;
import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.entity.DocumentStatus;
import com.resume.phoenix.document.repository.DocumentRepository;
import com.resume.phoenix.exception.ResourceNotFoundException;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final StorageService storageService;
    private final PythonIngestionService pythonIngestionService;

    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, UUID projectId, UUID userId) {
        log.info("Processing document upload request for projectId: {}, userId: {}", projectId, userId);

        // Verify project ownership
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + projectId));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + projectId);
        }

        UUID documentId = UUID.randomUUID();

        // Save file physically on disk
        String storagePath = storageService.store(file, documentId);

        // Save document metadata in DB
        Document document = Document.builder()
                .id(documentId)
                .projectId(projectId)
                .fileName(file.getOriginalFilename())
                .status(DocumentStatus.PROCESSING)
                .storagePath(storagePath)
                .build();

        Document saved = documentRepository.save(document);

        // Trigger remote python engine callback asynchronously
        pythonIngestionService.triggerIngestionAsync(saved);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentStatus(UUID documentId, UUID userId) {
        log.info("Checking status for documentId: {}, userId: {}", documentId, userId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        // Verify project ownership
        Project project = projectRepository.findById(document.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent project not found for document: " + documentId));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to document with id: " + documentId);
        }

        return mapToResponse(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(UUID projectId, UUID userId) {
        log.info("Listing documents for projectId: {}, userId: {}", projectId, userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + projectId);
        }

        return documentRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(UUID documentId, UUID userId) {
        log.info("Processing delete request for documentId: {}, userId: {}", documentId, userId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        Project project = projectRepository.findById(document.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent project not found for document: " + documentId));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to document with id: " + documentId);
        }

        // Delete physical file from disk
        try {
            storageService.delete(document.getStoragePath());
        } catch (Exception e) {
            log.warn("Failed to delete physical file for document: {}", documentId, e);
        }

        // Delete database metadata (cascades to chunks/embeddings)
        documentRepository.delete(document);
        log.info("Successfully deleted document: {}", documentId);
    }

    private DocumentResponse mapToResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .projectId(document.getProjectId())
                .fileName(document.getFileName())
                .status(document.getStatus().name())
                .storagePath(document.getStoragePath())
                .chunkCount(document.getChunkCount())
                .build();
    }
}
