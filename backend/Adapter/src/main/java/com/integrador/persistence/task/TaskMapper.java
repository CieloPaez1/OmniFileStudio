package com.integrador.persistence.task;


import com.integrador.persistence.project.ProjectMapper;
import task.model.Task;

public class TaskMapper {

    public static TaskEntity coreToEntity(Task task) {
        if (task == null) return null;

        return new TaskEntity(
                task.getId(),
                ProjectMapper.coreToEntity(task.getProject()),
                task.getTitle(),
                task.getEstimateHours(),
                task.getAssignee(),
                task.getStatus(),
                task.getCreatedAt(),
                task.getFinishedAt(),
                task.getDueDate()
        );
    }

    public static Task entityToCore(TaskEntity entity) {
        if (entity == null) return null;

        return Task.restore(
                entity.getId(),
                ProjectMapper.entityToCore(entity.getProject()),
                entity.getTitle(),
                entity.getEstimateHours(),
                entity.getAssignee(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getFinishedAt(),
                entity.getDueDate()
        );
    }
}