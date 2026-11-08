package project.input;

import project.model.Project;
import java.util.List;

public interface FindProjectInput {
    List<Project> execute();
    Project findById(Long projectId);
}
