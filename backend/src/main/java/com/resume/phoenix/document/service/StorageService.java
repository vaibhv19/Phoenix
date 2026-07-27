package com.resume.phoenix.document.service;

import com.resume.phoenix.document.config.StorageProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final StorageProperties properties;
    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(properties.getUploadDir()).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("StorageService initialized at path: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public String store(MultipartFile file, UUID documentId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Failed to store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("Original filename cannot be null or empty.");
        }

        String cleanFileName = StringUtils.cleanPath(originalFilename);
        if (cleanFileName.contains("..")) {
            throw new IllegalArgumentException("Cannot store file with relative path outside current directory " + cleanFileName);
        }

        // Extract extension
        String extension = "";
        int dotIndex = cleanFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = cleanFileName.substring(dotIndex);
        }

        if (!extension.equalsIgnoreCase(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed.");
        }

        // Target unique filename: documentId + extension
        String uniqueFileName = documentId.toString() + extension;
        Path destinationFile = this.rootLocation.resolve(Paths.get(uniqueFileName)).normalize().toAbsolutePath();

        // Validate that the destination is indeed inside rootLocation to prevent directory traversal
        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new IllegalArgumentException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file successfully at: {}", destinationFile);
            return destinationFile.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }

    public void delete(String storagePath) {
        try {
            Path file = Paths.get(storagePath);
            Files.deleteIfExists(file);
            log.info("Deleted file at: {}", storagePath);
        } catch (IOException e) {
            log.warn("Could not delete file at: {}", storagePath, e);
        }
    }
}
