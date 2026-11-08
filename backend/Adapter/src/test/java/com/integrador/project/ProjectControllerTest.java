package com.integrador.project;

import com.integrador.web.project.ProjectController;
import com.integrador.web.project.ProjectDTO;
import com.integrador.web.project.ProjectResponseDTO;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import project.enums.ProjectStatus;
import project.input.CreateProjectInput;
import project.input.DeleteProjectInput;
import project.model.Project;


import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProjectControllerTest {

    @Mock
    private CreateProjectInput createProject;

    @Mock
    private DeleteProjectInput deleteProject;

    @InjectMocks
    private ProjectController projectController;

    @Test
    void shouldCreateProjectSuccessfully() {

        ProjectDTO dto = new ProjectDTO();
        dto.setName("Sistema");
        dto.setStartDate(LocalDate.now());
        dto.setEndDate(LocalDate.now().plusDays(10));
        dto.setStatus(ProjectStatus.ACTIVE);
        dto.setDescription("Proyecto test");

        Project project = Project.create(
                dto.getName(),
                dto.getStartDate(),
                dto.getEndDate(),
                dto.getStatus(),
                dto.getDescription()
        );

        when(createProject.createProject(any(Project.class)))
                .thenReturn(project);

        ResponseEntity<ProjectResponseDTO> response =
                projectController.createProject(dto);

        Assertions.assertEquals(
                HttpStatus.CREATED,
                response.getStatusCode()
        );
    }

    @Test
    void shouldDeleteProjectSuccessfully() {

        ResponseEntity<Void> response =
                projectController.deleteProject(1L);

        Assertions.assertEquals(
                HttpStatus.NO_CONTENT,
                response.getStatusCode()
        );

        verify(deleteProject).deleteProject(1L);
    }
}