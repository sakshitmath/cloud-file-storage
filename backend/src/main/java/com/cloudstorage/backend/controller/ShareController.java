package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.dto.ShareRequest;
import com.cloudstorage.backend.dto.ShareResponse;
import com.cloudstorage.backend.service.ShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping("/files/{fileId}/share")
    public ResponseEntity<ShareResponse> shareFile(
            @PathVariable Long fileId,
            @Valid @RequestBody ShareRequest request) {
        return ResponseEntity.ok(shareService.shareFile(fileId, request));
    }

    @GetMapping("/files/{fileId}/shares")
    public ResponseEntity<List<ShareResponse>> listSharesForFile(@PathVariable Long fileId) {
        return ResponseEntity.ok(shareService.listSharesForFile(fileId));
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<ShareResponse>> listSharedWithMe() {
        return ResponseEntity.ok(shareService.listSharedWithMe());
    }
}