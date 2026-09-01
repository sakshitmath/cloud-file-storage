package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.FileResponse;
import com.cloudstorage.backend.model.FileEntity;
import com.cloudstorage.backend.model.Folder;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FileRepository;
import com.cloudstorage.backend.repository.FolderRepository;
import com.cloudstorage.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public FileResponse uploadFile(MultipartFile multipartFile, Long folderId) {
        User user = getCurrentUser();

        String storedName = storageService.store(multipartFile);

        FileEntity file = new FileEntity();
        file.setOriginalName(multipartFile.getOriginalFilename());
        file.setStoredName(storedName);
        file.setContentType(multipartFile.getContentType());
        file.setSize(multipartFile.getSize());
        file.setOwner(user);

        if (folderId != null) {
            Folder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            file.setFolder(folder);
        }

        FileEntity saved = fileRepository.save(file);
        return toResponse(saved);
    }

    public List<FileResponse> listFiles(Long folderId) {
        User user = getCurrentUser();
        List<FileEntity> files = (folderId == null)
                ? fileRepository.findByOwnerIdAndFolderIsNullAndDeletedFalse(user.getId())
                : fileRepository.findByOwnerIdAndFolderIdAndDeletedFalse(user.getId(), folderId);

        return files.stream().map(this::toResponse).toList();
    }

    public FileEntity getFileForDownload(Long fileId) {
        User user = getCurrentUser();
        return fileRepository.findByIdAndOwnerId(fileId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
    }

    public Resource loadFileResource(FileEntity file) {
        return new InputStreamResource(storageService.load(file.getStoredName()));
    }

    private FileResponse toResponse(FileEntity file) {
        return new FileResponse(
                file.getId(),
                file.getOriginalName(),
                file.getContentType(),
                file.getSize(),
                file.getFolder() != null ? file.getFolder().getId() : null,
                file.isStarred(),
                file.getCreatedAt()
        );
    }

    public void softDeleteFile(Long fileId) {
        User user = getCurrentUser();
        FileEntity file = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
        file.setDeleted(true);
        fileRepository.save(file);
    }

    public void restoreFile(Long fileId) {
        User user = getCurrentUser();
        FileEntity file = fileRepository.findByIdAndOwnerId(fileId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
        file.setDeleted(false);
        fileRepository.save(file);
    }

    public List<FileResponse> listTrash() {
        User user = getCurrentUser();
        return fileRepository.findByOwnerIdAndDeletedTrue(user.getId())
                .stream().map(this::toResponse).toList();
    }
}