package filemanager.input;

import filemanager.model.ManagedFile;

public interface ConvertFileInput {
    ManagedFile convert(
            Long sourceFileId,
            String targetFormat,
            Integer quality,
            Integer width,
            Integer height
    );
}
