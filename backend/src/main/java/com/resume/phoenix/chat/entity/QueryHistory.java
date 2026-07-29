package com.resume.phoenix.chat.entity;

import com.resume.phoenix.chat.dto.ReasoningStepDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "query_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryHistory {

    @Id
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "confidence_score")
    private java.math.BigDecimal confidenceScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fallback_trace")
    private List<ReasoningStepDto> fallbackTrace;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
