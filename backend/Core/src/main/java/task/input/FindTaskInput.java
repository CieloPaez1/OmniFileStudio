package task.input;

import task.model.Task;

import java.util.List;

public interface FindTaskInput {

    List<Task> findTasks(
            Integer minEstimate,
            String assignee
    );

    List<Task> findTasksByProjectId(Long projectId);

    Task findById(Long projectId, Long taskId);
}
