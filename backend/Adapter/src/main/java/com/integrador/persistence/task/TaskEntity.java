package com.integrador.persistence.task;


import com.integrador.persistence.project.ProjectEntity;
import jakarta.persistence.*;
import task.enums.TaskStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectEntity project;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Integer estimateHours;

    private String assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime finishedAt;

    private LocalDateTime dueDate;

    public TaskEntity() {}

    public TaskEntity(
            Long id,
            ProjectEntity project,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            LocalDateTime createdAt,
            LocalDateTime finishedAt,
            LocalDateTime dueDate
    ) {
        this.id = id;
        this.project = project;
        this.title = title;
        this.estimateHours = estimateHours;
        this.assignee = assignee;
        this.status = status;
        this.createdAt = createdAt;
        this.finishedAt = finishedAt;
        this.dueDate = dueDate;
    }

    public Long getId() { return id; }

    public void setId(Long id) {
        this.id = id;
    }

    public ProjectEntity getProject() { return project; }
    public void setProject(ProjectEntity project) { this.project = project; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getEstimateHours() { return estimateHours; }
    public void setEstimateHours(Integer estimateHours) { this.estimateHours = estimateHours; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }


}
