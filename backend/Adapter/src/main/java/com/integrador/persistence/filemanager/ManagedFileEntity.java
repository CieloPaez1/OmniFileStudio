package com.integrador.persistence.filemanager;

import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "managed_files")
public class ManagedFileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false, unique = true)
    private String storedFilename;

    @Column(nullable = false, length = 32)
    private String extension;

    @Column(nullable = false, length = 120)
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FileCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FileOrigin origin;

    @Column(nullable = false)
    private long sizeBytes;

    private Integer pageCount;
    private Integer width;
    private Integer height;
    private Long parentId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ManagedFileEntity() {
    }

    public ManagedFileEntity(
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getStoredFilename() { return storedFilename; }
    public void setStoredFilename(String storedFilename) { this.storedFilename = storedFilename; }
    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public FileCategory getCategory() { return category; }
    public void setCategory(FileCategory category) { this.category = category; }
    public FileOrigin getOrigin() { return origin; }
    public void setOrigin(FileOrigin origin) { this.origin = origin; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
    public Integer getPageCount() { return pageCount; }
    public void setPageCount(Integer pageCount) { this.pageCount = pageCount; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
