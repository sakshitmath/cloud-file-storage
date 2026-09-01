package com.cloudstorage.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class LinkShareResponse {
    private Long id;
    private String token;
    private Long fileId;
    private boolean passwordProtected;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}