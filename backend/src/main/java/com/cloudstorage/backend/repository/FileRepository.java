package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileRepository extends JpaRepository<FileEntity, Long> {

    List<FileEntity> findByOwnerIdAndFolderIdAndDeletedFalse(Long ownerId, Long folderId);

    List<FileEntity> findByOwnerIdAndFolderIsNullAndDeletedFalse(Long ownerId);

    Optional<FileEntity> findByIdAndOwnerId(Long id, Long ownerId);
}