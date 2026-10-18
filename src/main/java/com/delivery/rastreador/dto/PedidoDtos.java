package com.delivery.rastreador.dto;

import com.delivery.rastreador.enums.StatusPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// Objetos de entrada (Requisicao) e saída (Resposta) da API de pedidos.
// Os nomes dos campos são os mesmos do JSON que o front usa.
public final class PedidoDtos {
    private PedidoDtos() {}

    public record CriarPedidoRequisicao(
            @NotBlank @Size(max = 120) String customerName,
            @NotBlank @Size(max = 250) String deliveryAddress,
            @NotEmpty List<@Valid ItemRequisicao> items
    ) {}

    public record ItemRequisicao(
            @NotBlank @Size(max = 120) String name,
            @Min(1) int quantity,
            @NotNull @Positive BigDecimal unitPrice
    ) {}

    public record AtualizarStatusRequisicao(@NotNull StatusPedido status) {}

    public record ItemResposta(Long id, String name, int quantity, BigDecimal unitPrice,
                               BigDecimal subtotal) {}

    public record PedidoResposta(Long id, String customerName, String deliveryAddress,
                                StatusPedido status, LocalDateTime createdAt,
                                List<ItemResposta> items, BigDecimal total) {}
}
