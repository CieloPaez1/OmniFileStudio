package usecase;

import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;
import filemanager.model.ManagedFile;
import filemanager.output.FileProcessorOutPut;
import filemanager.output.FileRepositoryOutPut;
import filemanager.usecase.ConvertFileUseCase;
import filemanager.usecase.MergePdfsUseCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileManagerUseCasesTest {

    @Mock
    private FileRepositoryOutPut fileRepository;

    @Mock
    private FileProcessorOutPut fileProcessor;

    @InjectMocks
    private ConvertFileUseCase convertFileUseCase;

    @InjectMocks
    private MergePdfsUseCase mergePdfsUseCase;

    @Test
    void convertSameFormatShouldThrowValidationException() {
        ManagedFile pngFile = ManagedFile.restore(
                1L, "foto.png", "s1.png", "png", "image/png",
                FileCategory.IMAGE, FileOrigin.UPLOADED, 1200L, null, 400, 300, null, LocalDateTime.now()
        );
        when(fileRepository.findById(1L)).thenReturn(Optional.of(pngFile));

        assertThrows(ValidationException.class, () ->
                convertFileUseCase.convert(1L, "png", 90, null, null)
        );
    }

    @Test
    void mergeLessThanTwoPdfsShouldThrowValidationException() {
        assertThrows(ValidationException.class, () ->
                mergePdfsUseCase.mergePdfs(List.of(1L), "Resultado")
        );
    }

    @Test
    void mergeValidPdfsShouldReturnSavedMergedFile() {
        ManagedFile pdf1 = ManagedFile.restore(
                1L, "a.pdf", "a.pdf", "pdf", "application/pdf",
                FileCategory.PDF, FileOrigin.UPLOADED, 1000L, 2, null, null, null, LocalDateTime.now()
        );
        ManagedFile pdf2 = ManagedFile.restore(
                2L, "b.pdf", "b.pdf", "pdf", "application/pdf",
                FileCategory.PDF, FileOrigin.UPLOADED, 1500L, 3, null, null, null, LocalDateTime.now()
        );
        ManagedFile merged = ManagedFile.restore(
                3L, "Unido.pdf", "m.pdf", "pdf", "application/pdf",
                FileCategory.PDF, FileOrigin.MERGED_PDF, 2500L, 5, null, null, null, LocalDateTime.now()
        );

        when(fileRepository.findById(1L)).thenReturn(Optional.of(pdf1));
        when(fileRepository.findById(2L)).thenReturn(Optional.of(pdf2));
        when(fileProcessor.mergePdfFiles(any(), any())).thenReturn(merged);
        when(fileRepository.save(any())).thenReturn(merged);

        ManagedFile result = mergePdfsUseCase.mergePdfs(List.of(1L, 2L), "Unido");
        assertEquals(5, result.getPageCount());
        assertEquals(FileOrigin.MERGED_PDF, result.getOrigin());
    }
}
