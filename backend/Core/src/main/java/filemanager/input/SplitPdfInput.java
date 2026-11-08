package filemanager.input;

import filemanager.model.ManagedFile;

import java.util.List;
import java.util.Map;

public interface SplitPdfInput {
    SplitResult splitPdf(
            Long sourcePdfId,
            String ranges,
            String mode,
            String outputTitle,
            Map<Integer, Integer> rotations
    );

    record SplitResult(
            List<ManagedFile> generatedPdfs,
            ManagedFile zipArchive
    ) {}
}
