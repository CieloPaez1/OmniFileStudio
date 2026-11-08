package task.input;

import task.enums.TaskStatus;
import task.model.Task;

public interface UpdateTaskInput {

    Task updateTask(
            Long projectId,
            Long taskId,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            java.time.LocalDateTime dueDate
    );
}
