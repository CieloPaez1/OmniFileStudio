package project.usecase;

import exception.DuplicateResourceException;
import exception.ResourceNotFoundException;
import exception.ValidationException;
import project.enums.ProjectStatus;
import project.input.UpdateProjectInput;
import project.model.Project;
import project.output.ProjectOutPut;

import java.time.LocalDate;

public class UpdateProjectUseCase implements UpdateProjectInput {

    private final ProjectOutPut projectOutput;

    public UpdateProjectUseCase(ProjectOutPut projectOutput) {
        this.projectOutput = projectOutput;
    }

    @Override
    public Project updateProject(
            Long projectId,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    ) {
        Project current = projectOutput.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Proyecto no encontrado")
                );

        if (!current.getName().equals(name) && projectOutput.existsByName(name)) {
            throw new DuplicateResourceException("El nombre del proyecto ya existe");
        }

        Project project = Project.update(projectId, name, startDate,
                endDate, status, description);

        boolean saved = projectOutput.save(project);

        if (!saved) {
            throw new ValidationException("No se pudo actualizar el proyecto.");
        }

        return project;
    }
}
