package model;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import project.model.Project;
import project.enums.ProjectStatus;
import exception.ValidationException;
import task.enums.TaskStatus;
import task.model.Task;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class TaskTest {

    private final Clock fixedClock = Clock.fixed(
            LocalDateTime.now().plusMonths(1)
                    .toInstant(ZoneOffset.UTC),
            ZoneOffset.UTC
    );

    private Project buildProject() {
        return Project.create(
                "Website Redesign",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.ACTIVE,
                null
        );
    }

    @Test
    void shouldCreateTaskSuccessfully() {

        Project project = buildProject();

        Task task = Task.create(
                project,
                "Design landing page",
                5,
                "John Doe",
                TaskStatus.TODO,
                null,
                fixedClock
        );

        Assertions.assertNotNull(task);
        Assertions.assertEquals(project, task.getProject());
        Assertions.assertEquals("Design landing page", task.getTitle());
        Assertions.assertEquals(5, task.getEstimateHours());
        Assertions.assertEquals("John Doe", task.getAssignee());
        Assertions.assertEquals(TaskStatus.TODO, task.getStatus());
        Assertions.assertNotNull(task.getCreatedAt());
        Assertions.assertNull(task.getFinishedAt());
    }

    @Test
    void shouldThrowExceptionWhenProjectIsNull() {

        Assertions.assertThrows(
                ValidationException.class,
                () -> Task.create(
                        null,
                        "Task Title",
                        5,
                        "John Doe",
                        TaskStatus.TODO,
                        null,
                        fixedClock
                )
        );
    }

    @Test
    void shouldThrowExceptionWhenTitleIsBlank() {

        Project project = buildProject();

        Assertions.assertThrows(
                ValidationException.class,
                () -> Task.create(
                        project,
                        "",
                        5,
                        "John Doe",
                        TaskStatus.TODO,
                        null,
                        fixedClock
                )
        );
    }

    @Test
    void shouldThrowExceptionWhenEstimateHoursIsZero() {

        Project project = buildProject();

        Assertions.assertThrows(
                ValidationException.class,
                () -> Task.create(
                        project,
                        "Task Title",
                        0,
                        "John Doe",
                        TaskStatus.TODO,
                        null,
                        fixedClock
                )
        );
    }

    @Test
    void shouldSetFinishedAtWhenStatusIsDone() {

        Project project = buildProject();

        LocalDateTime expectedFinishedAt = LocalDateTime.now(fixedClock);

        Task task = Task.create(
                project,
                "Deploy app",
                4,
                "alice",
                TaskStatus.DONE,
                null,
                fixedClock
        );

        Assertions.assertNotNull(task.getFinishedAt());
        Assertions.assertEquals(expectedFinishedAt, task.getFinishedAt());
    }

    @Test
    void shouldNotSetFinishedAtWhenStatusIsNotDone() {

        Project project = buildProject();

        Task task = Task.create(
                project,
                "Deploy app",
                4,
                "alice",
                TaskStatus.IN_PROGRESS,
                null,
                fixedClock
        );

        Assertions.assertNull(task.getFinishedAt());
    }
}