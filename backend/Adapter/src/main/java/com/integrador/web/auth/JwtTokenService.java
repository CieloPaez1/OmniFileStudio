package com.integrador.web.auth;

import org.springframework.stereotype.Service;
import user.model.User;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
public class JwtTokenService {

    private static final String SECRET_KEY = "IntegradorProgAvz2026_SuperSecret_HMAC_SHA256_Key";
    private static final long EXPIRATION_SECONDS = 86400L; // 24 horas

    public String generateToken(User user) {
        try {
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            long issuedAt = Instant.now().getEpochSecond();
            long expiresAt = issuedAt + EXPIRATION_SECONDS;

            String payloadJson = String.format(
                    "{\"sub\":\"%s\",\"userId\":%d,\"name\":\"%s\",\"role\":\"%s\",\"iat\":%d,\"exp\":%d}",
                    escapeJson(user.getEmail()),
                    user.getId() != null ? user.getId() : 0L,
                    escapeJson(user.getName()),
                    escapeJson(user.getRole()),
                    issuedAt,
                    expiresAt
            );

            Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
            String encodedHeader = encoder.encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = encoder.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String signingInput = encodedHeader + "." + encodedPayload;

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signature = encoder.encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));

            return signingInput + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Error al generar el token JWT", e);
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
