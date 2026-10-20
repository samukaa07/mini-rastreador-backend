# Mini Rastreador de Pedidos — Back-end

Back-end Java 21 + Spring Boot 3.5 + Spring Security/JWT + SQLite.

## Organização MVC em camadas
- `controller`: endpoints REST
- `service`: regras de negócio
- `repository`: acesso a dados com Spring Data JPA
- `model`: entidades JPA
- `dto`: objetos de entrada e saída da API
- `enums`: valores fixos do domínio, incluindo `OrderStatus`
- `security`: autenticação JWT e UserDetailsService
- `config`: configurações de segurança e CORS


## Requisitos
- JDK 21
- Node.js 18+ (front-end)

## Como executar

### Back-end
Na pasta do back-end (onde está o `pom.xml`):
```bash
mvn spring-boot:run
```
A API inicia em `http://localhost:8080`. O banco SQLite `mini-rastreador.db` é criado automaticamente.

### Front-end
Na pasta `mini-rastreador-frontend`:
```bash
npm install
npm run dev
```
Acesse `http://localhost:5173`. Faça o cadastro, entre e crie pedidos.

### Testes
```bash
mvn test
```

## Endpoints
- `POST /api/auth/register` — cadastro (público)
- `POST /api/auth/login` — login (público)
- `POST /api/orders` — cria pedido (token JWT obrigatório)
- `GET /api/orders` — lista os pedidos do usuário autenticado
- `GET /api/orders/{id}` — consulta pedido próprio
- `PATCH /api/orders/{id}/status` — atualiza status de pedido próprio

## Exemplos de JSON

Cadastro:
```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "Senha123"
}
```

Login:
```json
{
  "email": "maria@example.com",
  "password": "Senha123"
}
```

Criar pedido:
```json
{
  "customerName": "Maria Silva",
  "deliveryAddress": "Rua das Flores, 123",
  "items": [
    { "name": "Hambúrguer", "quantity": 2, "unitPrice": 25.90 },
    { "name": "Suco", "quantity": 1, "unitPrice": 8.50 }
  ]
}
```

Atualizar status:
```json
{
  "status": "EM_PREPARO"
}
```

Status aceitos: `RECEBIDO`, `EM_PREPARO`, `SAIU_PARA_ENTREGA`, `ENTREGUE`, `CANCELADO`.

## Importante
- A senha é armazenada usando BCrypt.
- O JWT é enviado no cabeçalho `Authorization: Bearer <token>`.
- Os endpoints de pedidos exigem autenticação e cada usuário só vê seus próprios pedidos.
- As transições de status são validadas no domínio.
- A chave JWT do `application.properties` é apenas para desenvolvimento local. Troque-a antes de publicar.
- O front-end Vite deve rodar em `http://localhost:5173` para corresponder ao CORS configurado.
