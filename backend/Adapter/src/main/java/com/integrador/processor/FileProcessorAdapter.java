package com.integrador.processor;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import com.itextpdf.kernel.utils.PdfMerger;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import exception.ResourceNotFoundException;
import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class FileProcessorAdapter implements FileProcessorOutPut {

    private final Path storageDir;

    public FileProcessorAdapter() {
        this.storageDir = Paths.get("storage", "files").toAbsolutePath();
        try {
            Files.createDirectories(this.storageDir);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento de archivos", e);
        }
    }

    @Override
    public ManagedFile storeUploadedFile(String originalName, String mimeType, byte[] bytes) {
        try {
            String ext = extractExtension(originalName);
            String storedFilename = UUID.randomUUID() + "." + ext;
            Path targetPath = storageDir.resolve(storedFilename);
            Files.write(targetPath, bytes);

            Integer pageCount = null;
            Integer width = null;
            Integer height = null;

            FileCategory category = FileCategory.fromExtension(ext);
            if (category == FileCategory.PDF) {
                pageCount = readPdfPageCount(bytes);
            } else if (category == FileCategory.IMAGE) {
                int[] dims = readImageDimensions(bytes);
                if (dims != null) {
                    width = dims[0];
                    height = dims[1];
                }
            }

            return ManagedFile.create(
                    originalName,
                    storedFilename,
                    ext,
                    resolveMimeType(ext, mimeType),
                    FileOrigin.UPLOADED,
                    bytes.length,
                    pageCount,
                    width,
                    height,
                    null
            );
        } catch (IOException e) {
            throw new ValidationException("Error al almacenar el archivo en disco: " + e.getMessage());
        }
    }

    @Override
    public ManagedFile convertFile(
            ManagedFile source,
            String targetFormat,
            Integer quality,
            Integer width,
            Integer height
    ) {
        try {
            byte[] srcBytes = readFileBytes(source.getStoredFilename());
            String cleanTarget = targetFormat.toLowerCase().replace(".", "").trim();
            String baseName = stripExtension(source.getOriginalName());
            String outOriginalName = baseName + "_convertido." + cleanTarget;
            String outStoredName = UUID.randomUUID() + "." + cleanTarget;
            Path outPath = storageDir.resolve(outStoredName);

            FileCategory srcCat = source.getCategory();
            byte[] outBytes;

            if (srcCat == FileCategory.IMAGE) {
                if ("pdf".equals(cleanTarget)) {
                    outBytes = buildPdfFromImagesBytes(
                            List.of(srcBytes),
                            List.of(0),
                            "A4",
                            "portrait",
                            24
                    );
                } else {
                    outBytes = convertImageBytes(srcBytes, cleanTarget, width, height);
                }
            } else if (srcCat == FileCategory.PDF) {
                String extractedText = extractTextFromPdf(srcBytes);
                if ("html".equals(cleanTarget)) {
                    outBytes = buildHtmlDocument(baseName, "<pre>" + escapeHtml(extractedText) + "</pre>");
                } else {
                    outBytes = extractedText.getBytes(StandardCharsets.UTF_8);
                }
            } else if (srcCat == FileCategory.DATA) {
                String rawText = new String(srcBytes, StandardCharsets.UTF_8);
                if ("pdf".equals(cleanTarget)) {
                    outBytes = buildPdfFromTextOrCsv(baseName, rawText, "csv".equals(source.getExtension()));
                } else if ("html".equals(cleanTarget)) {
                    outBytes = buildHtmlTableFromCsvOrText(baseName, rawText);
                } else if ("json".equals(cleanTarget) && "csv".equals(source.getExtension())) {
                    outBytes = convertCsvToJson(rawText).getBytes(StandardCharsets.UTF_8);
                } else if ("csv".equals(cleanTarget)) {
                    outBytes = rawText.getBytes(StandardCharsets.UTF_8);
                } else {
                    outBytes = rawText.getBytes(StandardCharsets.UTF_8);
                }
            } else {
                String rawText = new String(srcBytes, StandardCharsets.UTF_8);
                if ("pdf".equals(cleanTarget)) {
                    String cleanText = ("html".equals(source.getExtension()) || "htm".equals(source.getExtension()))
                            ? rawText.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim()
                            : rawText;
                    outBytes = buildPdfFromTextOrCsv(baseName, cleanText, false);
                } else if ("html".equals(cleanTarget)) {
                    outBytes = buildHtmlDocument(baseName, "<pre>" + escapeHtml(rawText) + "</pre>");
                } else {
                    String plain = ("html".equals(source.getExtension()) || "htm".equals(source.getExtension()))
                            ? rawText.replaceAll("<[^>]+>", "")
                            : rawText;
                    outBytes = plain.getBytes(StandardCharsets.UTF_8);
                }
            }

            Files.write(outPath, outBytes);

            Integer pageCount = "pdf".equals(cleanTarget) ? readPdfPageCount(outBytes) : null;
            Integer outW = null;
            Integer outH = null;
            if (FileCategory.fromExtension(cleanTarget) == FileCategory.IMAGE) {
                int[] dims = readImageDimensions(outBytes);
                if (dims != null) {
                    outW = dims[0];
                    outH = dims[1];
                }
            }

            return ManagedFile.create(
                    outOriginalName,
                    outStoredName,
                    cleanTarget,
                    resolveMimeType(cleanTarget, null),
                    FileOrigin.CONVERTED,
                    outBytes.length,
                    pageCount,
                    outW,
                    outH,
                    source.getId()
            );
        } catch (IOException e) {
            throw new ValidationException("No se pudo convertir el archivo: " + e.getMessage());
        }
    }

    @Override
    public ManagedFile createPdfFromImages(
            List<byte[]> imageBuffers,
            List<Integer> rotations,
            String title,
            String pageSize,
            String orientation,
            int margin
    ) {
        try {
            byte[] pdfBytes = buildPdfFromImagesBytes(imageBuffers, rotations, pageSize, orientation, margin);
            String cleanTitle = title.replaceAll("(?i)\\.pdf$", "");
            String originalName = cleanTitle + ".pdf";
            String storedFilename = UUID.randomUUID() + ".pdf";
            Files.write(storageDir.resolve(storedFilename), pdfBytes);

            Integer pages = readPdfPageCount(pdfBytes);

            return ManagedFile.create(
                    originalName,
                    storedFilename,
                    "pdf",
                    "application/pdf",
                    FileOrigin.CAMERA_PDF,
                    pdfBytes.length,
                    pages,
                    null,
                    null,
                    null
            );
        } catch (IOException e) {
            throw new ValidationException("Error al crear el PDF desde las fotos: " + e.getMessage());
        }
    }

    @Override
    public ManagedFile mergePdfFiles(List<ManagedFile> sources, String outputTitle) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             PdfDocument mergedPdf = new PdfDocument(new PdfWriter(baos))) {

            PdfMerger merger = new PdfMerger(mergedPdf);

            for (ManagedFile src : sources) {
                byte[] bytes = readFileBytes(src.getStoredFilename());
                try (PdfDocument srcDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(bytes)))) {
                    merger.merge(srcDoc, 1, srcDoc.getNumberOfPages());
                }
            }

            int totalPages = mergedPdf.getNumberOfPages();
            mergedPdf.close();

            byte[] outBytes = baos.toByteArray();
            String cleanTitle = outputTitle.replaceAll("(?i)\\.pdf$", "");
            String originalName = cleanTitle + ".pdf";
            String storedFilename = UUID.randomUUID() + ".pdf";
            Files.write(storageDir.resolve(storedFilename), outBytes);

            return ManagedFile.create(
                    originalName,
                    storedFilename,
                    "pdf",
                    "application/pdf",
                    FileOrigin.MERGED_PDF,
                    outBytes.length,
                    totalPages,
                    null,
                    null,
                    sources.get(0).getId()
            );
        } catch (IOException e) {
            throw new ValidationException("Error al unir los documentos PDF: " + e.getMessage());
        }
    }

    @Override
    public List<ManagedFile> splitPdfFile(
            ManagedFile source,
            String ranges,
            String mode,
            String outputTitle,
            Map<Integer, Integer> rotations
    ) {
        byte[] srcBytes = readFileBytes(source.getStoredFilename());
        try (PdfDocument srcDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(srcBytes)))) {
            int totalPages = srcDoc.getNumberOfPages();
            List<List<Integer>> groups = parsePageGroups(ranges, totalPages, mode);

            if (groups.isEmpty() || groups.get(0).isEmpty()) {
                throw new ValidationException("No se seleccionaron páginas válidas dentro del rango 1-" + totalPages);
            }

            String baseName = (outputTitle != null && !outputTitle.isBlank())
                    ? outputTitle.trim().replaceAll("(?i)\\.pdf$", "")
                    : stripExtension(source.getOriginalName());

            List<ManagedFile> created = new ArrayList<>();

            for (List<Integer> group : groups) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                try (PdfDocument destDoc = new PdfDocument(new PdfWriter(baos))) {
                    for (Integer pageNum : group) {
                        srcDoc.copyPagesTo(pageNum, pageNum, destDoc);
                        PdfPage newlyAdded = destDoc.getPage(destDoc.getNumberOfPages());
                        int extraRot = rotations.getOrDefault(pageNum, 0);
                        if (extraRot != 0) {
                            int currentRot = newlyAdded.getRotation();
                            newlyAdded.setRotation((currentRot + extraRot) % 360);
                        }
                    }
                }

                byte[] outBytes = baos.toByteArray();
                String storedFilename = UUID.randomUUID() + ".pdf";
                Files.write(storageDir.resolve(storedFilename), outBytes);

                String suffix = group.size() == 1
                        ? "pag_" + group.get(0)
                        : "pags_" + group.get(0) + "_a_" + group.get(group.size() - 1);
                String finalName = groups.size() == 1
                        ? baseName + ".pdf"
                        : baseName + "_" + suffix + ".pdf";

                created.add(ManagedFile.create(
                        finalName,
                        storedFilename,
                        "pdf",
                        "application/pdf",
                        FileOrigin.SPLIT_PDF,
                        outBytes.length,
                        group.size(),
                        null,
                        null,
                        source.getId()
                ));
            }

            return created;
        } catch (IOException e) {
            throw new ValidationException("Error al dividir el documento PDF: " + e.getMessage());
        }
    }

    @Override
    public ManagedFile createZipArchive(List<ManagedFile> filesToZip, String zipName, Long parentId) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            for (ManagedFile f : filesToZip) {
                byte[] content = readFileBytes(f.getStoredFilename());
                ZipEntry entry = new ZipEntry(f.getOriginalName());
                zos.putNextEntry(entry);
                zos.write(content);
                zos.closeEntry();
            }
            zos.finish();

            byte[] zipBytes = baos.toByteArray();
            String storedFilename = UUID.randomUUID() + ".zip";
            Files.write(storageDir.resolve(storedFilename), zipBytes);

            return ManagedFile.create(
                    zipName,
                    storedFilename,
                    "zip",
                    "application/zip",
                    FileOrigin.SPLIT_PDF,
                    zipBytes.length,
                    null,
                    null,
                    null,
                    parentId
            );
        } catch (IOException e) {
            throw new ValidationException("Error al empaquetar los archivos en ZIP: " + e.getMessage());
        }
    }

    @Override
    public byte[] readFileBytes(String storedFilename) {
        try {
            Path p = storageDir.resolve(storedFilename);
            if (!Files.exists(p)) {
                throw new ResourceNotFoundException("El archivo físico no existe en almacenamiento: " + storedFilename);
            }
            return Files.readAllBytes(p);
        } catch (IOException e) {
            throw new ValidationException("Error al leer el archivo: " + e.getMessage());
        }
    }

    @Override
    public void deletePhysicalFile(String storedFilename) {
        try {
            Path p = storageDir.resolve(storedFilename);
            Files.deleteIfExists(p);
        } catch (IOException ignored) {
        }
    }

    // ==================== HELPERS INTERNOS CON iTEXT 8 & IMAGEIO ====================

    private byte[] buildPdfFromImagesBytes(
            List<byte[]> imageBuffers,
            List<Integer> rotations,
            String pageSizeName,
            String orientation,
            int margin
    ) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos))) {
            for (int i = 0; i < imageBuffers.size(); i++) {
                int rot = (rotations != null && i < rotations.size() && rotations.get(i) != null)
                        ? rotations.get(i)
                        : 0;
                byte[] normalizedBytes = normalizeAndRotateImage(imageBuffers.get(i), rot);
                ImageData imgData = ImageDataFactory.create(normalizedBytes);
                float imgW = imgData.getWidth();
                float imgH = imgData.getHeight();

                PageSize pageSize;
                if ("FIT".equalsIgnoreCase(pageSizeName)) {
                    pageSize = new PageSize(imgW + margin * 2, imgH + margin * 2);
                } else {
                    PageSize base = "LETTER".equalsIgnoreCase(pageSizeName) ? PageSize.LETTER : PageSize.A4;
                    pageSize = "landscape".equalsIgnoreCase(orientation) ? base.rotate() : base;
                }

                pdfDoc.addNewPage(pageSize);
                try (Document doc = new Document(pdfDoc, pageSize)) {
                    doc.setMargins(margin, margin, margin, margin);
                    Image img = new Image(imgData);
                    float availW = Math.max(40, pageSize.getWidth() - margin * 2);
                    float availH = Math.max(40, pageSize.getHeight() - margin * 2);
                    img.scaleToFit(availW, availH);
                    float drawW = img.getImageScaledWidth();
                    float drawH = img.getImageScaledHeight();
                    float x = (pageSize.getWidth() - drawW) / 2f;
                    float y = (pageSize.getHeight() - drawH) / 2f;
                    img.setFixedPosition(i + 1, x, y);
                    doc.add(img);
                }
            }
        }
        return baos.toByteArray();
    }

    private byte[] normalizeAndRotateImage(byte[] rawImageBytes, int degrees) throws IOException {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(rawImageBytes));
        if (src == null) {
            return rawImageBytes;
        }
        int normDeg = ((degrees % 360) + 360) % 360;
        BufferedImage target = src;

        if (normDeg == 90 || normDeg == 180 || normDeg == 270) {
            int w = src.getWidth();
            int h = src.getHeight();
            int newW = (normDeg == 90 || normDeg == 270) ? h : w;
            int newH = (normDeg == 90 || normDeg == 270) ? w : h;

            target = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = target.createGraphics();
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, newW, newH);
            AffineTransform at = new AffineTransform();
            at.translate(newW / 2.0, newH / 2.0);
            at.rotate(Math.toRadians(normDeg));
            at.translate(-w / 2.0, -h / 2.0);
            g2d.drawImage(src, at, null);
            g2d.dispose();
        } else {
            BufferedImage rgbImg = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = rgbImg.createGraphics();
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, src.getWidth(), src.getHeight());
            g2d.drawImage(src, 0, 0, null);
            g2d.dispose();
            target = rgbImg;
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(target, "jpg", out);
        return out.toByteArray();
    }

    private byte[] convertImageBytes(byte[] srcBytes, String targetExt, Integer reqWidth, Integer reqHeight) throws IOException {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(srcBytes));
        if (src == null) {
            throw new ValidationException("No se pudo decodificar la imagen de entrada.");
        }

        int targetW = (reqWidth != null && reqWidth > 0) ? reqWidth : src.getWidth();
        int targetH = (reqHeight != null && reqHeight > 0) ? reqHeight : src.getHeight();

        if (reqWidth != null && reqHeight == null) {
            double ratio = (double) reqWidth / src.getWidth();
            targetH = Math.max(1, (int) Math.round(src.getHeight() * ratio));
        } else if (reqHeight != null && reqWidth == null) {
            double ratio = (double) reqHeight / src.getHeight();
            targetW = Math.max(1, (int) Math.round(src.getWidth() * ratio));
        }

        boolean needsOpaqueRgb = "jpg".equals(targetExt) || "jpeg".equals(targetExt) || "bmp".equals(targetExt);
        int imgType = needsOpaqueRgb ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB;

        BufferedImage outputImg = new BufferedImage(targetW, targetH, imgType);
        Graphics2D g2d = outputImg.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        if (needsOpaqueRgb) {
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, targetW, targetH);
        }
        g2d.drawImage(src, 0, 0, targetW, targetH, null);
        g2d.dispose();

        String formatName = "jpeg".equals(targetExt) ? "jpg" : targetExt;
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        boolean written = ImageIO.write(outputImg, formatName, baos);
        if (!written) {
            ImageIO.write(outputImg, "png", baos);
        }
        return baos.toByteArray();
    }

    private byte[] buildPdfFromTextOrCsv(String title, String content, boolean isCsv) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdfDoc = new PdfDocument(new PdfWriter(baos));
             Document doc = new Document(pdfDoc, PageSize.A4)) {

            doc.add(new Paragraph(title).setBold().setFontSize(15));

            if (isCsv) {
                String[] lines = content.split("\\r?\\n");
                if (lines.length > 0) {
                    String[] firstCols = lines[0].split(",");
                    int cols = Math.max(1, firstCols.length);
                    Table table = new Table(cols).useAllAvailableWidth();
                    for (String line : lines) {
                        if (line.isBlank()) continue;
                        String[] cells = line.split(",", -1);
                        for (int c = 0; c < cols; c++) {
                            table.addCell(c < cells.length ? cells[c].trim() : "");
                        }
                    }
                    doc.add(table);
                }
            } else {
                for (String line : content.split("\\r?\\n")) {
                    doc.add(new Paragraph(line.isEmpty() ? " " : line).setFontSize(10.5f));
                }
            }
        }
        return baos.toByteArray();
    }

    private String extractTextFromPdf(byte[] pdfBytes) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            for (int p = 1; p <= pdfDoc.getNumberOfPages(); p++) {
                sb.append("--- Página ").append(p).append(" ---\n");
                sb.append(PdfTextExtractor.getTextFromPage(pdfDoc.getPage(p))).append("\n\n");
            }
        }
        return sb.toString();
    }

    private byte[] buildHtmlDocument(String title, String bodyHtml) {
        String html = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <title>%s</title>
                  <style>
                    body { font-family: system-ui, sans-serif; max-width: 880px; margin: 2rem auto; padding: 0 1.5rem; color: #0f172a; line-height: 1.6; }
                    pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; white-space: pre-wrap; }
                    table { border-collapse: collapse; width: 100%%; margin-top: 1rem; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                    tr:nth-child(even) { background: #f8fafc; }
                  </style>
                </head>
                <body>
                  <h1>%s</h1>
                  %s
                </body>
                </html>
                """.formatted(escapeHtml(title), escapeHtml(title), bodyHtml);
        return html.getBytes(StandardCharsets.UTF_8);
    }

    private byte[] buildHtmlTableFromCsvOrText(String title, String csv) {
        StringBuilder table = new StringBuilder("<table>");
        String[] lines = csv.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].isBlank()) continue;
            table.append("<tr>");
            String tag = (i == 0) ? "th" : "td";
            for (String cell : lines[i].split(",", -1)) {
                table.append("<").append(tag).append(">")
                        .append(escapeHtml(cell.trim()))
                        .append("</").append(tag).append(">");
            }
            table.append("</tr>");
        }
        table.append("</table>");
        return buildHtmlDocument(title, table.toString());
    }

    private String convertCsvToJson(String csv) {
        String[] lines = csv.split("\\r?\\n");
        if (lines.length == 0) return "[]";
        String[] headers = lines[0].split(",");
        StringBuilder sb = new StringBuilder("[\n");
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].isBlank()) continue;
            String[] vals = lines[i].split(",", -1);
            sb.append("  {");
            for (int c = 0; c < headers.length; c++) {
                String k = headers[c].trim().replace("\"", "");
                String v = c < vals.length ? vals[c].trim().replace("\"", "\\\"") : "";
                sb.append("\"").append(k).append("\": \"").append(v).append("\"");
                if (c < headers.length - 1) sb.append(", ");
            }
            sb.append("}").append(i < lines.length - 1 ? ",\n" : "\n");
        }
        sb.append("]");
        return sb.toString();
    }

    private List<List<Integer>> parsePageGroups(String rangeStr, int totalPages, String mode) {
        List<List<Integer>> rawGroups = new ArrayList<>();
        if (rangeStr == null || rangeStr.isBlank()) {
            for (int p = 1; p <= totalPages; p++) {
                rawGroups.add(List.of(p));
            }
        } else {
            String[] parts = rangeStr.split(",");
            for (String part : parts) {
                String token = part.trim();
                if (token.isEmpty()) continue;
                if (token.contains("-")) {
                    String[] bounds = token.split("-");
                    int start = Math.max(1, Math.min(totalPages, Integer.parseInt(bounds[0].trim())));
                    int end = Math.max(1, Math.min(totalPages, Integer.parseInt(bounds[1].trim())));
                    List<Integer> group = new ArrayList<>();
                    if (start <= end) {
                        for (int p = start; p <= end; p++) group.add(p);
                    } else {
                        for (int p = start; p >= end; p--) group.add(p);
                    }
                    rawGroups.add(group);
                } else {
                    int p = Integer.parseInt(token);
                    if (p >= 1 && p <= totalPages) {
                        rawGroups.add(List.of(p));
                    }
                }
            }
        }

        if ("extract-single".equalsIgnoreCase(mode)) {
            List<Integer> flat = rawGroups.stream().flatMap(Collection::stream).toList();
            return List.of(flat);
        }
        return rawGroups;
    }

    private Integer readPdfPageCount(byte[] pdfBytes) {
        try (PdfDocument doc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            return doc.getNumberOfPages();
        } catch (Exception e) {
            return null;
        }
    }

    private int[] readImageDimensions(byte[] imgBytes) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(imgBytes));
            if (img != null) {
                return new int[]{img.getWidth(), img.getHeight()};
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase().trim();
    }

    private String stripExtension(String filename) {
        if (filename == null || !filename.contains(".")) return filename != null ? filename : "Archivo";
        return filename.substring(0, filename.lastIndexOf('.'));
    }

    private String resolveMimeType(String ext, String fallback) {
        return switch (ext.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "webp" -> "image/webp";
            case "csv" -> "text/csv";
            case "json" -> "application/json";
            case "html", "htm" -> "text/html";
            case "txt", "md" -> "text/plain";
            case "zip" -> "application/zip";
            default -> (fallback != null && !fallback.isBlank()) ? fallback : "application/octet-stream";
        };
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
