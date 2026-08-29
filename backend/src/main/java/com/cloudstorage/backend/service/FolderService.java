package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.FolderRequest;
import com.cloudstorage.backend.dto.FolderResponse;
import com.cloudstorage.backend.model.Folder;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FolderRepository;
import com.cloudstorage.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public FolderResponse createFolder(FolderRequest request) {
        User user = getCurrentUser();

        Folder folder = new Folder();
        folder.setName(request.getName());
        folder.setOwner(user);

        if (request.getParentFolderId() != null) {
            Folder parent = folderRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent folder not found"));
            folder.setParentFolder(parent);
        }

        Folder saved = folderRepository.save(folder);
        return toResponse(saved);
    }

    public List<FolderResponse> listFolders(Long parentFolderId) {
        User user = getCurrentUser();
        List<Folder> folders = (parentFolderId == null)
                ? folderRepository.findByOwnerIdAndParentFolderIsNullAndDeletedFalse(user.getId())
                : folderRepository.findByOwnerIdAndParentFolderIdAndDeletedFalse(user.getId(), parentFolderId);

        return folders.stream().map(this::toResponse).toList();
    }

    private FolderResponse toResponse(Folder folder) {
        return new FolderResponse(
                folder.getId(),
                folder.getName(),
                folder.getParentFolder() != null ? folder.getParentFolder().getId() : null,
                folder.getCreatedAt()
        );
    }
}