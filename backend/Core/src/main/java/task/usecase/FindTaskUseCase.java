package task.usecase;

import exception.BusinessRuleViolationException;
import exception.ResourceNotFoundException;
import project.output.ProjectOutPut;
import task.input.FindTaskInput;
import task.model.Task;
import task.output.TaskOutPut;

import java.util.List;

public class FindTaskUseCase implements FindTaskInput {

    private final TaskOutPut taskOutput;
    private final ProjectOutPut projectOutput;

    public FindTaskUseCase(TaskOutPut taskOutput) {
        this(taskOutput, null);
    }

    public FindTaskUseCase(
            TaskOutPut taskOutput,
            ProjectOutPut projectOutput
    ) {
        this.taskOutput = taskOutput;
        this.projectOutput = projectOutput;
    }

    @Override
    public List<Task> findTasks(Integer minEstimate, String assignee) {
        return taskOutput.findTasks(minEstimate, assignee);
    }

    @Override
    public List<Task> findTasksByProjectId(Long projectId) {
        projectOutput.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found")
                );

        return taskOutput.findByProjectId(projectId);
    }

    @Override
    public Task findById(Long projectId, Long taskId) {
        Task task = taskOutput.findById(taskId);

        if (task == null) {
            throw new ResourceNotFoundException("Task not found");
        }

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessRuleViolationException(
                    "Task does not belong to project"
            );
        }

        return task;
    }
}




