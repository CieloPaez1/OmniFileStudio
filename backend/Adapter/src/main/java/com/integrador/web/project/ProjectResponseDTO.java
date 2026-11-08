package com.integrador.web.project;


import project.enums.ProjectStatus;
import project.model.Project;

import java.time.LocalDate;

public class ProjectResponseDTO {

    private Long id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
    private String description;

    public ProjectResponseDTO() {}

    public static ProjectResponseDTO from(Project project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.id = project.getId();
        dto.name = project.getName();
        dto.startDate = project.getStartDate();
        dto.endDate = project.getEndDate();
        dto.status = project.getStatus();
        dto.description = project.getDescription();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public ProjectStatus getStatus() { return status; }
    public String getDescription() { return description; }
}