package com.delivery.rastreador.security;

import com.delivery.rastreador.model.Usuario;
import com.delivery.rastreador.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// O Spring Security usa essa classe pra buscar o usuário no banco pelo e-mail (que é o "username" aqui)
@Service
public class UsuarioDetalhesService implements UserDetailsService {
    private final UsuarioRepository userRepository;

    public UsuarioDetalhesService(UsuarioRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                // todo mundo tem o mesmo perfil por enquanto, não tem admin
                .authorities("ROLE_USER")
                .build();
    }
}
