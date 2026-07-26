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
public class IngestResponse {

    private UUID documentId;
    private int chunkCount;
    private String embeddingStatus;
    private String vectorIndexName;
    private long processingTimeMs;
}
