package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.ShareRequest;
import com.cloudstorage.backend.dto.ShareResponse;
import com.cloudstorage.backend.model.FileEntity;
import com.cloudstorage.backend.model.Permission;
import com.cloudstorage.backend.model.Share;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FileRepository;
import com.cloudstorage.backend.repository.ShareRepository;
import com.cloudstorage.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public ShareResponse shareFile(Long fileId, ShareRequest request) {
        User currentUser = getCurrentUser();

        FileEntity file = fileRepository.findByIdAndOwnerId(fileId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found or you are not the owner"));

        User targetUser = userRepository.findByEmail(request.getSharedWithEmail())
                .orElseThrow(() -> new IllegalArgumentException("No user found with that email"));

        if (targetUser.getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You cannot share a file with yourself");
        }

        Permission permission = Permission.valueOf(request.getPermission().toUpperCase());

        Share share = shareRepository.findByFileIdAndSharedWithUserId(fileId, targetUser.getId())
                .orElse(new Share());
        share.setFile(file);
        share.setSharedWithUser(targetUser);
        share.setSharedByUser(currentUser);
        share.setPermission(permission);

        Share saved = shareRepository.save(share);
        return toResponse(saved);
    }

    public List<ShareResponse> listSharesForFile(Long fileId) {
        User currentUser = getCurrentUser();
        fileRepository.findByIdAndOwnerId(fileId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found or you are not the owner"));

        return shareRepository.findByFileId(fileId)
                .stream().map(this::toResponse).toList();
    }

    public List<ShareResponse> listSharedWithMe() {
        User currentUser = getCurrentUser();
        return shareRepository.findBySharedWithUserId(currentUser.getId())
                .stream().map(this::toResponse).toList();
    }

    private ShareResponse toResponse(Share share) {
        return new ShareResponse(
                share.getId(),
                share.getFile().getId(),
                share.getFile().getOriginalName(),
                share.getSharedWithUser().getEmail(),
                share.getPermission().name(),
                share.getCreatedAt()
        );
    }
}