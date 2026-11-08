package filemanager.usecase;

import exception.ResourceNotFoundException;
import exception.ValidationException;
import filemanager.input.ConvertFileInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

public class ConvertFileUseCase implements ConvertFileInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public ConvertFileUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public ManagedFile convert(
            Long sourceFileId,
            String targetFormat,
            Integer quality,
            Integer width,
            Integer height
    ) {
        if (sourceFileId == null) {
            throw new ValidationException("El ID del archivo de origen es obligatorio.");
        }
        if (targetFormat == null || targetFormat.isBlank()) {
            throw new ValidationException("El formato de destino es obligatorio.");
        }

        ManagedFile source = fileRepository.findById(sourceFileId)
                .orElseThrow(() -> new ResourceNotFoundException("Archivo de origen no encontrado con ID: " + sourceFileId));

        String cleanFormat = targetFormat.toLowerCase().replace(".", "").trim();
        if (cleanFormat.equals(source.getExtension())) {
            throw new ValidationException("El archivo ya se encuentra en formato ." + cleanFormat);
        }

        ManagedFile converted = fileProcessor.convertFile(source, cleanFormat, quality, width, height);
        return fileRepository.save(converted);
    }
}
