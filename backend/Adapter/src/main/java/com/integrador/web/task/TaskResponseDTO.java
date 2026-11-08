package com.integrador.web.task;


import task.enums.TaskStatus;
import task.model.Task;

import java.time.LocalDateTime;

public class TaskResponseDTO {

    private Long id;
    private Long projectId;
    private String title;
    private Integer estimateHours;
    private String assignee;
    private TaskStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;
    private LocalDateTime dueDate;

    public TaskResponseDTO() {}

    public static TaskResponseDTO from(Task task) {
        TaskResponseDTO dto = new TaskResponseDTO();
        dto.id = task.getId();
        dto.projectId = task.getProject().getId();
        dto.title = task.getTitle();
        dto.estimateHours = task.getEstimateHours();
        dto.assignee = task.getAssignee();
        dto.status = task.getStatus();
        dto.createdAt = task.getCreatedAt();
        dto.finishedAt = task.getFinishedAt();
        dto.dueDate = task.getDueDate();
        return dto;
    }

    public Long getId() { return id; }
    public Long getProjectId() { return projectId; }
    public String getTitle() { return title; }
    public Integer getEstimateHours() { return estimateHours; }
    public String getAssignee() { return assignee; }
    public TaskStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public LocalDateTime getDueDate() { return dueDate; }
}