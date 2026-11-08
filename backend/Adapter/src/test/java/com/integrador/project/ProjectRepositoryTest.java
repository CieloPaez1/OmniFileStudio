package com.integrador.project;



import com.integrador.persistence.project.ProjectEntity;
import com.integrador.persistence.project.ProjectJPARepository;
import com.integrador.persistence.project.ProjectRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectRepositoryTest {

    @Mock
    private ProjectJPARepository projectJpa;

    @InjectMocks
    private ProjectRepository projectRepository;

    private Project createProject() {

        return Project.create( "Sistema",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                ProjectStatus.ACTIVE,
                "Proyecto test"
        );
    }

    @Test
    public void saveProjectFailsWhenIdNullTest() {

        Project project = createProject();

        ProjectEntity savedEntity = new ProjectEntity();

        when(projectJpa.save(any(ProjectEntity.class)))
                .thenReturn(savedEntity);

        boolean result = projectRepository.save(project);

        Assertions.assertFalse(result);
    }

    @Test
    public void findByIdReturnsProjectTest() {

        ProjectEntity entity = new ProjectEntity();
        entity.setId(1L);

        when(projectJpa.findById(1L))
                .thenReturn(Optional.of(entity));

        Optional<Project> result = projectRepository.findById(1L);

        Assertions.assertTrue(result.isPresent());
    }

    @Test
    public void findByIdReturnsEmptyTest() {

        when(projectJpa.findById(1L))
                .thenReturn(Optional.empty());

        Optional<Project> result = projectRepository.findById(1L);

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    public void existsByNameReturnsTrueTest() {

        when(projectJpa.existsByName("Sistema"))
                .thenReturn(true);

        boolean result = projectRepository.existsByName("Sistema");

        Assertions.assertTrue(result);
    }

    @Test
    public void existsByNameReturnsFalseTest() {

        when(projectJpa.existsByName("Sistema"))
                .thenReturn(false);

        boolean result = projectRepository.existsByName("Sistema");

        Assertions.assertFalse(result);
    }
}