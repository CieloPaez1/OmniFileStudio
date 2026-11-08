package project.model;

import exception.ValidationException;
import project.enums.ProjectStatus;

import java.time.LocalDate;

public class Project {

    private Long id;
    private final String name;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final ProjectStatus status;
    private final String description;

    private Project(
            Long id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    ) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.description = description;
    }

    public static Project create(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    ) {
        validate(name, startDate, endDate, status);

        if (endDate.isBefore(LocalDate.now())) {
            throw new ValidationException("La fecha de finalización no puede ser anterior a hoy.");
        }

        return new Project(null, name, startDate, endDate, status, description);
    }

    private static void validate(
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status
    ) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("El nombre del proyecto no puede ser nulo ni estar en blanco.");
        }

        if (startDate == null) {
            throw new ValidationException("La fecha de inicio no puede ser nula.");
        }

        if (endDate == null) {
            throw new ValidationException("La fecha de finalización no puede ser nula.");
        }

        if (endDate.isBefore(startDate)) {
            throw new ValidationException("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }

        if (status == null) {
            throw new ValidationException("El estado del proyecto no puede ser nulo.");
        }
    }

    public boolean isClosed() {
        return ProjectStatus.CLOSED.equals(this.status);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public ProjectStatus getStatus() { return status; }
    public String getDescription() { return description; }

    public static Project restore(
            Long id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    ) {
        return new Project(id, name, startDate, endDate, status, description);
    }

    public static Project update(
            Long id,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            ProjectStatus status,
            String description
    ) {
        validate(name, startDate, endDate, status);

        return new Project(id, name, startDate, endDate, status, description);
    }

    public void setId(Long id) {
        this.id = id;
    }
}
