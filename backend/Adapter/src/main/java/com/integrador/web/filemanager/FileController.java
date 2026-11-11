package com.integrador.web.filemanager;

import com.integrador.persistence.filemanager.ManagedFileEntity;
import com.integrador.persistence.filemanager.ManagedFileJPARepository;
import com.integrador.persistence.filemanager.ManagedFileMapper;
import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;
import filemanager.input.*;
import filemanager.model.ManagedFile;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping({"/api/files", "/files"})
public class FileController {

    private final UploadFileInput uploadFileInput;
    private final FindFilesInput findFilesInput;
    private final DeleteFileInput deleteFileInput;
    private final ConvertFileInput convertFileInput;
    private final CreatePdfFromPhotosInput createPdfFromPhotosInput;
    private final MergePdfsInput mergePdfsInput;
    private final SplitPdfInput splitPdfInput;
    private final ManagedFileJPARepository jpaRepository;
    private final Path storageDir;

    public FileController(
            UploadFileInput uploadFileInput,
            FindFilesInput findFilesInput,
            DeleteFileInput deleteFileInput,
            ConvertFileInput convertFileInput,
            CreatePdfFromPhotosInput createPdfFromPhotosInput,
            MergePdfsInput mergePdfsInput,
            SplitPdfInput splitPdfInput,
            ManagedFileJPARepository jpaRepository
    ) {
        this.uploadFileInput = uploadFileInput;
        this.findFilesInput = findFilesInput;
        this.deleteFileInput = deleteFileInput;
        this.convertFileInput = convertFileInput;
        this.createPdfFromPhotosInput = createPdfFromPhotosInput;
        this.mergePdfsInput = mergePdfsInput;
        this.splitPdfInput = splitPdfInput;
        this.jpaRepository = jpaRepository;
        this.storageDir = Paths.get("storage", "files").toAbsolutePath();
        try {
            Files.createDirectories(this.storageDir);
        } catch (IOException ignored) {
        }
    }

