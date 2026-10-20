# Mini Rastreador de Pedidos — Front-end

Interface React + TypeScript + Vite para o desafio técnico Mini Rastreador de Pedidos.

## Requisitos
- Node.js 18+
- Back-end Spring Boot iniciado em `http://localhost:8080`

## Executar no Windows
Abra um terminal dentro desta pasta e execute:

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Funcionalidades
- Cadastro e login com e-mail e senha.
- Guarda o token JWT localmente e envia `Authorization: Bearer <token>` às rotas protegidas.
- Lista pedidos, status, cliente, endereço, itens e valor total.
- Busca por ID, cliente ou endereço.
- Filtro por status.
- Cria pedidos.
- Avança status e permite cancelar antes de sair para entrega.
- Layout responsivo.

## Configuração da API
Por padrão, a aplicação chama `http://localhost:8080`. Se necessário, crie um arquivo `.env` baseado em `.env.example` e defina `VITE_API_URL`.

## Observação
O back-end precisa estar executando e o CORS deve permitir `http://localhost:5173`. Os endpoints esperados são:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/{id}/status`

O front-end não substitui as validações de segurança e regras de negócio do back-end.
