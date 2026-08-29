package com.cloudstorage.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FolderResponse {
    private Long id;
    private String name;
    private Long parentFolderId;
    private LocalDateTime createdAt;
}