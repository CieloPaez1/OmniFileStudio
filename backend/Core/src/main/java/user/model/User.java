package user.model;

import exception.ValidationException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public class User {

    private static final String PASSWORD_SALT = "IntegradorProgAvz2026_Salt_Key";

    private Long id;
    private final String name;
    private final String email;
    private final String passwordHash;
    private final String role;

    private User(Long id, String name, String email, String passwordHash, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public static User createNew(String name, String email, String rawPassword, String role) {
        if (name == null || name.isBlank() || name.trim().length() < 3) {
            throw new ValidationException("El nombre debe tener al menos 3 caracteres.");
        }
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw new ValidationException("El correo electrónico no es válido.");
        }
        if (rawPassword == null || rawPassword.length() < 6) {
            throw new ValidationException("La contraseña debe tener al menos 6 caracteres.");
        }
        String normalizedEmail = email.trim().toLowerCase();
        String finalRole = (role == null || role.isBlank()) ? "Usuario" : role.trim();
        String hashed = hashPassword(rawPassword);

        return new User(null, name.trim(), normalizedEmail, hashed, finalRole);
    }

    public static User restore(Long id, String name, String email, String passwordHash, String role) {
        return new User(id, name, email, passwordHash, role);
    }

    public boolean verifyPassword(String rawPassword) {
        if (rawPassword == null) return false;
        String candidateHash = hashPassword(rawPassword);
        return MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                this.passwordHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    public static String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest((PASSWORD_SALT + ":" + rawPassword).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No se pudo inicializar SHA-256", e);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
}
