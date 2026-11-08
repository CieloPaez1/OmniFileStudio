package filemanager.usecase;

import exception.ResourceNotFoundException;
import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.input.MergePdfsInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

import java.util.ArrayList;
import java.util.List;

public class MergePdfsUseCase implements MergePdfsInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public MergePdfsUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public ManagedFile mergePdfs(List<Long> pdfFileIds, String outputTitle) {
        if (pdfFileIds == null || pdfFileIds.size() < 2) {
            throw new ValidationException("Se requieren al menos 2 archivos PDF para unirlos.");
        }

        List<ManagedFile> sources = new ArrayList<>();
        for (Long id : pdfFileIds) {
            ManagedFile file = fileRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Archivo PDF no encontrado con ID: " + id));
            if (file.getCategory() != FileCategory.PDF) {
                throw new ValidationException("El archivo '" + file.getOriginalName() + "' no es un documento PDF.");
            }
            sources.add(file);
        }

        String finalTitle = (outputTitle == null || outputTitle.isBlank()) ? "Documento_Unido" : outputTitle.trim();
        ManagedFile merged = fileProcessor.mergePdfFiles(sources, finalTitle);
        return fileRepository.save(merged);
    }
}
