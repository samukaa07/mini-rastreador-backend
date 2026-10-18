package com.delivery.rastreador.controller;

import com.delivery.rastreador.dto.PedidoDtos;
import com.delivery.rastreador.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Endpoints dos pedidos (/api/orders). Aqui não tem regra, só chama o PedidoService
@RestController
@RequestMapping("/api/orders")
public class PedidoController {
    private final PedidoService orderService;

    public PedidoController(PedidoService orderService) {
        this.orderService = orderService;
    }

    // POST /api/orders - cria um pedido
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoDtos.PedidoResposta criar(Authentication authentication,
                                         @Valid @RequestBody PedidoDtos.CriarPedidoRequisicao request) {
        return orderService.criar(authentication.getName(), request);
    }

    // GET /api/orders - lista os pedidos
    @GetMapping
    public List<PedidoDtos.PedidoResposta> listar(Authentication authentication) {
        return orderService.listar(authentication.getName());
    }

    // GET /api/orders/{id} - busca um pedido pelo id
    @GetMapping("/{id}")
    public PedidoDtos.PedidoResposta buscarPorId(Authentication authentication, @PathVariable Long id) {
        return orderService.buscarPorId(authentication.getName(), id);
    }

    // PATCH /api/orders/{id}/status - muda o status do pedido
    @PatchMapping("/{id}/status")
    public PedidoDtos.PedidoResposta atualizarStatus(Authentication authentication, @PathVariable Long id,
                                                   @Valid @RequestBody PedidoDtos.AtualizarStatusRequisicao request) {
        return orderService.atualizarStatus(authentication.getName(), id, request.status());
    }
}
