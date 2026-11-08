package com.integrador.persistence.filemanager;

import filemanager.model.ManagedFile;

public class ManagedFileMapper {

    public static ManagedFileEntity toEntity(ManagedFile domain) {
        return new ManagedFileEntity(
                domain.getId(),
                domain.getOriginalName(),
                domain.getStoredFilename(),
                domain.getExtension(),
                domain.getMimeType(),
                domain.getCategory(),
                domain.getOrigin(),
                domain.getSizeBytes(),
                domain.getPageCount(),
                domain.getWidth(),
                domain.getHeight(),
                domain.getParentId(),
                domain.getCreatedAt()
        );
    }

    public static ManagedFile toDomain(ManagedFileEntity entity) {
        return ManagedFile.restore(
                entity.getId(),
                entity.getOriginalName(),
                entity.getStoredFilename(),
                entity.getExtension(),
                entity.getMimeType(),
                entity.getCategory(),
                entity.getOrigin(),
                entity.getSizeBytes(),
                entity.getPageCount(),
                entity.getWidth(),
                entity.getHeight(),
                entity.getParentId(),
                entity.getCreatedAt()
        );
    }
}
