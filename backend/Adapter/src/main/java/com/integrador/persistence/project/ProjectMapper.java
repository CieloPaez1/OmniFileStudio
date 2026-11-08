package com.integrador.persistence.project;


import project.model.Project;

public class ProjectMapper {

    public static ProjectEntity coreToEntity(Project project) {
        if (project == null) return null;

        return new ProjectEntity(
                project.getId(),
                project.getName(),
                project.getStartDate(),
                project.getEndDate(),
                project.getStatus(),
                project.getDescription()
        );
    }

    public static Project entityToCore(ProjectEntity entity) {
        if (entity == null) return null;

        return Project.restore(
                entity.getId(),
                entity.getName(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                entity.getDescription()
        );
    }
}