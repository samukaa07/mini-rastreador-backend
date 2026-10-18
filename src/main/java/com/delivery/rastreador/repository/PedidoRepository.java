package com.delivery.rastreador.repository;

import com.delivery.rastreador.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Acesso ao banco pros pedidos. O Spring monta as queries sozinho a partir do nome dos métodos
// (Eles precisam bater com os campos da entidade)
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    // pedidos do usuário, do mais novo pro mais antigo
    List<Pedido> findAllByOwnerEmailOrderByCreatedAtDesc(String email);
    // filtra também pelo dono, assim ninguém enxerga pedido de outra pessoa
    Optional<Pedido> findByIdAndOwnerEmail(Long id, String email);
}
