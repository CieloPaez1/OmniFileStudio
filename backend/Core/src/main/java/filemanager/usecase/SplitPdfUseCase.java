package filemanager.usecase;

import exception.ResourceNotFoundException;
import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.input.SplitPdfInput;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class SplitPdfUseCase implements SplitPdfInput {

    private final FileRepositoryOutPut fileRepository;
    private final FileProcessorOutPut fileProcessor;

    public SplitPdfUseCase(
            FileRepositoryOutPut fileRepository,
            FileProcessorOutPut fileProcessor
    ) {
        this.fileRepository = fileRepository;
        this.fileProcessor = fileProcessor;
    }

    @Override
    public SplitResult splitPdf(
            Long sourcePdfId,
            String ranges,
            String mode,
            String outputTitle,
            Map<Integer, Integer> rotations
    ) {
        if (sourcePdfId == null) {
            throw new ValidationException("Debe indicar el archivo PDF a dividir.");
        }

        ManagedFile source = fileRepository.findById(sourcePdfId)
                .orElseThrow(() -> new ResourceNotFoundException("Archivo PDF no encontrado con ID: " + sourcePdfId));

        if (source.getCategory() != FileCategory.PDF) {
            throw new ValidationException("El archivo seleccionado no es un documento PDF.");
        }

        List<ManagedFile> rawSplitFiles = fileProcessor.splitPdfFile(
                source,
                ranges,
                mode != null ? mode : "extract-single",
                outputTitle,
                rotations != null ? rotations : Map.of()
        );

        List<ManagedFile> savedFiles = new ArrayList<>();
        for (ManagedFile f : rawSplitFiles) {
            savedFiles.add(fileRepository.save(f));
        }

        ManagedFile savedZip = null;
        if (savedFiles.size() > 1) {
            String baseTitle = (outputTitle != null && !outputTitle.isBlank())
                    ? outputTitle.trim().replaceAll("(?i)\\.pdf$", "")
                    : source.getOriginalName().replaceAll("(?i)\\.pdf$", "") + "_dividido";
            ManagedFile zip = fileProcessor.createZipArchive(savedFiles, baseTitle + ".zip", source.getId());
            savedZip = fileRepository.save(zip);
        }

        return new SplitResult(savedFiles, savedZip);
    }
}
