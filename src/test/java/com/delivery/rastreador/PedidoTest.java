package com.delivery.rastreador;

import com.delivery.rastreador.enums.StatusPedido;
import com.delivery.rastreador.model.Pedido;
import com.delivery.rastreador.model.ItemPedido;
import com.delivery.rastreador.model.Usuario;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PedidoTest {

    private Pedido novoPedido() {
        Usuario owner = new Usuario("Maria", "maria@example.com", "hash");
        ItemPedido item = new ItemPedido("Hambúrguer", 2, new BigDecimal("25.90"));
        return new Pedido("Maria", "Rua das Flores, 123", owner, List.of(item));
    }

    @Test
    void novoPedidoComecaComoRecebido() {
        assertEquals(StatusPedido.RECEBIDO, novoPedido().getStatus());
    }

    @Test
    void fluxoNormalAteEntregue() {
        Pedido order = novoPedido();
        order.atualizarStatus(StatusPedido.EM_PREPARO);
        order.atualizarStatus(StatusPedido.SAIU_PARA_ENTREGA);
        order.atualizarStatus(StatusPedido.ENTREGUE);
        assertEquals(StatusPedido.ENTREGUE, order.getStatus());
    }

    @Test
    void naoPermitePularEtapas() {
        Pedido order = novoPedido();
        assertThrows(IllegalStateException.class, () -> order.atualizarStatus(StatusPedido.ENTREGUE));
    }

    @Test
    void pedidoCanceladoNaoMudaMais() {
        Pedido order = novoPedido();
        order.atualizarStatus(StatusPedido.CANCELADO);
        assertThrows(IllegalStateException.class, () -> order.atualizarStatus(StatusPedido.EM_PREPARO));
    }
}
