package com.integrador.persistence.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import user.model.User;
import user.output.UserOutPut;

import java.util.Optional;

@Repository
public class UserRepository implements UserOutPut {

    private final UserJPARepository userJpa;

    @Autowired
    public UserRepository(UserJPARepository userJpa) {
        this.userJpa = userJpa;
    }

    @Override
    public boolean save(User user) {
        if (user == null) return false;

        UserEntity entity = UserMapper.coreToEntity(user);
        UserEntity saved = userJpa.save(entity);

        if (saved.getId() != null) {
            user.setId(saved.getId());
            return true;
        }
        return false;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return userJpa.findByEmailIgnoreCase(email.trim())
                .map(UserMapper::entityToCore);
    }

    @Override
    public boolean existsByEmail(String email) {
        if (email == null) return false;
        return userJpa.existsByEmailIgnoreCase(email.trim());
    }
}
