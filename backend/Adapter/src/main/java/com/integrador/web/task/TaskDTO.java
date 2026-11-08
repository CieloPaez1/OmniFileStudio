package com.integrador.web.task;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import task.enums.TaskStatus;

public class TaskDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Estimate hours is required")
    @Min(value = 1, message = "Estimate hours must be greater than 0")
    private Integer estimateHours;

    private String assignee;

    @NotNull(message = "Status is required")
    private TaskStatus status;

    private java.time.LocalDateTime dueDate;

    public TaskDTO() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getEstimateHours() { return estimateHours; }
    public void setEstimateHours(Integer estimateHours) { this.estimateHours = estimateHours; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public java.time.LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(java.time.LocalDateTime dueDate) { this.dueDate = dueDate; }
}