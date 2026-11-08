package usecase;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;
import project.output.ProjectOutPut;
import exception.DuplicateResourceException;
import exception.ValidationException;
import project.usecase.CreateProjectUseCase;

import java.time.LocalDate;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CreateProjectUseCaseTest {

    @Mock
    private ProjectOutPut projectOutput;

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
    void shouldCreateProjectSuccessfully() {

        Project project = buildProject();

        when(projectOutput.existsByName(project.getName()))
                .thenReturn(false);

        when(projectOutput.save(project))
                .thenReturn(true);

        CreateProjectUseCase useCase =
                new CreateProjectUseCase(projectOutput);

        Project result = useCase.createProject(project);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(project.getName(), result.getName());
    }

    @Test
    void shouldThrowExceptionWhenProjectNameAlreadyExists() {

        Project project = buildProject();

        when(projectOutput.existsByName(project.getName()))
                .thenReturn(true);

        CreateProjectUseCase useCase =
                new CreateProjectUseCase(projectOutput);

        Assertions.assertThrows(
                DuplicateResourceException.class,
                () -> useCase.createProject(project)
        );
    }

    @Test
    void shouldThrowExceptionWhenProjectCannotBeSaved() {

        Project project = buildProject();

        when(projectOutput.existsByName(project.getName()))
                .thenReturn(false);

        when(projectOutput.save(project))
                .thenReturn(false);

        CreateProjectUseCase useCase =
                new CreateProjectUseCase(projectOutput);

        Assertions.assertThrows(
                ValidationException.class,
                () -> useCase.createProject(project)
        );
    }
}