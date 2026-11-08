package project.output;

import project.model.Project;

import java.util.List;
import java.util.Optional;

public interface ProjectOutPut {
    boolean save(Project project);
    Optional<Project> findById(Long id);
    boolean existsByName(String name);
    void deleteById(Long id);
    List<Project> findAll();
}