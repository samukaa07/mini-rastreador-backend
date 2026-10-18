package com.delivery.rastreador.service;

import com.delivery.rastreador.dto.AutenticacaoDtos;
import com.delivery.rastreador.model.Usuario;
import com.delivery.rastreador.repository.UsuarioRepository;
import com.delivery.rastreador.security.JwtServico;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

// Aqui fica a regra de cadastro e login. O controller só repassa a requisição pra cá
@Service
public class AutenticacaoService {
    private final UsuarioRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtServico jwtService;

    public AutenticacaoService(UsuarioRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
                       JwtServico jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    // Cadastra o usuário (senha criptografada) e já devolve o token de acesso
    @Transactional
    public AutenticacaoDtos.AutenticacaoResposta cadastrar(AutenticacaoDtos.CadastroRequisicao request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado");
        }
        Usuario user = userRepository.save(new Usuario(
                request.name().trim(), email, passwordEncoder.encode(request.password())));
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        return new AutenticacaoDtos.AutenticacaoResposta(jwtService.gerarToken(details),
                user.getId(), user.getName(), user.getEmail());
    }

    // Valida e-mail e senha; se estiverem corretos devolve o token JWT
    public AutenticacaoDtos.AutenticacaoResposta entrar(AutenticacaoDtos.LoginRequisicao request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        Usuario user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        return new AutenticacaoDtos.AutenticacaoResposta(jwtService.gerarToken(details),
                user.getId(), user.getName(), user.getEmail());
    }
}
