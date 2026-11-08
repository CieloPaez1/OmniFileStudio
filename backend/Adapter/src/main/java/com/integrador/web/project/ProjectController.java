package com.integrador.web.project;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.input.CreateProjectInput;
import project.input.DeleteProjectInput;
import project.input.FindProjectInput;
import project.input.UpdateProjectInput;
import project.model.Project;
import java.util.List;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final CreateProjectInput createProject;
    private final DeleteProjectInput deleteProject;
    private final FindProjectInput findProjects;
    private final UpdateProjectInput updateProject;

    public ProjectController(
            CreateProjectInput createProject,
            DeleteProjectInput deleteProject,
            FindProjectInput findProjects,
            UpdateProjectInput updateProject
    ) {
        this.createProject = createProject;
        this.deleteProject = deleteProject;
        this.findProjects = findProjects;
        this.updateProject = updateProject;
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjects() {
        List<ProjectResponseDTO> projects = findProjects.execute()
                .stream()
                .map(ProjectResponseDTO::from)
                .toList();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(
            @PathVariable Long projectId
    ) {
        Project project = findProjects.findById(projectId);
        return ResponseEntity.ok(ProjectResponseDTO.from(project));
    }

    @PostMapping
    public ResponseEntity<ProjectResponseDTO> createProject(
            @Valid @RequestBody ProjectDTO request
    ) {
        Project project = Project.create(
                request.getName(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStatus(),
                request.getDescription()
        );

        Project result = createProject.createProject(project);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ProjectResponseDTO.from(result));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponseDTO> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDTO request
    ) {
        Project result = updateProject.updateProject(
                projectId,
                request.getName(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStatus(),
                request.getDescription()
        );

        return ResponseEntity.ok(ProjectResponseDTO.from(result));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long projectId
    ) {
        deleteProject.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }
}
