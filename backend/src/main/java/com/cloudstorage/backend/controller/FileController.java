package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.dto.FileResponse;
import com.cloudstorage.backend.model.FileEntity;
import com.cloudstorage.backend.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<FileResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long folderId) {
        return ResponseEntity.ok(fileService.uploadFile(file, folderId));
    }

    @GetMapping
    public ResponseEntity<List<FileResponse>> listFiles(
            @RequestParam(required = false) Long folderId) {
        return ResponseEntity.ok(fileService.listFiles(folderId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        FileEntity file = fileService.getFileForDownload(id);
        Resource resource = fileService.loadFileResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        fileService.softDeleteFile(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restoreFile(@PathVariable Long id) {
        fileService.restoreFile(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trash")
    public ResponseEntity<List<FileResponse>> listTrash() {
        return ResponseEntity.ok(fileService.listTrash());
    }
    @PostMapping("/{id}/star")
    public ResponseEntity<FileResponse> toggleStar(@PathVariable Long id) {
        return ResponseEntity.ok(fileService.toggleStar(id));
    }

    @GetMapping("/starred")
    public ResponseEntity<List<FileResponse>> listStarred() {
        return ResponseEntity.ok(fileService.listStarred());
    }
    @GetMapping("/search")
    public ResponseEntity<List<FileResponse>> searchFiles(@RequestParam String query) {
        return ResponseEntity.ok(fileService.searchFiles(query));
    }
}