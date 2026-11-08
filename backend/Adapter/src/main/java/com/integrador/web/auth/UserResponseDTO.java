package com.integrador.web.auth;

import user.model.User;

public record UserResponseDTO(
        Long id,
        String name,
        String email,
        String role
) {
    public static UserResponseDTO from(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
