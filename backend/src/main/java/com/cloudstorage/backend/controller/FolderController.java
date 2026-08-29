package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.dto.FolderRequest;
import com.cloudstorage.backend.dto.FolderResponse;
import com.cloudstorage.backend.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@Valid @RequestBody FolderRequest request) {
        return ResponseEntity.ok(folderService.createFolder(request));
    }

    @GetMapping
    public ResponseEntity<List<FolderResponse>> listFolders(
            @RequestParam(required = false) Long parentFolderId) {
        return ResponseEntity.ok(folderService.listFolders(parentFolderId));
    }
}