package com.integrador.persistence.task;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskJPARepository
        extends JpaRepository<TaskEntity, Long> {

    boolean existsByTitle(String title);

    int countByProjectId(Long projectId);

    List<TaskEntity> findByProjectId(Long projectId);

    @Query("SELECT t FROM TaskEntity t WHERE " +
            "(:minEstimate IS NULL OR t.estimateHours >= :minEstimate) AND " +
            "(:assignee IS NULL OR t.assignee = :assignee)")
    List<TaskEntity> findByFilters(
            @Param("minEstimate") Integer minEstimate,
            @Param("assignee") String assignee
    );
}
