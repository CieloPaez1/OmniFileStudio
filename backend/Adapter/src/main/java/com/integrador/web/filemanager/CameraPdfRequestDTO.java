package com.integrador.web.filemanager;

import java.util.List;

public class CameraPdfRequestDTO {

    private String title;
    private String pageSize;
    private String orientation;
    private int margin = 24;
    private List<PhotoItemDTO> photos;
    private List<Long> fileIds;

    public static class PhotoItemDTO {
        private String dataUrl;
        private int rotation;

        public String getDataUrl() { return dataUrl; }
        public void setDataUrl(String dataUrl) { this.dataUrl = dataUrl; }
        public int getRotation() { return rotation; }
        public void setRotation(int rotation) { this.rotation = rotation; }
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPageSize() { return pageSize; }
    public void setPageSize(String pageSize) { this.pageSize = pageSize; }
    public String getOrientation() { return orientation; }
    public void setOrientation(String orientation) { this.orientation = orientation; }
    public int getMargin() { return margin; }
    public void setMargin(int margin) { this.margin = margin; }
    public List<PhotoItemDTO> getPhotos() { return photos; }
    public void setPhotos(List<PhotoItemDTO> photos) { this.photos = photos; }
    public List<Long> getFileIds() { return fileIds; }
    public void setFileIds(List<Long> fileIds) { this.fileIds = fileIds; }
}
