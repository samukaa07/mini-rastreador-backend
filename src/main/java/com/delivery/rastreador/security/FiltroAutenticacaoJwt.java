package com.delivery.rastreador.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// Roda em toda requisição. Pega o token do header "Authorization: Bearer ...",
// e se estiver válido marca o usuário como autenticado. Se não tiver token, só deixa passar
// (quem barra é a regra do ConfiguracaoSeguranca)
@Component
public class FiltroAutenticacaoJwt extends OncePerRequestFilter {
    private final JwtServico jwtService;
    private final UsuarioDetalhesService userDetailsService;

    public FiltroAutenticacaoJwt(JwtServico jwtService, UsuarioDetalhesService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // tira o "Bearer " (7 caracteres) e fica só com o token
        String token = header.substring(7);
        try {
            String email = jwtService.extrairUsuario(token);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                if (jwtService.tokenValido(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        // token inválido ou usuário que não existe mais: limpa e segue sem autenticar (vai dar 401/403)
        } catch (JwtException | IllegalArgumentException ignored) {
            SecurityContextHolder.clearContext();
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ignored) {
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}
