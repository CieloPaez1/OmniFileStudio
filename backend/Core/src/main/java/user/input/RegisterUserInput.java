package user.input;

import user.model.User;

public interface RegisterUserInput {
    User register(String name, String email, String password, String role);
}
