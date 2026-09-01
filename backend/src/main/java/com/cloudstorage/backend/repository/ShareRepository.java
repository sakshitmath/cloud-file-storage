package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShareRepository extends JpaRepository<Share, Long> {

    List<Share> findByFileId(Long fileId);

    List<Share> findBySharedWithUserId(Long userId);

    Optional<Share> findByFileIdAndSharedWithUserId(Long fileId, Long userId);
}