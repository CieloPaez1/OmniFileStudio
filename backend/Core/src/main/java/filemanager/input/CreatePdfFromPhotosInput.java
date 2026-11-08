package filemanager.input;

import filemanager.model.ManagedFile;

import java.util.List;

public interface CreatePdfFromPhotosInput {
    ManagedFile createFromPhotos(
            List<byte[]> photoBuffers,
            List<Long> existingImageFileIds,
            List<Integer> rotations,
            String title,
            String pageSize,
            String orientation,
            int margin
    );
}
