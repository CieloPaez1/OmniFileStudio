package filemanager.input;

import filemanager.model.ManagedFile;

public interface UploadFileInput {
    ManagedFile upload(String originalName, String mimeType, byte[] content);
}
