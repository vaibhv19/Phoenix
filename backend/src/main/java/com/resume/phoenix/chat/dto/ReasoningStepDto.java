package com.resume.phoenix.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReasoningStepDto {
    private String state;
    private double confidenceScore;
    private String description;
}
