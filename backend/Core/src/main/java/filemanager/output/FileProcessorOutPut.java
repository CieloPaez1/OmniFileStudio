package filemanager.output;

import filemanager.model.ManagedFile;

import java.util.List;
import java.util.Map;

public interface FileProcessorOutPut {
    ManagedFile storeUploadedFile(String originalName, String mimeType, byte[] bytes);

    ManagedFile convertFile(
            ManagedFile source,
            String targetFormat,
            Integer quality,
            Integer width,
            Integer height
    );

    ManagedFile createPdfFromImages(
            List<byte[]> imageBuffers,
            List<Integer> rotations,
            String title,
            String pageSize,
            String orientation,
            int margin
    );

    ManagedFile mergePdfFiles(List<ManagedFile> sources, String outputTitle);

    List<ManagedFile> splitPdfFile(
            ManagedFile source,
            String ranges,
            String mode,
            String outputTitle,
            Map<Integer, Integer> rotations
    );

    ManagedFile createZipArchive(List<ManagedFile> filesToZip, String zipName, Long parentId);

    byte[] readFileBytes(String storedFilename);

    void deletePhysicalFile(String storedFilename);
}
