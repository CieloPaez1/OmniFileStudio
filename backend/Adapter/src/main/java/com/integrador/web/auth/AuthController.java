package com.integrador.web.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import user.input.LoginUserInput;
import user.input.RegisterUserInput;
import user.model.User;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final LoginUserInput loginUser;
    private final RegisterUserInput registerUser;
    private final JwtTokenService jwtTokenService;

    public AuthController(
            LoginUserInput loginUser,
            RegisterUserInput registerUser,
            JwtTokenService jwtTokenService
    ) {
        this.loginUser = loginUser;
        this.registerUser = registerUser;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        User user = loginUser.login(request.getEmail(), request.getPassword());
        String token = jwtTokenService.generateToken(user);

        return ResponseEntity.ok(
                new AuthResponseDTO(token, UserResponseDTO.from(user))
        );
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO request) {
        User user = registerUser.register(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                "Usuario"
        );
        String token = jwtTokenService.generateToken(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new AuthResponseDTO(token, UserResponseDTO.from(user)));
    }
}
