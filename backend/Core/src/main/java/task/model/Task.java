package task.model;

import exception.BusinessRuleViolationException;
import exception.ValidationException;
import project.model.Project;
import task.enums.TaskStatus;

import java.time.Clock;
import java.time.LocalDateTime;

public class Task {

    private Long id;
    private final Project project;
    private final String title;
    private final Integer estimateHours;
    private final String assignee;
    private final TaskStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime finishedAt;
    private final LocalDateTime dueDate;

    private Task(
            Long id,
            Project project,
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

    public static Task create(
            Project project,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            LocalDateTime dueDate,
            Clock clock
    ) {
        validate(project, title, estimateHours, status, clock);

        if (project.isClosed()) {
            throw new BusinessRuleViolationException(
                    "Cannot add tasks to a closed project"
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime finishedAt = TaskStatus.DONE.equals(status) ? now : null;

        return new Task(null, project, title, estimateHours, assignee,
                status, now, finishedAt, dueDate);
    }

    private static void validate(
            Project project,
            String title,
            Integer estimateHours,
            TaskStatus status,
            Clock clock
    ) {
        if (project == null) {
            throw new ValidationException("Task must belong to a project");
        }

        if (title == null || title.isBlank()) {
            throw new ValidationException("Task title cannot be null or blank");
        }

        if (estimateHours == null || estimateHours <= 0) {
            throw new ValidationException("Estimate hours must be greater than 0");
        }

        if (status == null) {
            throw new ValidationException("Task status cannot be null");
        }

        if (clock == null) {
            throw new ValidationException("Clock cannot be null");
        }
    }


    public boolean isDone() { return TaskStatus.DONE.equals(this.status); }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getTitle() { return title; }
    public Integer getEstimateHours() { return estimateHours; }
    public String getAssignee() { return assignee; }
    public TaskStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public LocalDateTime getDueDate() { return dueDate; }

    public static Task restore(
            Long id,
            Project project,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            LocalDateTime createdAt,
            LocalDateTime finishedAt,
            LocalDateTime dueDate
    ) {
        return new Task(id, project, title, estimateHours,
                assignee, status, createdAt, finishedAt, dueDate);
    }

    public static Task update(
            Long id,
            Project project,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            LocalDateTime dueDate,
            LocalDateTime createdAt,
            LocalDateTime currentFinishedAt,
            Clock clock
    ) {
        validate(project, title, estimateHours, status, clock);

        LocalDateTime finishedAt = TaskStatus.DONE.equals(status)
                ? currentFinishedAt != null ? currentFinishedAt : LocalDateTime.now(clock)
                : null;

        return new Task(id, project, title, estimateHours,
                assignee, status, createdAt, finishedAt, dueDate);
    }

    public void setId(Long id) {
        this.id = id;
    }
}
