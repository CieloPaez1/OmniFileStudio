package usecase;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;
import task.enums.TaskStatus;
import task.model.Task;
import task.output.TaskOutPut;
import task.usecase.FindTaskUseCase;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class FindTaskUseCaseTest {

    @Mock
    private TaskOutPut taskOutPut;

    private final Clock fixedClock = Clock.fixed(
            LocalDateTime.now().plusMonths(1)
                    .toInstant(ZoneOffset.UTC),
            ZoneOffset.UTC
    );

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
    void shouldFindTasksSuccessfully() {

        Project project = buildProject();

        Task task1 = Task.create(
                project, "Task 1", 5, "Alice", TaskStatus.TODO, null, fixedClock);

        Task task2 = Task.create(
                project, "Task 2", 8, "Bob", TaskStatus.IN_PROGRESS, null, fixedClock);

        when(taskOutPut.findTasks(5, null))
                .thenReturn(List.of(task1, task2));

        FindTaskUseCase useCase = new FindTaskUseCase(taskOutPut);

        List<Task> result = useCase.findTasks(5, null);

        Assertions.assertEquals(2, result.size());
        Assertions.assertTrue(result.contains(task1));
        Assertions.assertTrue(result.contains(task2));
    }

    @Test
    void shouldReturnEmptyListWhenNoTasksFound() {

        when(taskOutPut.findTasks(10, "Alice"))
                .thenReturn(List.of());

        FindTaskUseCase useCase = new FindTaskUseCase(taskOutPut);

        List<Task> result = useCase.findTasks(10, "Alice");

        Assertions.assertTrue(result.isEmpty());
    }

    @Test
    void shouldFindTasksByAssignee() {

        Project project = buildProject();

        Task task = Task.create(
                project, "Task 1", 5, "Alice", TaskStatus.TODO, null, fixedClock);

        when(taskOutPut.findTasks(null, "Alice"))
                .thenReturn(List.of(task));

        FindTaskUseCase useCase = new FindTaskUseCase(taskOutPut);

        List<Task> result = useCase.findTasks(null, "Alice");

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals("Alice", result.getFirst().getAssignee());
    }

    @Test
    void shouldFindTasksByMinEstimate() {

        Project project = buildProject();

        Task task = Task.create(
                project, "Task 1", 10, "Bob", TaskStatus.IN_PROGRESS, null, fixedClock);

        when(taskOutPut.findTasks(8, null))
                .thenReturn(List.of(task));

        FindTaskUseCase useCase = new FindTaskUseCase(taskOutPut);

        List<Task> result = useCase.findTasks(8, null);

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(10, result.getFirst().getEstimateHours());
    }
}