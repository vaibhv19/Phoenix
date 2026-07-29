package com.resume.phoenix.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchDto {
    private UUID id;
    private UUID documentId;
    private int chunkIndex;
    private String content;
    private double score;
    private Map<String, Object> metadata;
}
