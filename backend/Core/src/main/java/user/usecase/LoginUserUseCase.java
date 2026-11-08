package user.usecase;

import exception.UnauthorizedException;
import user.input.LoginUserInput;
import user.model.User;
import user.output.UserOutPut;

public class LoginUserUseCase implements LoginUserInput {

    private final UserOutPut userOutPut;

    public LoginUserUseCase(UserOutPut userOutPut) {
        this.userOutPut = userOutPut;
    }

    @Override
    public User login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new UnauthorizedException("Email o contraseña incorrectos.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userOutPut.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Email o contraseña incorrectos."));

        if (!user.verifyPassword(password)) {
            throw new UnauthorizedException("Email o contraseña incorrectos.");
        }

        return user;
    }
}
