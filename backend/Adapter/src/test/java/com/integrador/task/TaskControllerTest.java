package com.integrador.task;

import com.integrador.web.task.TaskController;
import com.integrador.web.task.TaskDTO;
import com.integrador.web.task.TaskResponseDTO;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import project.enums.ProjectStatus;
import project.model.Project;

import task.enums.TaskStatus;
import task.input.CreateTaskInput;
import task.input.DeleteTaskInput;
import task.input.FindTaskInput;
import task.model.Task;


import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TaskControllerTest {

    @Mock
    private CreateTaskInput createTask;

    @Mock
    private DeleteTaskInput deleteTask;

    @Mock
    private FindTaskInput findTask;

    @InjectMocks
    private TaskController taskController;

    private Task createTaskEntity() {

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
    void shouldCreateTaskSuccessfully() {

        TaskDTO dto = new TaskDTO();
        dto.setTitle("Login");
        dto.setEstimateHours(5);
        dto.setAssignee("Carlos");
        dto.setStatus(TaskStatus.TODO);

        Task task = createTaskEntity();

        when(createTask.createTask(
                1L,
                "Login",
                5,
                "Carlos",
                TaskStatus.TODO,
                null
        )).thenReturn(task);

        ResponseEntity<TaskResponseDTO> response =
                taskController.createTask(1L, dto);

        Assertions.assertEquals(
                HttpStatus.CREATED,
                response.getStatusCode()
        );
    }

    @Test
    void shouldDeleteTaskSuccessfully() {

        ResponseEntity<Void> response =
                taskController.deleteTask(1L, 1L);

        Assertions.assertEquals(
                HttpStatus.NO_CONTENT,
                response.getStatusCode()
        );

        verify(deleteTask).deleteTask(1L, 1L);
    }

    @Test
    void shouldFindTasksSuccessfully() {

        Task task = createTaskEntity();

        when(findTask.findTasks(5, "Carlos"))
                .thenReturn(List.of(task));

        ResponseEntity<List<TaskResponseDTO>> response =
                taskController.findTasks(5, "Carlos");

        Assertions.assertEquals(
                HttpStatus.OK,
                response.getStatusCode()
        );

        Assertions.assertEquals(
                1,
                response.getBody().size()
        );
    }
}