package com.integrador.web.filemanager;

import java.util.List;

public class MergePdfRequestDTO {

    private List<Long> fileIds;
    private String title;

    public List<Long> getFileIds() { return fileIds; }
    public void setFileIds(List<Long> fileIds) { this.fileIds = fileIds; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
