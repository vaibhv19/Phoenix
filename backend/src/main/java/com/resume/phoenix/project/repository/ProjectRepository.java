package com.resume.phoenix.project.repository;

import com.resume.phoenix.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByUserId(UUID userId);
    Optional<Project> findByIdAndUserId(UUID id, UUID userId);
}
