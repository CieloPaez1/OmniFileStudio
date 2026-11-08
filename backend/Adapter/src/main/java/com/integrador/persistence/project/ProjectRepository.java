package com.integrador.persistence.project;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import project.model.Project;
import project.output.ProjectOutPut;
import java.util.List;

import java.util.Optional;

@Repository
public class ProjectRepository implements ProjectOutPut {

    private final ProjectJPARepository projectJpa;

    @Autowired
    public ProjectRepository(ProjectJPARepository projectJpa) {
        this.projectJpa = projectJpa;
    }

    @Override
    public boolean save(Project project) {
        if (project == null) return false;

        ProjectEntity entity = ProjectMapper.coreToEntity(project);
        ProjectEntity saved = projectJpa.save(entity);

        if (saved.getId() != null) {
            project.setId(saved.getId());
            return true;
        }

        return false;
    }

    @Override
    public Optional<Project> findById(Long id) {
        if (id == null) return Optional.empty();

        return projectJpa.findById(id)
                .map(ProjectMapper::entityToCore);
    }

    @Override
    public boolean existsByName(String name) {
        if (name == null) return false;
        return projectJpa.existsByName(name);
    }

    @Override
    public void deleteById(Long id) {
        if (id != null) {
            projectJpa.deleteById(id);
        }
    }
    @Override
    public List<Project> findAll() {
        return projectJpa.findAll()
                .stream()
                .map(ProjectMapper::entityToCore)
                .toList();
    }
}