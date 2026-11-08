package filemanager.usecase;

import exception.ResourceNotFoundException;
import filemanager.input.DeleteFileInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

public class DeleteFileUseCase implements DeleteFileInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public DeleteFileUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public void delete(Long id) {
        ManagedFile file = fileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Archivo no encontrado con ID: " + id));
        fileRepository.deleteById(id);
        fileProcessor.deletePhysicalFile(file.getStoredFilename());
    }
}
