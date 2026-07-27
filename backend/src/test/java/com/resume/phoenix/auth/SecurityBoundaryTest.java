package com.resume.phoenix.auth;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.entity.DocumentStatus;
import com.resume.phoenix.document.repository.DocumentRepository;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityBoundaryTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    private User userA;
    private User userB;
    private Project projectA;
    private Project projectB;
    private Document documentA;
    private Document documentB;

    @BeforeEach
    void setUp() {
        documentRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // Create User A
        userA = User.builder()
                .email("usera@example.com")
                .passwordHash("passwordHashA")
                .fullName("User A")
                .build();
        userA = userRepository.save(userA);

        // Create User B
        userB = User.builder()
                .email("userb@example.com")
                .passwordHash("passwordHashB")
                .fullName("User B")
                .build();
        userB = userRepository.save(userB);

        // Create Project A (owned by User A)
        projectA = Project.builder()
                .userId(userA.getId())
                .name("Project A")
                .build();
        projectA = projectRepository.save(projectA);

        // Create Project B (owned by User B)
        projectB = Project.builder()
                .userId(userB.getId())
                .name("Project B")
                .build();
        projectB = projectRepository.save(projectB);

        // Create Document A in Project A
        documentA = Document.builder()
                .projectId(projectA.getId())
                .fileName("docA.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/storage/docA.pdf")
                .chunkCount(10)
                .build();
        documentA = documentRepository.save(documentA);

        // Create Document B in Project B
        documentB = Document.builder()
                .projectId(projectB.getId())
                .fileName("docB.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/storage/docB.pdf")
                .chunkCount(20)
                .build();
        documentB = documentRepository.save(documentB);
    }

    @Test
    void testUserBCannotUploadToProjectA() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.pdf",
                "application/pdf",
                "Some malicious content".getBytes()
        );

        // User B tries to upload a document to Project A (which belongs to User A)
        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("projectId", projectA.getId().toString())
                        .with(user(userB)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUserBCannotGetStatusOfDocumentA() throws Exception {
        // User B tries to check the status of Document A (which is in Project A, owned by User A)
        mockMvc.perform(get("/api/documents/" + documentA.getId() + "/status")
                        .with(user(userB)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUserBCannotDeleteProjectA() throws Exception {
        // User B tries to delete Project A (owned by User A)
        mockMvc.perform(delete("/api/projects/" + projectA.getId())
                        .with(user(userB)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedAccessIsUnauthorized() throws Exception {
        // Unauthenticated upload attempt
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[]{});
        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("projectId", projectA.getId().toString()))
                .andExpect(status().isUnauthorized());

        // Unauthenticated status request
        mockMvc.perform(get("/api/documents/" + documentA.getId() + "/status"))
                .andExpect(status().isUnauthorized());

        // Unauthenticated project deletion
        mockMvc.perform(delete("/api/projects/" + projectA.getId()))
                .andExpect(status().isUnauthorized());
    }
}
