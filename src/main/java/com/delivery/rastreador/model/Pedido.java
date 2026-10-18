package com.delivery.rastreador.model;

import com.delivery.rastreador.enums.StatusPedido;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Pedido de entrega. Pertence a um usuário (owner) e tem uma lista de itens.
// Quem controla as mudanças de status é o próprio pedido (método atualizarStatus)
@Entity
@Table(name = "orders")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(nullable = false, length = 250)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusPedido status = StatusPedido.RECEBIDO;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Usuario owner;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> items = new ArrayList<>();

    protected Pedido() {}

    public Pedido(String customerName, String deliveryAddress, Usuario owner, List<ItemPedido> items) {
        this.customerName = customerName;
        this.deliveryAddress = deliveryAddress;
        this.owner = owner;
        this.items = new ArrayList<>(items);
        this.items.forEach(item -> item.setOrder(this));
        this.status = StatusPedido.RECEBIDO;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getCustomerName() { return customerName; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public StatusPedido getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Usuario getOwner() { return owner; }
    public List<ItemPedido> getItems() { return items; }

    // Regras do fluxo: RECEBIDO -> EM_PREPARO -> SAIU_PARA_ENTREGA -> ENTREGUE
    // CANCELADO só é possível antes de sair para entrega
    public void atualizarStatus(StatusPedido newStatus) {
        if (status == StatusPedido.ENTREGUE || status == StatusPedido.CANCELADO) {
            throw new IllegalStateException("Pedidos entregues ou cancelados não podem mudar de status.");
        }
        if (newStatus == status) return;

        boolean allowed = switch (status) {
            case RECEBIDO -> newStatus == StatusPedido.EM_PREPARO || newStatus == StatusPedido.CANCELADO;
            case EM_PREPARO -> newStatus == StatusPedido.SAIU_PARA_ENTREGA || newStatus == StatusPedido.CANCELADO;
            case SAIU_PARA_ENTREGA -> newStatus == StatusPedido.ENTREGUE;
            case ENTREGUE, CANCELADO -> false;
        };
        if (!allowed) {
            throw new IllegalStateException("Transição de status não permitida: " + status + " -> " + newStatus);
        }
        this.status = newStatus;
    }
}
