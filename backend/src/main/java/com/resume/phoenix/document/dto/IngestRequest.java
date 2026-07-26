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
public class IngestRequest {

    private UUID documentId;
    private String filePath;
    private IngestConfig config;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IngestConfig {
        private int chunkSize;
        private int chunkOverlap;
    }
}
