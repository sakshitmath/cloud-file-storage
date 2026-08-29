package com.cloudstorage.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FolderRequest {

    @NotBlank
    private String name;

    private Long parentFolderId;
}