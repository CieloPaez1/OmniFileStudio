package com.integrador.persistence.filemanager;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManagedFileJPARepository extends JpaRepository<ManagedFileEntity, Long> {
    List<ManagedFileEntity> findAllByOrderByCreatedAtDesc();
}
