package com.cloudstorage.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileUpdateRequest {
    private String originalName;
    private Long folderId;
}