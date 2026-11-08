package filemanager.usecase;

import exception.ResourceNotFoundException;
import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.input.CreatePdfFromPhotosInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

import java.util.ArrayList;
import java.util.List;

public class CreatePdfFromPhotosUseCase implements CreatePdfFromPhotosInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public CreatePdfFromPhotosUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public ManagedFile createFromPhotos(
            List<byte[]> photoBuffers,
            List<Long> existingImageFileIds,
            List<Integer> rotations,
            String title,
            String pageSize,
            String orientation,
            int margin
    ) {
        List<byte[]> allImages = new ArrayList<>();
        if (photoBuffers != null) {
            for (byte[] buf : photoBuffers) {
                if (buf != null && buf.length > 0) {
                    allImages.add(buf);
                }
            }
        }

        if (existingImageFileIds != null) {
            for (Long id : existingImageFileIds) {
                ManagedFile imgFile = fileRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Imagen no encontrada con ID: " + id));
                if (imgFile.getCategory() != FileCategory.IMAGE) {
                    throw new ValidationException("El archivo '" + imgFile.getOriginalName() + "' no es una imagen.");
                }
                allImages.add(fileProcessor.readFileBytes(imgFile.getStoredFilename()));
            }
        }

        if (allImages.isEmpty()) {
            throw new ValidationException("Debe incluir al menos una foto o imagen para crear el PDF.");
        }

        String finalTitle = (title == null || title.isBlank()) ? "Escaneo_Camara" : title.trim();
        ManagedFile createdPdf = fileProcessor.createPdfFromImages(
                allImages,
                rotations != null ? rotations : List.of(),
                finalTitle,
                pageSize != null ? pageSize : "A4",
                orientation != null ? orientation : "portrait",
                Math.max(0, margin)
        );

        return fileRepository.save(createdPdf);
    }
}
