package user.usecase;

import exception.DuplicateResourceException;
import exception.ValidationException;
import user.input.RegisterUserInput;
import user.model.User;
import user.output.UserOutPut;

public class RegisterUserUseCase implements RegisterUserInput {

    private final UserOutPut userOutPut;

    public RegisterUserUseCase(UserOutPut userOutPut) {
        this.userOutPut = userOutPut;
    }

    @Override
    public User register(String name, String email, String password, String role) {
        if (email == null || email.isBlank()) {
            throw new ValidationException("El correo electrónico es obligatorio.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userOutPut.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("El correo electrónico ya está registrado.");
        }

        User newUser = User.createNew(name, normalizedEmail, password, role);
        userOutPut.save(newUser);
        return newUser;
    }
}
