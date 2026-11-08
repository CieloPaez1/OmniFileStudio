package com.integrador.persistence.user;

import user.model.User;

public class UserMapper {

    public static UserEntity coreToEntity(User user) {
        if (user == null) return null;
        return new UserEntity(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole()
        );
    }

    public static User entityToCore(UserEntity entity) {
        if (entity == null) return null;
        return User.restore(
                entity.getId(),
                entity.getName(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getRole()
        );
    }
}
