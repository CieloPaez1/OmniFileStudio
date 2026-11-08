package com.integrador.web.filemanager;

import java.util.Map;

public class SplitPdfRequestDTO {

    private Long fileId;
    private String ranges;
    private String mode;
    private String title;
    private Map<Integer, Integer> rotations;

    public Long getFileId() { return fileId; }
    public void setFileId(Long fileId) { this.fileId = fileId; }
    public String getRanges() { return ranges; }
    public void setRanges(String ranges) { this.ranges = ranges; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Map<Integer, Integer> getRotations() { return rotations; }
    public void setRotations(Map<Integer, Integer> rotations) { this.rotations = rotations; }
}
