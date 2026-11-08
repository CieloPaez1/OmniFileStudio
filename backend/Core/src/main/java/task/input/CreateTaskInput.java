package task.input;


import task.enums.TaskStatus;
import task.model.Task;




public interface CreateTaskInput {
    Task createTask(
            Long projectId,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            java.time.LocalDateTime dueDate
    );
}