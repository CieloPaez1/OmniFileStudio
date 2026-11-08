package filemanager.input;

import filemanager.model.ManagedFile;

import java.util.List;

public interface FindFilesInput {
    List<ManagedFile> findAll();
    ManagedFile findById(Long id);
    byte[] downloadBytes(Long id);
    ManagedFile rename(Long id, String newName);
}
