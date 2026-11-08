package filemanager.usecase;

import exception.ValidationException;
import filemanager.input.UploadFileInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

public class UploadFileUseCase implements UploadFileInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public UploadFileUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public ManagedFile upload(String originalName, String mimeType, byte[] content) {
        if (originalName == null || originalName.isBlank()) {
            throw new ValidationException("El nombre del archivo es obligatorio.");
        }
        if (content == null || content.length == 0) {
            throw new ValidationException("El archivo subido está vacío.");
        }

        ManagedFile stored = fileProcessor.storeUploadedFile(originalName, mimeType, content);
        return fileRepository.save(stored);
    }
}
