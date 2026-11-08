package com.integrador.web.task;


import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import task.input.CreateTaskInput;
import task.input.DeleteTaskInput;
import task.input.FindTaskInput;
import task.input.UpdateTaskInput;
import task.model.Task;

import java.util.List;

@RestController
public class TaskController {

    private final CreateTaskInput createTask;
    private final DeleteTaskInput deleteTask;
    private final FindTaskInput findTask;
    private final UpdateTaskInput updateTask;

    public TaskController(
            CreateTaskInput createTask,
            DeleteTaskInput deleteTask,
            FindTaskInput findTask,
            UpdateTaskInput updateTask
    ) {
        this.createTask = createTask;
        this.deleteTask = deleteTask;
        this.findTask = findTask;
        this.updateTask = updateTask;
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponseDTO> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskDTO request
    ) {
        Task result = createTask.createTask(
                projectId,
                request.getTitle(),
                request.getEstimateHours(),
                request.getAssignee(),
                request.getStatus(),
                request.getDueDate()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(TaskResponseDTO.from(result));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByProject(
            @PathVariable Long projectId
    ) {
        List<TaskResponseDTO> result = findTask.findTasksByProjectId(projectId)
                .stream()
                .map(TaskResponseDTO::from)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskResponseDTO> getTaskById(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        Task task = findTask.findById(projectId, taskId);
        return ResponseEntity.ok(TaskResponseDTO.from(task));
    }

    @PutMapping("/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDTO request
    ) {
        Task result = updateTask.updateTask(
                projectId,
                taskId,
                request.getTitle(),
                request.getEstimateHours(),
                request.getAssignee(),
                request.getStatus(),
                request.getDueDate()
        );

        return ResponseEntity.ok(TaskResponseDTO.from(result));
    }

    @DeleteMapping("/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        deleteTask.deleteTask(projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskResponseDTO>> findTasks(
            @RequestParam(required = false) Integer minEstimate,
            @RequestParam(required = false) String assignee
    ) {
        List<TaskResponseDTO> result = findTask.findTasks(minEstimate, assignee)
                .stream()
                .map(TaskResponseDTO::from)
                .toList();

        return ResponseEntity.ok(result);
    }
}
