package com.resume.phoenix.document.controller;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.document.dto.DocumentResponse;
import com.resume.phoenix.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId,
            @AuthenticationPrincipal User user
    ) {
        DocumentResponse response = documentService.uploadDocument(file, projectId, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<DocumentResponse> getDocumentStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        DocumentResponse response = documentService.getDocumentStatus(id, user.getId());
        return ResponseEntity.ok(response);
    }
}
