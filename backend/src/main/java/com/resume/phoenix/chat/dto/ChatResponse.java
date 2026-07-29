package com.resume.phoenix.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private UUID chatId;
    private String question;
    private String answer;
    private double confidenceScore;
    private List<ReasoningStepDto> reasoningTrace;
    private List<MatchDto> matches;
}