    @GetMapping
    public ResponseEntity<List<FileResponseDTO>> getAllFiles() {
        // Auto-seed initial samples in PostgreSQL if database is empty
        if (jpaRepository.count() == 0) {
            seedInitialDatabaseRecords();
        }

        List<FileResponseDTO> list = jpaRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ManagedFileMapper::toDomain)
                .map(FileResponseDTO::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileResponseDTO> getFileById(@PathVariable Long id) {
        return jpaRepository.findById(id)
                .map(ManagedFileMapper::toDomain)
                .map(FileResponseDTO::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FileResponseDTO> createFileRecord(@RequestBody Map<String, Object> body) {
        String name = body.get("name") != null ? body.get("name").toString().trim() : "Documento.pdf";
        String ext = body.get("ext") != null ? body.get("ext").toString().toLowerCase().trim() : extractExt(name);
        String mimeType = body.get("mimeType") != null ? body.get("mimeType").toString() : resolveMime(ext);
        String categoryStr = body.get("category") != null ? body.get("category").toString() : "OTHER";
        String originStr = body.get("origin") != null ? body.get("origin").toString() : "UPLOADED";
        String tag = body.get("tag") != null ? body.get("tag").toString() : "Trabajo";
        String description = body.get("description") != null ? body.get("description").toString() : "";
        String dataUrl = body.get("dataUrl") != null ? body.get("dataUrl").toString() : "";

        long size = 0L;
        if (body.get("size") != null) {
            try {
                size = Long.parseLong(body.get("size").toString());
            } catch (NumberFormatException ignored) {}
        }

        Integer pageCount = null;
        if (body.get("pageCount") != null) {
            try {
                pageCount = Integer.parseInt(body.get("pageCount").toString());
            } catch (NumberFormatException ignored) {}
        }

        Boolean archived = Boolean.parseBoolean(String.valueOf(body.getOrDefault("archived", false)));
        Boolean signed = Boolean.parseBoolean(String.valueOf(body.getOrDefault("signed", false)));
        Boolean compressed = Boolean.parseBoolean(String.valueOf(body.getOrDefault("compressed", false)));

        FileCategory category;
        try {
            category = FileCategory.valueOf(categoryStr);
        } catch (Exception e) {
            category = FileCategory.fromExtension(ext);
        }

        FileOrigin origin;
        try {
            origin = FileOrigin.valueOf(originStr);
        } catch (Exception e) {
            origin = FileOrigin.UPLOADED;
        }

        String storedFilename = UUID.randomUUID() + "." + ext;
        byte[] rawBytes = null;
        if (dataUrl != null && !dataUrl.isBlank() && dataUrl.contains(",")) {
            try {
                String b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
                rawBytes = Base64.getDecoder().decode(b64);
                if (size <= 0) size = rawBytes.length;
                Files.write(storageDir.resolve(storedFilename), rawBytes);
            } catch (Exception ignored) {}
        }

        ManagedFileEntity entity = new ManagedFileEntity(
                null,
                name,
                storedFilename,
                ext,
                mimeType,
                category,
                origin,
                size,
                pageCount,
                null,
                null,
                null,
                LocalDateTime.now()
        );
        entity.setTag(tag);
        entity.setDescription(description);
        entity.setArchived(archived);
        entity.setSigned(signed);
        entity.setCompressed(compressed);
        entity.setDataUrl(dataUrl);
        entity.setFileData(rawBytes);

        ManagedFileEntity saved = jpaRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(FileResponseDTO.from(ManagedFileMapper.toDomain(saved)));
    }

    @PostMapping("/upload")
    public ResponseEntity<List<FileResponseDTO>> uploadFiles(
            @RequestParam("files") MultipartFile[] files
    ) throws IOException {
        List<FileResponseDTO> created = new ArrayList<>();
        for (MultipartFile mf : files) {
            if (mf.isEmpty()) continue;
            byte[] bytes = mf.getBytes();
            String originalName = mf.getOriginalFilename() != null ? mf.getOriginalFilename() : "archivo.bin";
            String ext = extractExt(originalName);
            String mime = mf.getContentType() != null ? mf.getContentType() : resolveMime(ext);
            String storedFilename = UUID.randomUUID() + "." + ext;
            Files.write(storageDir.resolve(storedFilename), bytes);

            String dataUrl = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);

            ManagedFileEntity entity = new ManagedFileEntity(
                    null,
                    originalName,
                    storedFilename,
                    ext,
                    mime,
                    FileCategory.fromExtension(ext),
                    FileOrigin.UPLOADED,
                    bytes.length,
                    ext.equals("pdf") ? 1 : null,
                    null,
                    null,
                    null,
                    LocalDateTime.now()
            );
            entity.setTag("Trabajo");
            entity.setDescription("Archivo subido y almacenado en la base de datos.");
            entity.setArchived(false);
            entity.setSigned(false);
            entity.setCompressed(false);
            entity.setDataUrl(dataUrl);
            entity.setFileData(bytes);

            ManagedFileEntity saved = jpaRepository.save(entity);
            created.add(FileResponseDTO.from(ManagedFileMapper.toDomain(saved)));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FileResponseDTO> updateFile(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        return jpaRepository.findById(id).map(entity -> {
            if (body.containsKey("name") && body.get("name") != null) {
                String newName = body.get("name").toString().trim();
                if (!newName.toLowerCase().endsWith("." + entity.getExtension())) {
                    newName = newName + "." + entity.getExtension();
                }
                entity.setOriginalName(newName);
            }
            if (body.containsKey("tag") && body.get("tag") != null) {
                entity.setTag(body.get("tag").toString());
            }
            if (body.containsKey("description") && body.get("description") != null) {
                entity.setDescription(body.get("description").toString());
            }
            if (body.containsKey("archived") && body.get("archived") != null) {
                entity.setArchived(Boolean.parseBoolean(body.get("archived").toString()));
            }
            if (body.containsKey("signed") && body.get("signed") != null) {
                entity.setSigned(Boolean.parseBoolean(body.get("signed").toString()));
            }
            if (body.containsKey("compressed") && body.get("compressed") != null) {
                entity.setCompressed(Boolean.parseBoolean(body.get("compressed").toString()));
            }
            if (body.containsKey("dataUrl") && body.get("dataUrl") != null) {
                String dUrl = body.get("dataUrl").toString();
                entity.setDataUrl(dUrl);
                if (dUrl.contains(",")) {
                    try {
                        byte[] decoded = Base64.getDecoder().decode(dUrl.substring(dUrl.indexOf(',') + 1));
                        entity.setFileData(decoded);
                        Files.write(storageDir.resolve(entity.getStoredFilename()), decoded);
                    } catch (Exception ignored) {}
                }
            }

            ManagedFileEntity saved = jpaRepository.save(entity);
            return ResponseEntity.ok(FileResponseDTO.from(ManagedFileMapper.toDomain(saved)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FileResponseDTO> putFile(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        return updateFile(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        jpaRepository.findById(id).ifPresent(entity -> {
            try {
                Files.deleteIfExists(storageDir.resolve(entity.getStoredFilename()));
            } catch (IOException ignored) {}
            jpaRepository.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewFile(@PathVariable Long id) {
        return serveFileBytes(id, false);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        return serveFileBytes(id, true);
    }

    private ResponseEntity<byte[]> serveFileBytes(Long id, boolean attachment) {
        Optional<ManagedFileEntity> opt = jpaRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        ManagedFileEntity entity = opt.get();
        byte[] bytes = null;

        // Try reading from storage disk first
        try {
            Path p = storageDir.resolve(entity.getStoredFilename());
            if (Files.exists(p)) {
                bytes = Files.readAllBytes(p);
            }
        } catch (Exception ignored) {}

        // Fallback to database binary
        if (bytes == null && entity.getFileData() != null && entity.getFileData().length > 0) {
            bytes = entity.getFileData();
        }

        // Fallback to dataUrl base64 decoding
        if (bytes == null && entity.getDataUrl() != null && entity.getDataUrl().contains(",")) {
            try {
                bytes = Base64.getDecoder().decode(entity.getDataUrl().substring(entity.getDataUrl().indexOf(',') + 1));
            } catch (Exception ignored) {}
        }

        if (bytes == null) {
            // Generate synthetic fallback text bytes if binary is absent
            bytes = ("Archivo: " + entity.getOriginalName() + "\n" + entity.getDescription()).getBytes(StandardCharsets.UTF_8);
        }

        HttpHeaders headers = new HttpHeaders();
        try {
            headers.setContentType(MediaType.parseMediaType(entity.getMimeType()));
        } catch (Exception e) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }

        ContentDisposition disp = (attachment ? ContentDisposition.attachment() : ContentDisposition.inline())
                .filename(entity.getOriginalName(), StandardCharsets.UTF_8)
                .build();
        headers.setContentDisposition(disp);

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
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

    // ==================== SEED INICIAL EN BASE DE DATOS ====================
    private void seedInitialDatabaseRecords() {
        try {
            // 1. PDF Sample: Factura Corporativa
            String samplePdfBase64 = "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggMTI4Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNTAgNzcwIFRECihPcmRlbiBkZSBDb21wcmEgT01OSUZJTEUgU1RVRElPKVRqCjAgLTMwIFRECi9GMSAxMiBUZgooRmFjdHVyYSBjb3Jwb3JhdGl2YSBhbG1hY2VuYWRhIGVuIGxhIEJEIGRlbCBCYWNrZW5kIFBvc3RncmVTUUwpVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyMTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgogNDAwCiUlRU9G";
            byte[] pdfBytes = Base64.getDecoder().decode(samplePdfBase64);
            String pdfFilename = UUID.randomUUID() + ".pdf";
            Files.write(storageDir.resolve(pdfFilename), pdfBytes);

            ManagedFileEntity pdfEntity = new ManagedFileEntity(
                    null, "Factura_Comercial_2026.pdf", pdfFilename, "pdf", "application/pdf",
                    FileCategory.PDF, FileOrigin.UPLOADED, pdfBytes.length, 1, null, null, null, LocalDateTime.now()
            );
            pdfEntity.setTag("Facturas");
            pdfEntity.setDescription("Factura de servicios cloud y desarrollo. Persistida en base de datos PostgreSQL.");
            pdfEntity.setArchived(false);
            pdfEntity.setSigned(true);
            pdfEntity.setCompressed(false);
            pdfEntity.setDataUrl("data:application/pdf;base64," + samplePdfBase64);
            pdfEntity.setFileData(pdfBytes);
            jpaRepository.save(pdfEntity);

            // 2. Image Sample: Comprobante Recibo
            String samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAGVJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4GWZ+AABKq2h5gAAAABJRU5ErkJggg==";
            byte[] pngBytes = Base64.getDecoder().decode(samplePngBase64);
            String pngFilename = UUID.randomUUID() + ".png";
            Files.write(storageDir.resolve(pngFilename), pngBytes);

            ManagedFileEntity imgEntity = new ManagedFileEntity(
                    null, "Recibo_Pago_Digital.png", pngFilename, "png", "image/png",
                    FileCategory.IMAGE, FileOrigin.UPLOADED, pngBytes.length, null, 200, 200, null, LocalDateTime.now()
            );
            imgEntity.setTag("Personal");
            imgEntity.setDescription("Comprobante de transferencia bancaria escaneado en alta resolución.");
            imgEntity.setArchived(false);
            imgEntity.setSigned(false);
            imgEntity.setCompressed(false);
            imgEntity.setDataUrl("data:image/png;base64," + samplePngBase64);
            imgEntity.setFileData(pngBytes);
            jpaRepository.save(imgEntity);

            // 3. CSV Sample: Planilla de Datos
            String csvContent = "ID,Concepto,Categoria,Monto,Fecha,Estado\n1,Licencia Cloud,Facturas,$45000,2026-11-08,Aprobado\n2,Servidor Postgres,Infraestructura,$82000,2026-11-09,Aprobado\n3,Desarrollo Frontend,Trabajo,$65000,2026-11-10,Completado\n4,Auditoria Seguridad,Legal,$38000,2026-11-10,En curso";
            byte[] csvBytes = csvContent.getBytes(StandardCharsets.UTF_8);
            String csvFilename = UUID.randomUUID() + ".csv";
            Files.write(storageDir.resolve(csvFilename), csvBytes);

            ManagedFileEntity csvEntity = new ManagedFileEntity(
                    null, "Reporte_Presupuesto_Q4.csv", csvFilename, "csv", "text/csv",
                    FileCategory.DATA, FileOrigin.UPLOADED, csvBytes.length, null, null, null, null, LocalDateTime.now()
            );
            csvEntity.setTag("Facturas");
            csvEntity.setDescription("Planilla detallada de costos operativos e infraestructura tecnológica.");
            csvEntity.setArchived(false);
            csvEntity.setSigned(false);
            csvEntity.setCompressed(false);
            csvEntity.setDataUrl("data:text/csv;charset=utf-8," + java.net.URLEncoder.encode(csvContent, StandardCharsets.UTF_8));
            csvEntity.setFileData(csvBytes);
            jpaRepository.save(csvEntity);

            // 4. DOCX Sample: Propuesta de Proyecto
            String docContent = "OMNIFILE STUDIO - PROPUESTA TECNICA\n\nSistema integral de gestion y conversion multiformato con persistencia en PostgreSQL y visor de documentos optimizado.";
            byte[] docBytes = docContent.getBytes(StandardCharsets.UTF_8);
            String docFilename = UUID.randomUUID() + ".docx";
            Files.write(storageDir.resolve(docFilename), docBytes);

            ManagedFileEntity docEntity = new ManagedFileEntity(
                    null, "Propuesta_Comercial_Corporativa.docx", docFilename, "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    FileCategory.DOCUMENT, FileOrigin.UPLOADED, docBytes.length, 3, null, null, null, LocalDateTime.now()
            );
            docEntity.setTag("Trabajo");
            docEntity.setDescription("Documento Word (.docx) con propuesta tecnica y alcance del proyecto.");
            docEntity.setArchived(false);
            docEntity.setSigned(false);
            docEntity.setCompressed(false);
            docEntity.setDataUrl("data:text/plain;charset=utf-8," + java.net.URLEncoder.encode(docContent, StandardCharsets.UTF_8));
            docEntity.setFileData(docBytes);
            jpaRepository.save(docEntity);

        } catch (Exception e) {
            System.err.println("No se pudo sembrar registros iniciales: " + e.getMessage());
        }
    }

    private String extractExt(String filename) {
        if (filename == null || !filename.contains(".")) return "pdf";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase().trim();
    }

    private String resolveMime(String ext) {
        return switch (ext.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "webp" -> "image/webp";
            case "csv" -> "text/csv";
            case "txt" -> "text/plain";
            case "json" -> "application/json";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            default -> "application/octet-stream";
        };
    }
}
