package task.usecase;

import exception.BusinessRuleViolationException;
import exception.DuplicateResourceException;
import exception.ResourceNotFoundException;
import project.enums.ProjectStatus;
import project.model.Project;
import project.output.ProjectOutPut;
import task.enums.TaskStatus;
import task.input.CreateTaskInput;
import task.model.Task;
import task.output.TaskOutPut;

import java.time.Clock;

public class CreateTaskUseCase implements CreateTaskInput {

    private final TaskOutPut taskOutput;
    private final ProjectOutPut projectOutput;
    private final Clock clock;

    public CreateTaskUseCase(
            TaskOutPut taskOutput,
            ProjectOutPut projectOutput,
            Clock clock
    ) {
        this.taskOutput = taskOutput;
        this.projectOutput = projectOutput;
        this.clock = clock;
    }

    @Override
    public Task createTask(
            Long projectId,
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

        if (project.getStatus() == ProjectStatus.CLOSED) {
            throw new BusinessRuleViolationException(
                    "Cannot add tasks to closed project"
            );
        }

        if (taskOutput.existsByTitle(title)) {
            throw new DuplicateResourceException("Task title already exists");
        }

        Task task = Task.create(project, title, estimateHours,
                assignee, status, dueDate, clock);

        boolean saved = taskOutput.save(task);

        if (!saved) {
            throw new BusinessRuleViolationException("Could not save task");
        }

        return task;
    }
}