package com.delivery.rastreador.enums;

// Etapas do pedido, na ordem normal: RECEBIDO -> EM_PREPARO -> SAIU_PARA_ENTREGA -> ENTREGUE.
// CANCELADO pode acontecer antes de sair pra entrega
public enum StatusPedido {
    RECEBIDO,
    EM_PREPARO,
    SAIU_PARA_ENTREGA,
    ENTREGUE,
    CANCELADO
}
