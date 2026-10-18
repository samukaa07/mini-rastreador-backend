package com.delivery.rastreador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Classe que liga a aplicação. É só rodar o main que o Spring Boot sobe tudo
@SpringBootApplication
public class MiniRastreadorApplication {
    public static void main(String[] args) {
        SpringApplication.run(MiniRastreadorApplication.class, args);
    }
}
