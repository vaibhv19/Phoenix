package com.resume.phoenix.document;

import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UploadValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private User user;
    private Project project;

    @BeforeEach
    void setUp() {
        projectRepository.deleteAll();
        userRepository.deleteAll();

        user = User.builder()
                .email("testuser@example.com")
                .passwordHash("passwordHash")
                .fullName("Test User")
                .build();
        user = userRepository.save(user);

        project = Project.builder()
                .userId(user.getId())
                .name("Test Project")
                .build();
        project = projectRepository.save(project);
    }

    @Test
    void testUploadEmptyFileReturnsBadRequest() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(emptyFile)
                        .param("projectId", project.getId().toString())
                        .with(user(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Failed to store empty file."));
    }

    @Test
    void testUploadEmptyFilenameReturnsBadRequest() throws Exception {
        MockMultipartFile fileNoName = new MockMultipartFile(
                "file",
                "",
                "application/pdf",
                "Hello World PDF".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(fileNoName)
                        .param("projectId", project.getId().toString())
                        .with(user(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Original filename cannot be null or empty."));
    }

    @Test
    void testUploadInvalidExtensionReturnsBadRequest() throws Exception {
        MockMultipartFile invalidExtFile = new MockMultipartFile(
                "file",
                "unsafe.txt",
                "text/plain",
                "Some plain text content".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(invalidExtFile)
                        .param("projectId", project.getId().toString())
                        .with(user(user)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Only PDF files are allowed."));
    }
}
