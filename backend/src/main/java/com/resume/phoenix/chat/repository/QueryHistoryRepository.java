package com.resume.phoenix.chat.repository;

import com.resume.phoenix.chat.entity.QueryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QueryHistoryRepository extends JpaRepository<QueryHistory, UUID> {
    List<QueryHistory> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
