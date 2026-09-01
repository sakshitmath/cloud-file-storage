package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.dto.LinkShareRequest;
import com.cloudstorage.backend.dto.LinkShareResponse;
import com.cloudstorage.backend.model.FileEntity;
import com.cloudstorage.backend.service.FileService;
import com.cloudstorage.backend.service.LinkShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LinkShareController {

    private final LinkShareService linkShareService;
    private final FileService fileService;

    // Protected: only the file owner (logged in) can create a link
    @PostMapping("/api/files/{fileId}/link-share")
    public ResponseEntity<LinkShareResponse> createLink(
            @PathVariable Long fileId,
            @RequestBody LinkShareRequest request) {
        return ResponseEntity.ok(linkShareService.createLink(fileId, request));
    }

    // Public: no login required, anyone with the token (and password, if set) can access
    @GetMapping("/api/public/files/{token}")
    public ResponseEntity<Resource> accessPublicLink(
            @PathVariable String token,
            @RequestParam(required = false) String password) {
        FileEntity file = linkShareService.accessLink(token, password);
        Resource resource = fileService.loadFileResource(file);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalName() + "\"")
                .body(resource);
    }
}