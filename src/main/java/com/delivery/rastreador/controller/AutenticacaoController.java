package com.delivery.rastreador.controller;

import com.delivery.rastreador.dto.AutenticacaoDtos;
import com.delivery.rastreador.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// Endpoints públicos de cadastro e login (/api/auth)
@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {
    private final AutenticacaoService authService;

    public AutenticacaoController(AutenticacaoService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AutenticacaoDtos.AutenticacaoResposta cadastrar(@Valid @RequestBody AutenticacaoDtos.CadastroRequisicao request) {
        return authService.cadastrar(request);
    }

    @PostMapping("/login")
    public AutenticacaoDtos.AutenticacaoResposta entrar(@Valid @RequestBody AutenticacaoDtos.LoginRequisicao request) {
        return authService.entrar(request);
    }
}
