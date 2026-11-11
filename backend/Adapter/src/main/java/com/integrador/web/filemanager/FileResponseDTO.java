package com.integrador.web.filemanager;

import filemanager.model.ManagedFile;

import java.time.LocalDateTime;
import java.util.List;

public class FileResponseDTO {

    private Long id;
    private String name;
    private String ext;
    private String mimeType;
    private String category;
    private String origin;
    private String tag;
    private String description;
    private long size;
    private Integer pageCount;
    private Integer width;
    private Integer height;
    private Long parentId;
    private Boolean archived;
    private Boolean signed;
    private Boolean compressed;
    private List<String> availableTargets;
    private String dataUrl;
    private String viewUrl;
    private String downloadUrl;
    private LocalDateTime createdAt;

    public static FileResponseDTO from(ManagedFile file) {
        FileResponseDTO dto = new FileResponseDTO();
        dto.id = file.getId();
        dto.name = file.getOriginalName();
        dto.ext = file.getExtension();
        dto.mimeType = file.getMimeType();
        dto.category = file.getCategory() != null ? file.getCategory().name() : "OTHER";
        dto.origin = file.getOrigin() != null ? file.getOrigin().name() : "UPLOADED";
        dto.tag = file.getTag();
        dto.description = file.getDescription();
        dto.size = file.getSizeBytes();
        dto.pageCount = file.getPageCount();
        dto.width = file.getWidth();
        dto.height = file.getHeight();
        dto.parentId = file.getParentId();
        dto.archived = file.isArchived();
        dto.signed = file.isSigned();
        dto.compressed = file.isCompressed();
        dto.availableTargets = file.getAvailableTargets();
        dto.dataUrl = file.getDataUrl();
        dto.viewUrl = "http://localhost:8080/api/files/" + file.getId() + "/view";
        dto.downloadUrl = "http://localhost:8080/api/files/" + file.getId() + "/download";
        dto.createdAt = file.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getExt() { return ext; }
    public String getMimeType() { return mimeType; }
    public String getCategory() { return category; }
    public String getOrigin() { return origin; }
    public String getTag() { return tag != null ? tag : "Trabajo"; }
    public String getDescription() { return description != null ? description : ""; }
    public long getSize() { return size; }
    public Integer getPageCount() { return pageCount; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public Long getParentId() { return parentId; }
    public Boolean getArchived() { return archived != null && archived; }
    public Boolean getSigned() { return signed != null && signed; }
    public Boolean getCompressed() { return compressed != null && compressed; }
    public List<String> getAvailableTargets() { return availableTargets; }
    public String getDataUrl() { return dataUrl; }
    public String getViewUrl() { return viewUrl; }
    public String getDownloadUrl() { return downloadUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
