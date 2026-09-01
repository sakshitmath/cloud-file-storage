package com.cloudstorage.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShareRequest {

    @NotBlank
    @Email
    private String sharedWithEmail;

    @NotNull
    private String permission;
}