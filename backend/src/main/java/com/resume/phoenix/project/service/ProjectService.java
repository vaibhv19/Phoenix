package com.resume.phoenix.project.service;

import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.repository.DocumentRepository;
import com.resume.phoenix.document.service.StorageService;
import com.resume.phoenix.exception.ResourceNotFoundException;
import com.resume.phoenix.project.dto.ProjectRequest;
import com.resume.phoenix.project.dto.ProjectResponse;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, UUID userId) {
        Project project = Project.builder()
                .userId(userId)
                .name(request.getName())
                .build();
        Project saved = projectRepository.save(project);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listProjects(UUID userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID id, UUID userId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + id);
        }
        return mapToResponse(project);
    }

    @Transactional
    public void deleteProject(UUID id, UUID userId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        if (!project.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied to project with id: " + id);
        }
        
        // Cascading physical file deletion for all documents in the project
        try {
            List<Document> documents = documentRepository.findByProjectId(id);
            log.info("Deleting {} documents for project {}", documents.size(), id);
            for (Document document : documents) {
                try {
                    storageService.delete(document.getStoragePath());
                } catch (Exception e) {
                    log.warn("Failed to delete physical file for document: {}", document.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error retrieving/deleting document files for project: {}", id, e);
        }

        projectRepository.delete(project);
        log.info("Successfully deleted project: {}", id);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .userId(project.getUserId())
                .name(project.getName())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
