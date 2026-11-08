package filemanager.output;

import filemanager.model.ManagedFile;

import java.util.List;
import java.util.Optional;

public interface FileRepositoryOutPut {
    ManagedFile save(ManagedFile file);
    Optional<ManagedFile> findById(Long id);
    List<ManagedFile> findAll();
    void deleteById(Long id);
}
