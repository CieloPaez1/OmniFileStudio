package com.integrador.persistence.filemanager;

import filemanager.model.ManagedFile;
import filemanager.output.FileRepositoryOutPut;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ManagedFileRepository implements FileRepositoryOutPut {

    private final ManagedFileJPARepository jpaRepository;

    public ManagedFileRepository(ManagedFileJPARepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ManagedFile save(ManagedFile file) {
        ManagedFileEntity saved = jpaRepository.save(ManagedFileMapper.toEntity(file));
        file.setId(saved.getId());
        return ManagedFileMapper.toDomain(saved);
    }

    @Override
    public Optional<ManagedFile> findById(Long id) {
        return jpaRepository.findById(id).map(ManagedFileMapper::toDomain);
    }

    @Override
    public List<ManagedFile> findAll() {
        return jpaRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ManagedFileMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }
}
