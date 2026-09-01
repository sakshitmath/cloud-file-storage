package com.cloudstorage.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkShareRequest {
    private String password;
    private Integer expiresInHours;
}