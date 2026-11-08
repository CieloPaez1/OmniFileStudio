package com.integrador.web.auth;

public record AuthResponseDTO(
        String token,
        UserResponseDTO user
) {}
