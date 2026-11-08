package task.usecase;

import exception.BusinessRuleViolationException;
import exception.DuplicateResourceException;
import exception.ResourceNotFoundException;
import project.model.Project;
import project.output.ProjectOutPut;
import task.enums.TaskStatus;
import task.input.UpdateTaskInput;
import task.model.Task;
import task.output.TaskOutPut;

import java.time.Clock;

public class UpdateTaskUseCase implements UpdateTaskInput {

    private final TaskOutPut taskOutput;
    private final ProjectOutPut projectOutput;
    private final Clock clock;

    public UpdateTaskUseCase(
            TaskOutPut taskOutput,
            ProjectOutPut projectOutput,
            Clock clock
    ) {
        this.taskOutput = taskOutput;
        this.projectOutput = projectOutput;
        this.clock = clock;
    }

    @Override
    public Task updateTask(
            Long projectId,
            Long taskId,
            String title,
            Integer estimateHours,
            String assignee,
            TaskStatus status,
            java.time.LocalDateTime dueDate
    ) {
        Project project = projectOutput.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found")
                );

        Task current = taskOutput.findById(taskId);

        if (current == null) {
            throw new ResourceNotFoundException("Task not found");
        }

        if (!current.getProject().getId().equals(projectId)) {
            throw new BusinessRuleViolationException(
                    "Task does not belong to project"
            );
        }

        if (!current.getTitle().equals(title) && taskOutput.existsByTitle(title)) {
            throw new DuplicateResourceException("Task title already exists");
        }

        Task task = Task.update(
                taskId,
                project,
                title,
                estimateHours,
                assignee,
                status,
                dueDate,
                current.getCreatedAt(),
                current.getFinishedAt(),
                clock
        );

        boolean saved = taskOutput.save(task);

        if (!saved) {
            throw new BusinessRuleViolationException("Could not update task");
        }

        return task;
    }
}
