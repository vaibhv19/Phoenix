package com.resume.phoenix.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.phoenix.auth.entity.User;
import com.resume.phoenix.auth.repository.UserRepository;
import com.resume.phoenix.chat.dto.*;
import com.resume.phoenix.chat.repository.QueryHistoryRepository;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ChatControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private QueryHistoryRepository queryHistoryRepository;

    @Autowired
    private RestClient.Builder restClientBuilder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockRestServiceServer mockServer;

    private User user1;
    private User user2;
    private Project project1;
    private Project project2;
    private Document document1;
    private Document document2;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        queryHistoryRepository.deleteAll();
        documentRepository.deleteAll();
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

        document1 = Document.builder()
                .projectId(project1.getId())
                .fileName("spec1.pdf")
                .storagePath("/path/to/spec1.pdf")
                .status(DocumentStatus.READY)
                .chunkCount(10)
                .build();
        document1 = documentRepository.save(document1);

        document2 = Document.builder()
                .projectId(project2.getId())
                .fileName("spec2.pdf")
                .storagePath("/path/to/spec2.pdf")
                .status(DocumentStatus.READY)
                .chunkCount(5)
                .build();
        document2 = documentRepository.save(document2);
    }

    @Test
    void testQueryRAGSuccess() throws Exception {
        ChatRequest request = ChatRequest.builder()
                .documentId(document1.getId())
                .query("What is the baud rate?")
                .build();

        ChatResponse mockApiResponse = ChatResponse.builder()
                .answer("The baud rate is 9600 bps.")
                .confidenceScore(0.95)
                .reasoningTrace(List.of(
                        ReasoningStepDto.builder()
                                .state("INITIAL_RETRIEVAL")
                                .confidenceScore(0.95)
                                .description("Direct chunk match found.")
                                .build()
                ))
                .matches(List.of(
                        MatchDto.builder()
                                .id(UUID.randomUUID())
                                .documentId(document1.getId())
                                .chunkIndex(1)
                                .content("Set the baud rate parameter to 9600 bps.")
                                .score(0.95)
                                .metadata(Map.of("source", "spec1.pdf", "page", 1))
                                .build()
                ))
                .build();

        mockServer.expect(requestTo("http://localhost:8000/internal/v1/process"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(objectMapper.writeValueAsString(mockApiResponse), MediaType.APPLICATION_JSON));

        mockMvc.perform(post("/api/chat/query")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chatId", notNullValue()))
                .andExpect(jsonPath("$.question").value("What is the baud rate?"))
                .andExpect(jsonPath("$.answer").value("The baud rate is 9600 bps."))
                .andExpect(jsonPath("$.confidenceScore").value(0.95))
                .andExpect(jsonPath("$.reasoningTrace", hasSize(1)))
                .andExpect(jsonPath("$.reasoningTrace[0].state").value("INITIAL_RETRIEVAL"))
                .andExpect(jsonPath("$.matches", hasSize(1)))
                .andExpect(jsonPath("$.matches[0].content").value("Set the baud rate parameter to 9600 bps."));

        mockServer.verify();
    }

    @Test
    void testQueryRAGDocumentNotFound() throws Exception {
        ChatRequest request = ChatRequest.builder()
                .documentId(UUID.randomUUID()) // fake ID
                .query("Hello")
                .build();

        mockMvc.perform(post("/api/chat/query")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testQueryRAGAccessDenied() throws Exception {
        ChatRequest request = ChatRequest.builder()
                .documentId(document2.getId()) // document2 belongs to user2, query run by user1
                .query("Secret keys")
                .build();

        mockMvc.perform(post("/api/chat/query")
                        .with(user(user1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetChatHistorySuccess() throws Exception {
        // Mock history retrieval for project1
        mockMvc.perform(get("/api/chat/history")
                        .param("projectId", project1.getId().toString())
                        .with(user(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0))); // No history yet
    }

    @Test
    void testGetChatHistoryAccessDenied() throws Exception {
        mockMvc.perform(get("/api/chat/history")
                        .param("projectId", project2.getId().toString()) // project2 owned by user2
                        .with(user(user1)))
                .andExpect(status().isForbidden());
    }
}
