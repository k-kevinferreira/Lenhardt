# API

Resumo das rotas principais do sistema.

## Base URL

Ambiente local padrão:

```text
http://127.0.0.1:3000/api
```

## Autenticação

Rotas protegidas exigem:

```http
Authorization: Bearer <accessToken>
```

## Auth

### POST `/api/auth/login`

Autenticação: pública

Body:

- `email`
- `senha`

Resposta:

- `accessToken`
- `user`
- `id`
- `email`
- `role`

### POST `/api/auth/refresh`

Autenticação: cookie `refresh_token`

Resposta:

- `accessToken`
- `user`
- `id`
- `email`
- `role`

### POST `/api/auth/logout`

Autenticação: opcional com cookie; invalida o refresh atual

### GET `/api/auth/me`

Autenticação: protegida

Resposta:

- `user`
- `id`
- `email`
- `role`

### GET `/api/auth/admins`

Autenticação: protegida (`admin`)

Resposta:

- lista de usuários admin

Campos:

- `id`
- `email`
- `role`
- `ativo`
- `created_at`

### POST `/api/auth/admins`

Autenticação: protegida (`admin`)

Body:

- `email`
- `senha`
- `role` (`admin` ou `operador`)

### PUT `/api/auth/admins/:id/password`

Autenticação: protegida (`admin`)

Body:

- `senha`

### PATCH `/api/auth/admins/:id/status`

Autenticação: protegida (`admin`)

Body:

- `ativo`

### PATCH `/api/auth/admins/:id/role`

Autenticação: protegida (`admin`)

Body:

- `role` (`admin` ou `operador`)

### DELETE `/api/auth/admins/:id`

Autenticação: protegida (`admin`)

### GET `/api/auth/access-requests`

Autenticação: protegida (`admin`)

Resposta:

- lista de solicitações de acesso pendentes

Campos:

- `id`
- `nome`
- `email`
- `telefone`
- `observacoes`
- `status`
- `created_at`

### PATCH `/api/auth/access-requests/:id/approve`

Autenticação: protegida (`admin`)

Resposta:

- `message`

### PATCH `/api/auth/access-requests/:id/reject`

Autenticação: protegida (`admin`)

Resposta:

- `message`

## Público

### POST `/api/public/agendamentos`

Autenticação: pública

Body:

- `nome`
- `email` opcional
- `telefone`
- `veiculo`
- `servico`
- `data`
- `observacoes` opcional

Resposta:

- `message`
- `id`
- `valor_estimado`

### POST `/api/public/contatos`

Autenticação: pública

Body:

- `nome`
- `email`
- `telefone`
- `mensagem`

Resposta:

- `message`

### POST `/api/public/solicitacoes-acesso`

Autenticação: pública

Body:

- `nome`
- `email`
- `telefone` opcional
- `senha`
- `observacoes` opcional

Resposta:

- `message`
- `id`

## Funcionários

### GET `/api/funcionarios`

Autenticação: protegida (`admin` ou `operador`)

### POST `/api/funcionarios`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `nome`
- `cargo`
- `email` opcional
- `telefone` opcional
- `status`
- `observacoes` opcional

### PUT `/api/funcionarios/:id`

Autenticação: protegida (`admin` ou `operador`)

Mesmo body de criação.

### DELETE `/api/funcionarios/:id`

Autenticação: protegida (`admin`)

## Veículos

### GET `/api/veiculos`

Autenticação: protegida (`admin` ou `operador`)

### POST `/api/veiculos`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `placa`
- `nome_cliente`
- `veiculo`
- `ultimo_servico` opcional
- `data_ultimo_servico` opcional
- `observacao` opcional

### PUT `/api/veiculos/:id`

Autenticação: protegida (`admin` ou `operador`)

Mesmo body de criação.

### DELETE `/api/veiculos/:id`

Autenticação: protegida (`admin`)

### GET `/api/veiculos/:id/historico`

Autenticação: protegida (`admin` ou `operador`)

Resposta:

- `veiculo`
- `total_pago`
- `historico`

## Produtos

### GET `/api/produtos`

Autenticação: protegida (`admin` ou `operador`)

### POST `/api/produtos`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `produto`
- `quantidade`
- `data_compra` opcional
- `valor_gasto`

### PUT `/api/produtos/:id`

Autenticação: protegida (`admin` ou `operador`)

### DELETE `/api/produtos/:id`

Autenticação: protegida (`admin`)

## Agendamentos

### GET `/api/agendamentos`

Autenticação: protegida (`admin` ou `operador`)

### POST `/api/agendamentos`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `nome`
- `email` opcional
- `telefone`
- `veiculo_id`
- `servico`
- `data`
- `valor`
- `observacoes` opcional

### PUT `/api/agendamentos/:id`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `nome`
- `email` opcional
- `telefone`
- `servico`
- `data`
- `valor`
- `status`
- `observacoes` opcional

### DELETE `/api/agendamentos/:id`

Autenticação: protegida (`admin`)

### PATCH `/api/agendamentos/:id/confirmar`

Autenticação: protegida (`admin` ou `operador`)

### PATCH `/api/agendamentos/:id/cancelar`

Autenticação: protegida (`admin` ou `operador`)

### PATCH `/api/agendamentos/:id/reagendar`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `data`

### PATCH `/api/agendamentos/:id/concluir`

Autenticação: protegida (`admin` ou `operador`)

Body:

- `valor` opcional
- `data_pagamento` opcional
- `status` opcional (`pago`, `pendente` ou `estornado`)

## Dashboard

### GET `/api/dashboard/resumo?ano=YYYY&mes=M`

Autenticação: protegida (`admin` ou `operador`)

### GET `/api/dashboard/faturamento-mes?ano=YYYY`

Autenticação: protegida (`admin` ou `operador`)

### GET `/api/dashboard/servicos-top?ano=YYYY&mes=M`

Autenticação: protegida (`admin` ou `operador`)

## Erros Comuns

- `400` entrada inválida
- `401` não autenticado ou sessão expirada
- `403` sem permissão para a ação, usuário desativado ou origem bloqueada
- `404` recurso não encontrado
- `409` conflito de negócio
- `500` erro interno
