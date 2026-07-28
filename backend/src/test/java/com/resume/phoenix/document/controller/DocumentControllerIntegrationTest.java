package com.resume.phoenix.document.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
import com.resume.phoenix.document.dto.IngestResponse;
import com.resume.phoenix.document.entity.Document;
import com.resume.phoenix.document.entity.DocumentStatus;
import com.resume.phoenix.document.repository.DocumentRepository;
import com.resume.phoenix.project.entity.Project;
import com.resume.phoenix.project.repository.ProjectRepository;
import com.resume.phoenix.document.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DocumentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private RestClient.Builder restClientBuilder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockRestServiceServer mockServer;

    private User user1;
    private User user2;
    private Project project1;
    private Project project2;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        documentRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        user1 = User.builder()
                .email("u1@example.com")
                .passwordHash("password")
                .fullName("User One")
                .build();
        user1 = userRepository.save(user1);

        user2 = User.builder()
                .email("u2@example.com")
                .passwordHash("password")
                .fullName("User Two")
                .build();
        user2 = userRepository.save(user2);

        project1 = Project.builder()
                .userId(user1.getId())
                .name("Project 1")
                .build();
        project1 = projectRepository.save(project1);

        project2 = Project.builder()
                .userId(user2.getId())
                .name("Project 2")
                .build();
        project2 = projectRepository.save(project2);
    }

    @Test
    void testUploadDocumentSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Hello World PDF".getBytes()
        );

        // Mock FastAPI response
        IngestResponse ingestResponse = IngestResponse.builder()
                .chunkCount(15)
                .embeddingStatus("COMPLETED")
                .vectorIndexName("idx_test")
                .processingTimeMs(200)
                .build();

        mockServer.expect(requestTo("http://localhost:8000/internal/v1/ingest"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(objectMapper.writeValueAsString(ingestResponse), MediaType.APPLICATION_JSON));

        // Perform upload
        String responseContent = mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("projectId", project1.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.projectId").value(project1.getId().toString()))
                .andExpect(jsonPath("$.fileName").value("test-document.pdf"))
                .andExpect(jsonPath("$.status").value(DocumentStatus.PROCESSING.name()))
                .andExpect(jsonPath("$.storagePath", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract Document ID
        String documentIdStr = objectMapper.readTree(responseContent).get("id").asText();
        UUID documentId = UUID.fromString(documentIdStr);

        // Verify file stored on disk
        Document doc = documentRepository.findById(documentId).orElse(null);
        assertThat(doc).isNotNull();
        storageService.delete(doc.getStoragePath()); // clean up disk file

        // Wait for async execution and verify document state updates to READY
        Thread.sleep(500); // Wait 500ms for background thread
        mockServer.verify();

        Document finalDoc = documentRepository.findById(documentId).orElse(null);
        assertThat(finalDoc).isNotNull();
        assertThat(finalDoc.getStatus()).isEqualTo(DocumentStatus.READY);
        assertThat(finalDoc.getChunkCount()).isEqualTo(15);
    }

    @Test
    void testUploadDocumentFastApiFailureSetsStatusFailed() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Hello World PDF".getBytes()
        );

        mockServer.expect(requestTo("http://localhost:8000/internal/v1/ingest"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        String responseContent = mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("projectId", project1.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String documentIdStr = objectMapper.readTree(responseContent).get("id").asText();
        UUID documentId = UUID.fromString(documentIdStr);

        Document doc = documentRepository.findById(documentId).orElse(null);
        assertThat(doc).isNotNull();
        storageService.delete(doc.getStoragePath()); // clean up disk file

        // Wait for async execution and verify document state updates to FAILED
        Thread.sleep(500);
        mockServer.verify();

        Document finalDoc = documentRepository.findById(documentId).orElse(null);
        assertThat(finalDoc).isNotNull();
        assertThat(finalDoc.getStatus()).isEqualTo(DocumentStatus.FAILED);
    }

    @Test
    void testUploadDocumentAccessDenied() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Hello World PDF".getBytes()
        );

        // User 1 trying to upload to Project 2 (owned by User 2)
        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("projectId", project2.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetDocumentStatusSuccess() throws Exception {
        Document document = Document.builder()
                .projectId(project1.getId())
                .fileName("existing.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/some/path")
                .chunkCount(42)
                .build();
        document = documentRepository.save(document);

        mockMvc.perform(get("/api/documents/" + document.getId() + "/status")
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(document.getId().toString()))
                .andExpect(jsonPath("$.status").value(DocumentStatus.READY.name()))
                .andExpect(jsonPath("$.chunkCount").value(42));
    }

    @Test
    void testGetDocumentStatusAccessDenied() throws Exception {
        Document document = Document.builder()
                .projectId(project2.getId()) // Owned by User 2
                .fileName("existing.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/some/path")
                .chunkCount(42)
                .build();
        document = documentRepository.save(document);

        // User 1 trying to read status of User 2's document
        mockMvc.perform(get("/api/documents/" + document.getId() + "/status")
                        .with(user(user1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testListDocumentsSuccess() throws Exception {
        Document document = Document.builder()
                .projectId(project1.getId())
                .fileName("test-list.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/some/path")
                .chunkCount(5)
                .build();
        documentRepository.save(document);

        mockMvc.perform(get("/api/documents")
                        .param("projectId", project1.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fileName").value("test-list.pdf"))
                .andExpect(jsonPath("$[0].status").value("READY"));
    }

    @Test
    void testListDocumentsAccessDenied() throws Exception {
        mockMvc.perform(get("/api/documents")
                        .param("projectId", project2.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteDocumentSuccess() throws Exception {
        Document document = Document.builder()
                .projectId(project1.getId())
                .fileName("to-delete.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/delete/path")
                .chunkCount(1)
                .build();
        document = documentRepository.save(document);

        mockMvc.perform(delete("/api/documents/" + document.getId())
                        .with(user(user1)))
                .andExpect(status().isNoContent());

        assertThat(documentRepository.findById(document.getId())).isEmpty();
    }

    @Test
    void testDeleteDocumentAccessDenied() throws Exception {
        Document document = Document.builder()
                .projectId(project2.getId())
                .fileName("other-user-doc.pdf")
                .status(DocumentStatus.READY)
                .storagePath("/other/path")
                .chunkCount(1)
                .build();
        document = documentRepository.save(document);

        mockMvc.perform(delete("/api/documents/" + document.getId())
                        .with(user(user1)))
                .andExpect(status().isForbidden());

        assertThat(documentRepository.findById(document.getId())).isPresent();
    }
}
