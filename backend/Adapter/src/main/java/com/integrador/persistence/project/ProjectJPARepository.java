package com.integrador.persistence.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectJPARepository
        extends JpaRepository<ProjectEntity, Long> {

    boolean existsByName(String name);
}
