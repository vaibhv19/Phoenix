package com.resume.phoenix.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    @NotNull(message = "Document ID cannot be null")
    private UUID documentId;

    @NotNull(message = "Query cannot be null")
    private String query;
}
