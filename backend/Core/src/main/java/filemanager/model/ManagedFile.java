package filemanager.model;

import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;

import java.time.LocalDateTime;
import java.util.List;

public class ManagedFile {

    private Long id;
    private String originalName;
    private final String storedFilename;
    private final String extension;
    private final String mimeType;
    private final FileCategory category;
    private final FileOrigin origin;
    private final long sizeBytes;
    private final Integer pageCount;
    private final Integer width;
    private final Integer height;
    private final Long parentId;
    private final LocalDateTime createdAt;

    private ManagedFile(
            Long id,
            String originalName,
            String storedFilename,
            String extension,
            String mimeType,
            FileCategory category,
            FileOrigin origin,
            long sizeBytes,
            Integer pageCount,
            Integer width,
            Integer height,
            Long parentId,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.originalName = originalName;
        this.storedFilename = storedFilename;
        this.extension = extension;
        this.mimeType = mimeType;
        this.category = category;
        this.origin = origin;
        this.sizeBytes = sizeBytes;
        this.pageCount = pageCount;
        this.width = width;
        this.height = height;
        this.parentId = parentId;
        this.createdAt = createdAt;
    }

    public static ManagedFile create(
            String originalName,
            String storedFilename,
            String extension,
            String mimeType,
            FileOrigin origin,
            long sizeBytes,
            Integer pageCount,
            Integer width,
            Integer height,
            Long parentId
    ) {
        if (originalName == null || originalName.isBlank()) {
            throw new ValidationException("El nombre del archivo no puede ser nulo ni estar en blanco.");
        }
        if (storedFilename == null || storedFilename.isBlank()) {
            throw new ValidationException("El identificador de almacenamiento del archivo es obligatorio.");
        }
        if (extension == null || extension.isBlank()) {
            throw new ValidationException("La extensión del archivo no puede estar vacía.");
        }
        if (sizeBytes < 0) {
            throw new ValidationException("El tamaño del archivo no puede ser negativo.");
        }
        if (origin == null) {
            throw new ValidationException("El origen del archivo es obligatorio.");
        }

        String cleanExt = extension.toLowerCase().replace(".", "").trim();
        FileCategory cat = FileCategory.fromExtension(cleanExt);

        return new ManagedFile(
                null,
                originalName.trim(),
                storedFilename.trim(),
                cleanExt,
                mimeType != null ? mimeType : "application/octet-stream",
                cat,
                origin,
                sizeBytes,
                pageCount,
                width,
                height,
                parentId,
                LocalDateTime.now()
        );
    }

    public static ManagedFile restore(
            Long id,
            String originalName,
            String storedFilename,
            String extension,
            String mimeType,
            FileCategory category,
            FileOrigin origin,
            long sizeBytes,
            Integer pageCount,
            Integer width,
            Integer height,
            Long parentId,
            LocalDateTime createdAt
    ) {
        return new ManagedFile(
                id,
                originalName,
                storedFilename,
                extension,
                mimeType,
                category != null ? category : FileCategory.fromExtension(extension),
                origin != null ? origin : FileOrigin.UPLOADED,
                sizeBytes,
                pageCount,
                width,
                height,
                parentId,
                createdAt != null ? createdAt : LocalDateTime.now()
        );
    }

    public void rename(String newName) {
        if (newName == null || newName.isBlank()) {
            throw new ValidationException("El nuevo nombre del archivo no puede estar vacío.");
        }
        String trimmed = newName.trim();
        if (!trimmed.toLowerCase().endsWith("." + this.extension)) {
            trimmed = trimmed + "." + this.extension;
        }
        this.originalName = trimmed;
    }

    public List<String> getAvailableTargets() {
        return FileCategory.getAvailableTargets(this.extension);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOriginalName() { return originalName; }
    public String getStoredFilename() { return storedFilename; }
    public String getExtension() { return extension; }
    public String getMimeType() { return mimeType; }
    public FileCategory getCategory() { return category; }
    public FileOrigin getOrigin() { return origin; }
    public long getSizeBytes() { return sizeBytes; }
    public Integer getPageCount() { return pageCount; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public Long getParentId() { return parentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
