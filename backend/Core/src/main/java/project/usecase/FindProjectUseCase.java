package project.usecase;

import exception.ResourceNotFoundException;
import project.input.FindProjectInput;
import project.model.Project;
import project.output.ProjectOutPut;
import java.util.List;

public class FindProjectUseCase implements FindProjectInput {
    private final ProjectOutPut projectOutPut;

    public FindProjectUseCase(ProjectOutPut projectOutPut) {
        this.projectOutPut = projectOutPut;
    }

    @Override
    public List<Project> execute() {
        return projectOutPut.findAll();
    }

    @Override
    public Project findById(Long projectId) {
        return projectOutPut.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Proyecto no encontrado")
                );
    }
}
