package usecase;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;
import exception.BusinessRuleViolationException;
import exception.ResourceNotFoundException;
import task.enums.TaskStatus;
import task.model.Task;
import task.output.TaskOutPut;
import task.usecase.DeleteTaskUseCase;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DeleteTaskUseCaseTest {

    @Mock
    private TaskOutPut taskOutPut;

    private final Clock fixedClock = Clock.fixed(
            LocalDateTime.now().plusMonths(1)
                    .toInstant(ZoneOffset.UTC),
            ZoneOffset.UTC
    );

    private Project buildProject(String name) {
        return Project.create(
                name,
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.ACTIVE,
                null
        );
    }

    @Test
    void shouldDeleteTaskSuccessfully() {

        Long projectId = 1L;
        Long taskId = 10L;

        Project project = buildProject("Project A");

        Task task = Task.create(
                project,
                "Task A",
                5,
                "Alice",
                TaskStatus.TODO,
                null,
                fixedClock
        );
        task.getProject().setId(1L);

        when(taskOutPut.findById(taskId)).thenReturn(task);
        when(taskOutPut.deleteById(taskId)).thenReturn(true);

        DeleteTaskUseCase useCase = new DeleteTaskUseCase(taskOutPut);

        Assertions.assertDoesNotThrow(
                () -> useCase.deleteTask(projectId, taskId)
        );
    }

    @Test
    void shouldThrowExceptionWhenTaskDoesNotExist() {

        Long projectId = 1L;
        Long taskId = 10L;

        when(taskOutPut.findById(taskId)).thenReturn(null);

        DeleteTaskUseCase useCase = new DeleteTaskUseCase(taskOutPut);

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> useCase.deleteTask(projectId, taskId)
        );
    }

    @Test
    void shouldThrowExceptionWhenTaskDoesNotBelongToProject() {


        Long projectId = 1L;
        Long taskId = 10L;

        Project otherProject = buildProject("Project B");
        otherProject.setId(2L);

        Task task = Task.create(
                otherProject,
                "Task A",
                5,
                "Alice",
                TaskStatus.TODO,
                null,
                fixedClock
        );

        when(taskOutPut.findById(taskId)).thenReturn(task);

        DeleteTaskUseCase useCase = new DeleteTaskUseCase(taskOutPut);

        Assertions.assertThrows(
                BusinessRuleViolationException.class,
                () -> useCase.deleteTask(projectId, taskId)
        );
    }

    @Test
    void shouldThrowExceptionWhenDeleteFails() {

        Long projectId = 1L;
        Long taskId = 10L;

        Project project = buildProject("Project A");

        Task task = Task.create(
                project,
                "Task A",
                5,
                "Alice",
                TaskStatus.TODO,
                null,
                fixedClock
        );
        task.getProject().setId(1L);

        when(taskOutPut.findById(taskId)).thenReturn(task);
        when(taskOutPut.deleteById(taskId)).thenReturn(false);

        DeleteTaskUseCase useCase = new DeleteTaskUseCase(taskOutPut);

        Assertions.assertThrows(
                BusinessRuleViolationException.class,
                () -> useCase.deleteTask(projectId, taskId)
        );
    }
}