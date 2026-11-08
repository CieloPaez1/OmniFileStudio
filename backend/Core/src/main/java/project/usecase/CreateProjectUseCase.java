package project.usecase;

import exception.DuplicateResourceException;
import exception.ValidationException;
import project.input.CreateProjectInput;
import project.model.Project;
import project.output.ProjectOutPut;

public class CreateProjectUseCase implements CreateProjectInput {

    private final ProjectOutPut projectOutput;

    public CreateProjectUseCase(ProjectOutPut projectOutput) {
        this.projectOutput = projectOutput;
    }

    @Override
    public Project createProject(Project project) {

        if (projectOutput.existsByName(project.getName())) {
            throw new DuplicateResourceException("El nombre del proyecto ya existe");
        }

        Boolean saved = projectOutput.save(project);

        if (saved == null || !saved) {
            throw new ValidationException("No se pudo guardar el proyecto.");
        }

        return project;
    }
}