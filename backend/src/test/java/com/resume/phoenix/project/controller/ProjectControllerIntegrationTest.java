package com.resume.phoenix.project.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
import com.resume.phoenix.project.dto.ProjectRequest;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;



import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProjectControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        userRepository.deleteAll();

        user1 = User.builder()
                .email("user1@example.com")
                .passwordHash("password")
                .fullName("User One")
                .build();
        user1 = userRepository.save(user1);

        user2 = User.builder()
                .email("user2@example.com")
                .passwordHash("password")
                .fullName("User Two")
                .build();
        user2 = userRepository.save(user2);
    }

    @Test
    void testCreateProjectSuccess() throws Exception {
        ProjectRequest request = ProjectRequest.builder()
                .name("New Web App")
                .build();

        mockMvc.perform(post("/api/projects")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name").value("New Web App"))
                .andExpect(jsonPath("$.userId").value(user1.getId().toString()))
                .andExpect(jsonPath("$.createdAt", notNullValue()));
    }

    @Test
    void testCreateProjectValidationError() throws Exception {
        ProjectRequest request = ProjectRequest.builder()
                .name("") // blank name
                .build();

        mockMvc.perform(post("/api/projects")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists());
    }

    @Test
    void testListProjectsSuccess() throws Exception {
        Project p1 = Project.builder()
                .userId(user1.getId())
                .name("Project 1")
                .build();
        Project p2 = Project.builder()
                .userId(user1.getId())
                .name("Project 2")
                .build();
        Project p3 = Project.builder()
                .userId(user2.getId()) // user 2's project
                .name("Project 3")
                .build();

        projectRepository.save(p1);
        projectRepository.save(p2);
        projectRepository.save(p3);

        mockMvc.perform(get("/api/projects")
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Project 1"))
                .andExpect(jsonPath("$[1].name").value("Project 2"));
    }

    @Test
    void testDeleteProjectSuccess() throws Exception {
        Project p = Project.builder()
                .userId(user1.getId())
                .name("ToDelete")
                .build();
        projectRepository.save(p);

        mockMvc.perform(delete("/api/projects/" + p.getId())
                        .with(user(user1)))
                .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteProjectAccessDenied() throws Exception {
        Project p = Project.builder()
                .userId(user2.getId()) // user 2 owns it
                .name("SomeoneElseProject")
                .build();
        projectRepository.save(p);

        mockMvc.perform(delete("/api/projects/" + p.getId())
                        .with(user(user1)))
                .andExpect(status().isForbidden()); // AccessDeniedException is mapped to 403 Forbidden
    }

    @Test
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized()); // jwt authentication entry point should return 401
    }
}
