package com.delivery.rastreador.repository;

import com.delivery.rastreador.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acesso ao banco pros usuários. Busca por e-mail sem diferenciar maiúscula de minúscula
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
