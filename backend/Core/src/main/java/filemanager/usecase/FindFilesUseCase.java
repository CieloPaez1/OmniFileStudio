package filemanager.usecase;

import exception.ResourceNotFoundException;
import filemanager.input.FindFilesInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

import java.util.List;

public class FindFilesUseCase implements FindFilesInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public FindFilesUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public List<ManagedFile> findAll() {
        return fileRepository.findAll();
    }

    @Override
    public ManagedFile findById(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Archivo no encontrado con ID: " + id));
    }

    @Override
    public byte[] downloadBytes(Long id) {
        ManagedFile file = findById(id);
        return fileProcessor.readFileBytes(file.getStoredFilename());
    }

    @Override
    public ManagedFile rename(Long id, String newName) {
        ManagedFile file = findById(id);
        file.rename(newName);
        return fileRepository.save(file);
    }
}
