package com.cloudstorage.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StorageService {

    private final Path rootLocation = Paths.get("uploads");

    public StorageService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage folder", e);
        }
    }

    public String store(MultipartFile file) {
        try {
            String extension = "";
            String originalName = file.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String storedName = UUID.randomUUID() + extension;

            Path destination = rootLocation.resolve(storedName);
            Files.copy(file.getInputStream(), destination);

            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public InputStream load(String storedName) {
        try {
            Path filePath = rootLocation.resolve(storedName);
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + storedName, e);
        }
    }

    public void delete(String storedName) {
        try {
            Path filePath = rootLocation.resolve(storedName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + storedName, e);
        }
    }
}