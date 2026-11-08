package com.integrador.task;

import com.integrador.persistence.project.ProjectEntity;
import com.integrador.persistence.project.ProjectJPARepository;
import com.integrador.persistence.task.TaskEntity;
import com.integrador.persistence.task.TaskJPARepository;
import com.integrador.persistence.task.TaskRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.enums.ProjectStatus;
import project.model.Project;
import task.enums.TaskStatus;
import task.model.Task;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TaskRepositoryTest {

    @Mock
    private TaskJPARepository taskJpa;

    @Mock
    private ProjectJPARepository projectJpa;

    @InjectMocks
    private TaskRepository taskRepository;

    private Task createTask() {

        Project project = Project.create(
                "Sistema",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                ProjectStatus.ACTIVE,
                "Proyecto test"
        );

        project.setId(1L);

        return Task.create(
                project,
                "Login",
                5,
                "Carlos",
                TaskStatus.TODO,
                null,
                Clock.systemDefaultZone()
        );
    }

    @Test
    public void saveTaskFailsWhenIdNullTest() {

        Task task = createTask();

        ProjectEntity projectEntity = new ProjectEntity();
        projectEntity.setId(1L);

        TaskEntity savedEntity = new TaskEntity();

        when(projectJpa.findById(1L))
                .thenReturn(Optional.of(projectEntity));

        when(taskJpa.save(any(TaskEntity.class)))
                .thenReturn(savedEntity);

        boolean result = taskRepository.save(task);

        Assertions.assertFalse(result);
    }

    @Test
    public void findByIdReturnsTaskTest() {

        TaskEntity entity = new TaskEntity();
        entity.setId(1L);

        when(taskJpa.findById(1L))
                .thenReturn(Optional.of(entity));

        Task result = taskRepository.findById(1L);

        Assertions.assertNotNull(result);
    }

    @Test
    public void findByIdReturnsNullTest() {

        when(taskJpa.findById(1L))
                .thenReturn(Optional.empty());

        Task result = taskRepository.findById(1L);

        Assertions.assertNull(result);
    }

    @Test
    public void findTasksReturnsListTest() {

        TaskEntity entity = new TaskEntity();
        entity.setId(1L);

        when(taskJpa.findByFilters(5, "Carlos"))
                .thenReturn(List.of(entity));

        List<Task> result = taskRepository.findTasks(5, "Carlos");

        Assertions.assertEquals(1, result.size());
    }

    @Test
    public void existsByTitleReturnsTrueTest() {

        when(taskJpa.existsByTitle("Login"))
                .thenReturn(true);

        boolean result = taskRepository.existsByTitle("Login");

        Assertions.assertTrue(result);
    }

    @Test
    public void existsByTitleReturnsFalseTest() {

        when(taskJpa.existsByTitle("Login"))
                .thenReturn(false);

        boolean result = taskRepository.existsByTitle("Login");

        Assertions.assertFalse(result);
    }

    @Test
    public void countTasksByProjectIdReturnsCountTest() {

        when(taskJpa.countByProjectId(1L))
                .thenReturn(3);

        int result = taskRepository.countTasksByProjectId(1L);

        Assertions.assertEquals(3, result);
    }
}