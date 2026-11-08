package model;


import exception.ValidationException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import project.enums.ProjectStatus;
import project.model.Project;

import java.time.LocalDate;

public class ProjectTest {

    @Test

    void shouldCreateProjectSuccessfully() {

        Project project = Project.create(
                "Website Redesign",
                LocalDate.now(),
                LocalDate.now().plusMonths(3),
                ProjectStatus.ACTIVE,
                null
        );

        Assertions.assertNotNull(project);
    }

    @Test
    void shouldThrowExceptionWhenNameIsNull() {

        Assertions.assertThrows(
                ValidationException.class,
                () -> Project.create(
                        null,
                        LocalDate.now(),
                        LocalDate.now().plusMonths(3),
                        ProjectStatus.ACTIVE,
                        null
                )
        );
    }

    @Test
    void shouldThrowExceptionWhenEndDateIsBeforeStartDate() {

        Assertions.assertThrows(
                ValidationException.class,
                () -> Project.create(
                        "Website Redesign",
                        LocalDate.now().plusMonths(3),
                        LocalDate.now().plusMonths(1),
                        ProjectStatus.ACTIVE,
                        null
                )
        );
    }

    @Test
    void shouldThrowExceptionWhenStatusIsNull() {

        Assertions.assertThrows(
                ValidationException.class,
                () -> Project.create(
                        "Website Redesign",
                        LocalDate.now(),
                        LocalDate.now().plusMonths(3),
                        null,
                        null
                )
        );
    }
}