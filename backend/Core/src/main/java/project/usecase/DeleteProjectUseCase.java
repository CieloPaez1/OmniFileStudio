package project.usecase;

import exception.BusinessRuleViolationException;
import exception.ResourceNotFoundException;
import project.input.DeleteProjectInput;
import project.output.ProjectOutPut;
import task.output.TaskOutPut;

public class DeleteProjectUseCase implements DeleteProjectInput {

    private final ProjectOutPut projectOutPut;
    private final TaskOutPut taskOutPut;

    public DeleteProjectUseCase(
            ProjectOutPut projectOutPut,
            TaskOutPut taskOutPut
    ) {
        this.projectOutPut = projectOutPut;
        this.taskOutPut = taskOutPut;
    }

    @Override
    public void deleteProject(Long projectId) {

        projectOutPut.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Proyecto no encontrado")
                );

        if (taskOutPut.countTasksByProjectId(projectId) > 0) {
            throw new BusinessRuleViolationException(
                    "No se puede eliminar el proyecto con tareas"
            );
        }

        projectOutPut.deleteById(projectId);
    }
}