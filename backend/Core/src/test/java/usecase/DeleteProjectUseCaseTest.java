package usecase;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;
import project.output.ProjectOutPut;
import exception.BusinessRuleViolationException;
import exception.ResourceNotFoundException;
import project.usecase.DeleteProjectUseCase;
import task.output.TaskOutPut;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DeleteProjectUseCaseTest {

    @Mock
    private ProjectOutPut projectOutPut;

    @Mock
    private TaskOutPut taskOutPut;

    private Project buildProject() {
        return Project.create(
                "Website",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.ACTIVE,
                null
        );
    }

    @Test
    void shouldDeleteProjectSuccessfully() {

        Long projectId = 1L;
        Project project = buildProject();

        when(projectOutPut.findById(projectId))
                .thenReturn(Optional.of(project));

        when(taskOutPut.countTasksByProjectId(projectId))
                .thenReturn(0);

        DeleteProjectUseCase useCase =
                new DeleteProjectUseCase(projectOutPut, taskOutPut);

        Assertions.assertDoesNotThrow(
                () -> useCase.deleteProject(projectId)
        );
    }

    @Test
    void shouldThrowExceptionWhenProjectDoesNotExist() {

        Long projectId = 1L;

        when(projectOutPut.findById(projectId))
                .thenReturn(Optional.empty());

        DeleteProjectUseCase useCase =
                new DeleteProjectUseCase(projectOutPut, taskOutPut);

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> useCase.deleteProject(projectId)
        );
    }

    @Test
    void shouldThrowExceptionWhenProjectHasTasks() {

        Long projectId = 1L;
        Project project = buildProject();

        when(projectOutPut.findById(projectId))
                .thenReturn(Optional.of(project));

        when(taskOutPut.countTasksByProjectId(projectId))
                .thenReturn(5);

        DeleteProjectUseCase useCase =
                new DeleteProjectUseCase(projectOutPut, taskOutPut);

        Assertions.assertThrows(
                BusinessRuleViolationException.class,
                () -> useCase.deleteProject(projectId)
        );
    }
}