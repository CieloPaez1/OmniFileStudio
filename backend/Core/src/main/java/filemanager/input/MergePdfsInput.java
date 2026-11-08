package filemanager.input;

import filemanager.model.ManagedFile;

import java.util.List;

public interface MergePdfsInput {
    ManagedFile mergePdfs(List<Long> pdfFileIds, String outputTitle);
}
