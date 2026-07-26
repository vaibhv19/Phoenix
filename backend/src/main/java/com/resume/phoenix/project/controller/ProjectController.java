package com.resume.phoenix.project.controller;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.project.dto.ProjectRequest;
import com.resume.phoenix.project.dto.ProjectResponse;
import com.resume.phoenix.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user
    ) {
        ProjectResponse response = projectService.createProject(request, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> listProjects(
            @AuthenticationPrincipal User user
    ) {
        List<ProjectResponse> response = projectService.listProjects(user.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        projectService.deleteProject(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
