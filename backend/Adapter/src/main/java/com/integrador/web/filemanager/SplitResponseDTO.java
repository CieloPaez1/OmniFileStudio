package com.integrador.web.filemanager;

import filemanager.input.SplitPdfInput;

import java.util.List;

public class SplitResponseDTO {

    private List<FileResponseDTO> files;
    private FileResponseDTO zipFile;

    public static SplitResponseDTO from(SplitPdfInput.SplitResult result) {
        SplitResponseDTO dto = new SplitResponseDTO();
        dto.files = result.generatedPdfs().stream().map(FileResponseDTO::from).toList();
        dto.zipFile = result.zipArchive() != null ? FileResponseDTO.from(result.zipArchive()) : null;
        return dto;
    }

    public List<FileResponseDTO> getFiles() { return files; }
    public FileResponseDTO getZipFile() { return zipFile; }
}
