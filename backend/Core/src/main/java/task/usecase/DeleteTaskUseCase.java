package task.usecase;

import exception.BusinessRuleViolationException;
import exception.ResourceNotFoundException;
import task.input.DeleteTaskInput;
import task.model.Task;
import task.output.TaskOutPut;

public class DeleteTaskUseCase implements DeleteTaskInput {

    private final TaskOutPut taskOutput;

    public DeleteTaskUseCase(TaskOutPut taskOutput) {
        this.taskOutput = taskOutput;
    }

    @Override
    public void deleteTask(Long projectId, Long taskId) {

        Task task = taskOutput.findById(taskId);

        if (task == null) {
            throw new ResourceNotFoundException("Task not found");
        }

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessRuleViolationException(
                    "Task does not belong to project"
            );
        }

        boolean deleted = taskOutput.deleteById(taskId);

        if (!deleted) {
            throw new BusinessRuleViolationException("Could not delete task");
        }
    }
}