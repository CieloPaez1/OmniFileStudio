package com.integrador.persistence.task;


import com.integrador.persistence.project.ProjectJPARepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import task.model.Task;
import task.output.TaskOutPut;

import java.util.List;

@Repository
public class TaskRepository implements TaskOutPut {

    private final TaskJPARepository taskJpa;
    private final ProjectJPARepository projectJpa;

    @Autowired
    public TaskRepository(
            TaskJPARepository taskJpa,
            ProjectJPARepository projectJpa
    ) {
        this.taskJpa = taskJpa;
        this.projectJpa = projectJpa;
    }

    @Override
    public boolean save(Task task) {
        if (task == null) return false;

        TaskEntity entity = TaskMapper.coreToEntity(task);

        projectJpa.findById(task.getProject().getId())
                .ifPresent(entity::setProject);

        TaskEntity saved = taskJpa.save(entity);

        if (saved.getId() != null) {
            task.setId(saved.getId());
            return true;
        }

        return false;
    }

    @Override
    public List<Task> findTasks(Integer minEstimate, String assignee) {
        return taskJpa.findByFilters(minEstimate, assignee)
                .stream()
                .map(TaskMapper::entityToCore)
                .toList();
    }

    @Override
    public List<Task> findByProjectId(Long projectId) {
        if (projectId == null) return List.of();

        return taskJpa.findByProjectId(projectId)
                .stream()
                .map(TaskMapper::entityToCore)
                .toList();
    }

    @Override
    public Task findById(Long taskId) {
        if (taskId == null) return null;

        return taskJpa.findById(taskId)
                .map(TaskMapper::entityToCore)
                .orElse(null);
    }

    @Override
    public boolean deleteById(Long taskId) {
        if (taskId == null || !taskJpa.existsById(taskId)) return false;
        taskJpa.deleteById(taskId);
        return true;
    }

    @Override
    public boolean existsByTitle(String title) {
        if (title == null) return false;
        return taskJpa.existsByTitle(title);
    }

    @Override
    public int countTasksByProjectId(Long projectId) {
        if (projectId == null) return 0;
        return taskJpa.countByProjectId(projectId);
    }
}
