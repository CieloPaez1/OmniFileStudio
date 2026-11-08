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
    private long size;
    private Integer pageCount;
    private Integer width;
    private Integer height;
    private Long parentId;
    private List<String> availableTargets;
    private String viewUrl;
    private String downloadUrl;
    private LocalDateTime createdAt;

    public static FileResponseDTO from(ManagedFile file) {
        FileResponseDTO dto = new FileResponseDTO();
        dto.id = file.getId();
        dto.name = file.getOriginalName();
        dto.ext = file.getExtension();
        dto.mimeType = file.getMimeType();
        dto.category = file.getCategory().name();
        dto.origin = file.getOrigin().name();
        dto.size = file.getSizeBytes();
        dto.pageCount = file.getPageCount();
        dto.width = file.getWidth();
        dto.height = file.getHeight();
        dto.parentId = file.getParentId();
        dto.availableTargets = file.getAvailableTargets();
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
    public long getSize() { return size; }
    public Integer getPageCount() { return pageCount; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public Long getParentId() { return parentId; }
    public List<String> getAvailableTargets() { return availableTargets; }
    public String getViewUrl() { return viewUrl; }
    public String getDownloadUrl() { return downloadUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
