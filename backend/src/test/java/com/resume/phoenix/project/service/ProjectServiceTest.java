package com.resume.phoenix.project.service;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
import com.resume.phoenix.project.dto.ProjectRequest;
import com.resume.phoenix.project.dto.ProjectResponse;
import com.resume.phoenix.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ProjectServiceTest {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        userRepository.deleteAll();

        user1 = User.builder()
                .email("user1@example.com")
                .passwordHash("hash")
                .fullName("User One")
                .build();
        user1 = userRepository.save(user1);

        user2 = User.builder()
                .email("user2@example.com")
                .passwordHash("hash")
                .fullName("User Two")
                .build();
        user2 = userRepository.save(user2);
    }

    @Test
    void testCreateProjectSuccess() {
        ProjectRequest request = ProjectRequest.builder()
                .name("New Project")
                .build();

        ProjectResponse response = projectService.createProject(request, user1.getId());

        assertThat(response.getId()).isNotNull();
        assertThat(response.getUserId()).isEqualTo(user1.getId());
        assertThat(response.getName()).isEqualTo("New Project");
        assertThat(response.getCreatedAt()).isNotNull();
    }

    @Test
    void testListProjectsSuccess() {
        ProjectRequest r1 = ProjectRequest.builder().name("P1").build();
        ProjectRequest r2 = ProjectRequest.builder().name("P2").build();

        projectService.createProject(r1, user1.getId());
        projectService.createProject(r2, user1.getId());
        projectService.createProject(r1, user2.getId()); // user2's project

        List<ProjectResponse> user1Projects = projectService.listProjects(user1.getId());
        assertThat(user1Projects).hasSize(2);
        assertThat(user1Projects.stream().map(ProjectResponse::getName)).containsExactlyInAnyOrder("P1", "P2");

        List<ProjectResponse> user2Projects = projectService.listProjects(user2.getId());
        assertThat(user2Projects).hasSize(1);
        assertThat(user2Projects.get(0).getName()).isEqualTo("P1");
    }

    @Test
    void testGetProjectSuccess() {
        ProjectRequest r = ProjectRequest.builder().name("My Project").build();
        ProjectResponse created = projectService.createProject(r, user1.getId());

        ProjectResponse fetched = projectService.getProject(created.getId(), user1.getId());
        assertThat(fetched.getName()).isEqualTo("My Project");
    }

    @Test
    void testGetProjectAccessDenied() {
        ProjectRequest r = ProjectRequest.builder().name("User 1 Project").build();
        ProjectResponse created = projectService.createProject(r, user1.getId());

        // User 2 trying to access User 1's project should throw AccessDeniedException
        assertThatThrownBy(() -> projectService.getProject(created.getId(), user2.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    void testDeleteProjectSuccess() {
        ProjectRequest r = ProjectRequest.builder().name("To Delete").build();
        ProjectResponse created = projectService.createProject(r, user1.getId());

        projectService.deleteProject(created.getId(), user1.getId());

        List<ProjectResponse> list = projectService.listProjects(user1.getId());
        assertThat(list).isEmpty();
    }

    @Test
    void testDeleteProjectAccessDenied() {
        ProjectRequest r = ProjectRequest.builder().name("User 1 Project").build();
        ProjectResponse created = projectService.createProject(r, user1.getId());

        // User 2 trying to delete User 1's project should throw AccessDeniedException
        assertThatThrownBy(() -> projectService.deleteProject(created.getId(), user2.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }
}
