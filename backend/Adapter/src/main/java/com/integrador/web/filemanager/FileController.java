package com.integrador.web.filemanager;

import filemanager.input.*;
import filemanager.model.ManagedFile;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final UploadFileInput uploadFileInput;
    private final FindFilesInput findFilesInput;
    private final DeleteFileInput deleteFileInput;
    private final ConvertFileInput convertFileInput;
    private final CreatePdfFromPhotosInput createPdfFromPhotosInput;
    private final MergePdfsInput mergePdfsInput;
    private final SplitPdfInput splitPdfInput;

    public FileController(
            UploadFileInput uploadFileInput,
            FindFilesInput findFilesInput,
            DeleteFileInput deleteFileInput,
            ConvertFileInput convertFileInput,
            CreatePdfFromPhotosInput createPdfFromPhotosInput,
            MergePdfsInput mergePdfsInput,
            SplitPdfInput splitPdfInput
    ) {
        this.uploadFileInput = uploadFileInput;
        this.findFilesInput = findFilesInput;
        this.deleteFileInput = deleteFileInput;
        this.convertFileInput = convertFileInput;
        this.createPdfFromPhotosInput = createPdfFromPhotosInput;
        this.mergePdfsInput = mergePdfsInput;
        this.splitPdfInput = splitPdfInput;
    }

    @GetMapping
    public ResponseEntity<List<FileResponseDTO>> getAllFiles() {
        List<FileResponseDTO> list = findFilesInput.findAll()
                .stream()
                .map(FileResponseDTO::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/upload")
    public ResponseEntity<List<FileResponseDTO>> uploadFiles(
            @RequestParam("files") MultipartFile[] files
    ) throws IOException {
        List<FileResponseDTO> created = new ArrayList<>();
        for (MultipartFile mf : files) {
            if (mf.isEmpty()) continue;
            ManagedFile saved = uploadFileInput.upload(
                    mf.getOriginalFilename(),
                    mf.getContentType(),
                    mf.getBytes()
            );
            created.add(FileResponseDTO.from(saved));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewFile(@PathVariable Long id) {
        ManagedFile file = findFilesInput.findById(id);
        byte[] bytes = findFilesInput.downloadBytes(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.getMimeType()));
        headers.setContentDisposition(
                ContentDisposition.inline()
                        .filename(file.getOriginalName(), StandardCharsets.UTF_8)
                        .build()
        );
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        ManagedFile file = findFilesInput.findById(id);
        byte[] bytes = findFilesInput.downloadBytes(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.getMimeType()));
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(file.getOriginalName(), StandardCharsets.UTF_8)
                        .build()
        );
        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FileResponseDTO> renameFile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        ManagedFile updated = findFilesInput.rename(id, body.get("name"));
        return ResponseEntity.ok(FileResponseDTO.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        deleteFileInput.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/convert")
    public ResponseEntity<FileResponseDTO> convertFile(
            @RequestParam(value = "file", required = false) MultipartFile uploadedFile,
            @RequestParam(value = "fileId", required = false) Long fileId,
            @RequestParam("targetFormat") String targetFormat,
            @RequestParam(value = "quality", required = false) Integer quality,
            @RequestParam(value = "width", required = false) Integer width,
            @RequestParam(value = "height", required = false) Integer height
    ) throws IOException {
        Long sourceId = fileId;
        if (uploadedFile != null && !uploadedFile.isEmpty()) {
            ManagedFile saved = uploadFileInput.upload(
                    uploadedFile.getOriginalFilename(),
                    uploadedFile.getContentType(),
                    uploadedFile.getBytes()
            );
            sourceId = saved.getId();
        }
        ManagedFile converted = convertFileInput.convert(sourceId, targetFormat, quality, width, height);
        return ResponseEntity.status(HttpStatus.CREATED).body(FileResponseDTO.from(converted));
    }

    @PostMapping("/pdf/from-images")
    public ResponseEntity<FileResponseDTO> createPdfFromImages(
            @RequestBody CameraPdfRequestDTO request
    ) {
        List<byte[]> buffers = new ArrayList<>();
        List<Integer> rotations = new ArrayList<>();

        if (request.getPhotos() != null) {
            for (CameraPdfRequestDTO.PhotoItemDTO item : request.getPhotos()) {
                if (item.getDataUrl() == null || item.getDataUrl().isBlank()) continue;
                String base64 = item.getDataUrl().contains(",")
                        ? item.getDataUrl().substring(item.getDataUrl().indexOf(',') + 1)
                        : item.getDataUrl();
                buffers.add(Base64.getDecoder().decode(base64));
                rotations.add(item.getRotation());
            }
        }

        ManagedFile createdPdf = createPdfFromPhotosInput.createFromPhotos(
                buffers,
                request.getFileIds(),
                rotations,
                request.getTitle(),
                request.getPageSize(),
                request.getOrientation(),
                request.getMargin()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(FileResponseDTO.from(createdPdf));
    }

    @PostMapping("/pdf/merge")
    public ResponseEntity<FileResponseDTO> mergePdfs(
            @RequestBody MergePdfRequestDTO request
    ) {
        ManagedFile merged = mergePdfsInput.mergePdfs(request.getFileIds(), request.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED).body(FileResponseDTO.from(merged));
    }

    @PostMapping("/pdf/split")
    public ResponseEntity<SplitResponseDTO> splitPdf(
            @RequestBody SplitPdfRequestDTO request
    ) {
        SplitPdfInput.SplitResult result = splitPdfInput.splitPdf(
                request.getFileId(),
                request.getRanges(),
                request.getMode(),
                request.getTitle(),
                request.getRotations()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(SplitResponseDTO.from(result));
    }
}
