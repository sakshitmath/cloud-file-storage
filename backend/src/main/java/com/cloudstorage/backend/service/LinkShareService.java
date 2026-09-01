package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.LinkShareRequest;
import com.cloudstorage.backend.dto.LinkShareResponse;
import com.cloudstorage.backend.model.FileEntity;
import com.cloudstorage.backend.model.LinkShare;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FileRepository;
import com.cloudstorage.backend.repository.LinkShareRepository;
import com.cloudstorage.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LinkShareService {

    private final LinkShareRepository linkShareRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public LinkShareResponse createLink(Long fileId, LinkShareRequest request) {
        User user = getCurrentUser();
        FileEntity file = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found or you are not the owner"));

        LinkShare linkShare = new LinkShare();
        linkShare.setToken(UUID.randomUUID().toString());
        linkShare.setFile(file);
        linkShare.setCreatedByUser(user);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            linkShare.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getExpiresInHours() != null) {
            linkShare.setExpiresAt(LocalDateTime.now().plusHours(request.getExpiresInHours()));
        }

        LinkShare saved = linkShareRepository.save(linkShare);
        return toResponse(saved);
    }

    public FileEntity accessLink(String token, String providedPassword) {
        LinkShare linkShare = linkShareRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired link"));

        if (linkShare.getExpiresAt() != null && linkShare.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This link has expired");
        }

        if (linkShare.getPassword() != null) {
            if (providedPassword == null || !passwordEncoder.matches(providedPassword, linkShare.getPassword())) {
                throw new IllegalArgumentException("Incorrect or missing password");
            }
        }

        return linkShare.getFile();
    }

    private LinkShareResponse toResponse(LinkShare linkShare) {
        return new LinkShareResponse(
                linkShare.getId(),
                linkShare.getToken(),
                linkShare.getFile().getId(),
                linkShare.getPassword() != null,
                linkShare.getExpiresAt(),
                linkShare.getCreatedAt()
        );
    }
}