package com.resume.phoenix.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID projectId;
    private String fileName;
    private String status;
    private String storagePath;
    private Integer chunkCount;
}
