package com.resume.phoenix.document.repository;

import com.resume.phoenix.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByProjectId(UUID projectId);
    Optional<Document> findByIdAndProjectId(UUID id, UUID projectId);
}
