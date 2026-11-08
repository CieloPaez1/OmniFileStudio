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
import exception.DuplicateResourceException;
import exception.ResourceNotFoundException;
import task.enums.TaskStatus;
import task.model.Task;
import task.output.TaskOutPut;
import task.usecase.CreateTaskUseCase;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CreateTaskUseCaseTest {

    @Mock
    private TaskOutPut taskOutPut;

    @Mock
    private ProjectOutPut projectOutPut;

    private final Clock fixedClock = Clock.fixed(
            LocalDateTime.now().plusMonths(1)
                    .toInstant(ZoneOffset.UTC),
            ZoneOffset.UTC
    );

    private Project buildActiveProject() {
        return Project.create(
                "Website Redesign",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.ACTIVE,
                null
        );
    }

    private Project buildClosedProject() {
        return Project.create(
                "Website Redesign",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.CLOSED,
                null
        );
    }

    @Test
    void shouldCreateTaskSuccessfully() {

        Project project = buildActiveProject();

        when(projectOutPut.findById(project.getId()))
                .thenReturn(Optional.of(project));

        when(taskOutPut.existsByTitle("Design Homepage"))
                .thenReturn(false);

        when(taskOutPut.save(any(Task.class)))
                .thenReturn(true);

        CreateTaskUseCase useCase =
                new CreateTaskUseCase(taskOutPut, projectOutPut, fixedClock);

        Task result = useCase.createTask(
                project.getId(),
                "Design Homepage",
                5,
                "John Doe",
                TaskStatus.TODO,
                null
        );

        Assertions.assertNotNull(result);
        Assertions.assertEquals("Design Homepage", result.getTitle());
        Assertions.assertEquals(TaskStatus.TODO, result.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenProjectDoesNotExist() {

        when(projectOutPut.findById(1L))
                .thenReturn(Optional.empty());

        CreateTaskUseCase useCase =
                new CreateTaskUseCase(taskOutPut, projectOutPut, fixedClock);

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> useCase.createTask(
                        1L, "Task", 5, "John", TaskStatus.TODO, null)
        );
    }

    @Test
    void shouldThrowExceptionWhenProjectIsClosed() {

        Project project = buildClosedProject();

        when(projectOutPut.findById(project.getId()))
                .thenReturn(Optional.of(project));

        CreateTaskUseCase useCase =
                new CreateTaskUseCase(taskOutPut, projectOutPut, fixedClock);

        Assertions.assertThrows(
                BusinessRuleViolationException.class,
                () -> useCase.createTask(
                        project.getId(), "Task", 5, "John", TaskStatus.TODO, null)
        );
    }

    @Test
    void shouldThrowExceptionWhenTaskTitleAlreadyExists() {

        Project project = buildActiveProject();

        when(projectOutPut.findById(project.getId()))
                .thenReturn(Optional.of(project));

        when(taskOutPut.existsByTitle("Task"))
                .thenReturn(true);

        CreateTaskUseCase useCase =
                new CreateTaskUseCase(taskOutPut, projectOutPut, fixedClock);

        Assertions.assertThrows(
                DuplicateResourceException.class,
                () -> useCase.createTask(
                        project.getId(), "Task", 5, "John", TaskStatus.TODO, null)
        );
    }

    @Test
    void shouldThrowExceptionWhenSaveFails() {

        Project project = buildActiveProject();

        when(projectOutPut.findById(project.getId()))
                .thenReturn(Optional.of(project));

        when(taskOutPut.existsByTitle("Task"))
                .thenReturn(false);

        when(taskOutPut.save(any(Task.class)))
                .thenReturn(false);

        CreateTaskUseCase useCase =
                new CreateTaskUseCase(taskOutPut, projectOutPut, fixedClock);

        Assertions.assertThrows(
                BusinessRuleViolationException.class,
                () -> useCase.createTask(
                        project.getId(), "Task", 5, "John", TaskStatus.TODO, null)
        );
    }
}