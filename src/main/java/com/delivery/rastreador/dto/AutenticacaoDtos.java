package com.delivery.rastreador.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Objetos que entram e saem da API de autenticação (com as validações dos campos).
// Os nomes dos campos (name, email, password...) são os mesmos do JSON que o front usa
public final class AutenticacaoDtos {
    private AutenticacaoDtos() {}

    public record CadastroRequisicao(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record LoginRequisicao(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AutenticacaoResposta(String token, Long userId, String name, String email) {}
}
