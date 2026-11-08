package project.input;

import project.enums.ProjectStatus;
import project.model.Project;

import java.time.LocalDate;

public interface UpdateProjectInput {

    Project updateProject(
            Long projectId,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    );
}
