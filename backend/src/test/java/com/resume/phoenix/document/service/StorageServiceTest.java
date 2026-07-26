package com.resume.phoenix.document.service;

import com.resume.phoenix.document.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageServiceTest {

    private StorageService storageService;
    private StorageProperties properties;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        properties = new StorageProperties();
        properties.setUploadDir(tempDir.toString());
        storageService = new StorageService(properties);
        storageService.init();
    }

    @Test
    void testStoreSuccess() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                "Hello, PDF Content!".getBytes()
        );
        UUID documentId = UUID.randomUUID();

        String storedPathStr = storageService.store(file, documentId);
        Path storedPath = Paths.get(storedPathStr);

        assertThat(storedPath).exists();
        assertThat(storedPath.getFileName().toString()).isEqualTo(documentId.toString() + ".pdf");
        assertThat(Files.readAllBytes(storedPath)).isEqualTo("Hello, PDF Content!".getBytes());
    }

    @Test
    void testStorePathTraversalThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../traversal-file.pdf",
                "application/pdf",
                "Malicious Content".getBytes()
        );
        UUID documentId = UUID.randomUUID();

        assertThatThrownBy(() -> storageService.store(file, documentId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("relative path");
    }

    @Test
    void testStoreEmptyFileThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );
        UUID documentId = UUID.randomUUID();

        assertThatThrownBy(() -> storageService.store(file, documentId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty");
    }
}
