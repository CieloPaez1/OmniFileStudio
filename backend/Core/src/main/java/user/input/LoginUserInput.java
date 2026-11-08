package user.input;

import user.model.User;

public interface LoginUserInput {
    User login(String email, String password);
}
