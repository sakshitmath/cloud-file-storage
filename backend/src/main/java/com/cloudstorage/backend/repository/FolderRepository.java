package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByOwnerIdAndParentFolderIdAndDeletedFalse(Long ownerId, Long parentFolderId);

    List<Folder> findByOwnerIdAndParentFolderIsNullAndDeletedFalse(Long ownerId);
}