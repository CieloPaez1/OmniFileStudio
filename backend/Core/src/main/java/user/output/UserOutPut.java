package user.output;

import user.model.User;

import java.util.Optional;

public interface UserOutPut {
    boolean save(User user);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
