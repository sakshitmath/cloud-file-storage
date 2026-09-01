package com.cloudstorage.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ShareResponse {
    private Long id;
    private Long fileId;
    private String fileName;
    private String sharedWithEmail;
    private String permission;
    private LocalDateTime createdAt;
}