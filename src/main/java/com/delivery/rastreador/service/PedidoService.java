package com.delivery.rastreador.service;

import com.delivery.rastreador.dto.PedidoDtos;
import com.delivery.rastreador.enums.StatusPedido;
import com.delivery.rastreador.model.Pedido;
import com.delivery.rastreador.model.ItemPedido;
import com.delivery.rastreador.model.Usuario;
import com.delivery.rastreador.repository.PedidoRepository;
import com.delivery.rastreador.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

// Regras de negócio dos pedidos, Todo método recebe o e-mail do usuário logado
// pra garantir que ele só mexe nos pedidos dele
@Service
public class PedidoService {
    private final PedidoRepository orderRepository;
    private final UsuarioRepository userRepository;

    public PedidoService(PedidoRepository orderRepository, UsuarioRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // Cria um pedido novo vinculado ao usuário logado; o status inicial é RECEBIDO
    @Transactional
    public PedidoDtos.PedidoResposta criar(String email, PedidoDtos.CriarPedidoRequisicao request) {
        Usuario owner = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));

        List<ItemPedido> items = request.items().stream()
                .map(item -> new ItemPedido(item.name().trim(), item.quantity(), item.unitPrice()))
                .toList();

        Pedido order = new Pedido(
                request.customerName().trim(), request.deliveryAddress().trim(), owner, items);
        return paraResposta(orderRepository.save(order));
    }

    // Lista só os pedidos do usuário logado, do mais novo para o mais antigo
    @Transactional(readOnly = true)
    public List<PedidoDtos.PedidoResposta> listar(String email) {
        return orderRepository.findAllByOwnerEmailOrderByCreatedAtDesc(email)
                .stream().map(this::paraResposta).toList();
    }

    @Transactional(readOnly = true)
    public PedidoDtos.PedidoResposta buscarPorId(String email, Long id) {
        return paraResposta(buscarPedidoDoUsuario(email, id));
    }

    // Atualiza o status; se a transição for inválida devolve 409 (conflito)
    @Transactional
    public PedidoDtos.PedidoResposta atualizarStatus(String email, Long id, StatusPedido status) {
        Pedido order = buscarPedidoDoUsuario(email, id);
        try {
            order.atualizarStatus(status);
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        return paraResposta(orderRepository.save(order));
    }

    // Garante que o usuário só acessa pedidos que são dele
    private Pedido buscarPedidoDoUsuario(String email, Long id) {
        return orderRepository.findByIdAndOwnerEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
    }

    // Converte a entidade para o DTO de resposta e calcula o total do pedido
    private PedidoDtos.PedidoResposta paraResposta(Pedido order) {
        List<PedidoDtos.ItemResposta> items = order.getItems().stream()
                .map(item -> new PedidoDtos.ItemResposta(item.getId(), item.getName(),
                        item.getQuantity(), item.getUnitPrice(), item.getSubtotal()))
                .toList();
        BigDecimal total = items.stream().map(PedidoDtos.ItemResposta::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PedidoDtos.PedidoResposta(order.getId(), order.getCustomerName(),
                order.getDeliveryAddress(), order.getStatus(), order.getCreatedAt(), items, total);
    }
}
