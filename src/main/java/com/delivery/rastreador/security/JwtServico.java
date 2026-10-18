package com.delivery.rastreador.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

// Cuida do token JWT: gera no login, lê o e-mail de dentro dele e confere se ainda vale.
// A chave secreta e o tempo de expiração vêm do application.properties
@Service
public class JwtServico {
    private final SecretKey key;
    private final long expirationMs;

    public JwtServico(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMs = expirationMs;
    }

    public String gerarToken(UserDetails userDetails) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String extrairUsuario(String token) {
        return extrairClaims(token).getSubject();
    }

    // O token só vale se for do mesmo usuário e não tiver expirado
    public boolean tokenValido(String token, UserDetails userDetails) {
        Claims claims = extrairClaims(token);
        return userDetails.getUsername().equals(claims.getSubject())
                && claims.getExpiration().after(new Date());
    }

    // Já valida a assinatura; se o token for falso ou estiver adulterado, lança exceção
    private Claims extrairClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }
}
