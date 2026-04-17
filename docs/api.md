# API

Resumo das rotas principais do sistema.

## Base URL

Ambiente local padrao:

```text
http://127.0.0.1:3000/api
```

## Autenticacao

Rotas protegidas exigem:

```http
Authorization: Bearer <accessToken>
```

## Auth

### POST `/api/auth/login`

Autenticacao: publica

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

Autenticacao: cookie `refresh_token`

Resposta:

- `accessToken`
- `user`
  - `id`
  - `email`
  - `role`

### POST `/api/auth/logout`

Autenticacao: opcional com cookie, invalida refresh atual

### GET `/api/auth/me`

Autenticacao: protegida

Resposta:

- `user`
  - `id`
  - `email`
  - `role`

### GET `/api/auth/admins`

Autenticacao: protegida (`admin`)

Resposta:

- lista de usuarios admin

Campos:

- `id`
- `email`
- `role`
- `ativo`
- `created_at`

### POST `/api/auth/admins`

Autenticacao: protegida (`admin`)

Body:

- `email`
- `senha`
- `role` (`admin` ou `operador`)

### PUT `/api/auth/admins/:id/password`

Autenticacao: protegida (`admin`)

Body:

- `senha`

### PATCH `/api/auth/admins/:id/status`

Autenticacao: protegida (`admin`)

Body:

- `ativo`

### PATCH `/api/auth/admins/:id/role`

Autenticacao: protegida (`admin`)

Body:

- `role` (`admin` ou `operador`)

### DELETE `/api/auth/admins/:id`

Autenticacao: protegida (`admin`)

### GET `/api/auth/access-requests`

Autenticacao: protegida (`admin`)

Resposta:

- lista de solicitacoes de acesso pendentes

Campos:

- `id`
- `nome`
- `email`
- `telefone`
- `observacoes`
- `status`
- `created_at`

### PATCH `/api/auth/access-requests/:id/approve`

Autenticacao: protegida (`admin`)

Resposta:

- `message`

### PATCH `/api/auth/access-requests/:id/reject`

Autenticacao: protegida (`admin`)

Resposta:

- `message`

## Publico

### POST `/api/public/agendamentos`

Autenticacao: publica

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

Autenticacao: publica

Body:

- `nome`
- `email`
- `telefone`
- `mensagem`

Resposta:

- `message`

### POST `/api/public/solicitacoes-acesso`

Autenticacao: publica

Body:

- `nome`
- `email`
- `telefone` opcional
- `senha`
- `observacoes` opcional

Resposta:

- `message`
- `id`

## Funcionarios

### GET `/api/funcionarios`

Autenticacao: protegida (`admin` ou `operador`)

### POST `/api/funcionarios`

Autenticacao: protegida (`admin` ou `operador`)

Body:

- `nome`
- `cargo`
- `email` opcional
- `telefone` opcional
- `status`
- `observacoes` opcional

### PUT `/api/funcionarios/:id`

Autenticacao: protegida (`admin` ou `operador`)

Mesmo body de criacao.

### DELETE `/api/funcionarios/:id`

Autenticacao: protegida (`admin`)

## Veiculos

### GET `/api/veiculos`

Autenticacao: protegida (`admin` ou `operador`)

### POST `/api/veiculos`

Autenticacao: protegida (`admin` ou `operador`)

Body:

- `placa`
- `nome_cliente`
- `veiculo`
- `ultimo_servico` opcional
- `data_ultimo_servico` opcional
- `observacao` opcional

### PUT `/api/veiculos/:id`

Autenticacao: protegida (`admin` ou `operador`)

Mesmo body de criacao.

### DELETE `/api/veiculos/:id`

Autenticacao: protegida (`admin`)

### GET `/api/veiculos/:id/historico`

Autenticacao: protegida (`admin` ou `operador`)

Resposta:

- `veiculo`
- `total_pago`
- `historico`

## Produtos

### GET `/api/produtos`

Autenticacao: protegida (`admin` ou `operador`)

### POST `/api/produtos`

Autenticacao: protegida (`admin` ou `operador`)

Body:

- `produto`
- `quantidade`
- `data_compra` opcional
- `valor_gasto`

### PUT `/api/produtos/:id`

Autenticacao: protegida (`admin` ou `operador`)

### DELETE `/api/produtos/:id`

Autenticacao: protegida (`admin`)

## Agendamentos

### GET `/api/agendamentos`

Autenticacao: protegida (`admin` ou `operador`)

### POST `/api/agendamentos`

Autenticacao: protegida (`admin` ou `operador`)

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

Autenticacao: protegida (`admin` ou `operador`)

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

Autenticacao: protegida (`admin`)

### PATCH `/api/agendamentos/:id/confirmar`

Autenticacao: protegida (`admin` ou `operador`)

### PATCH `/api/agendamentos/:id/cancelar`

Autenticacao: protegida (`admin` ou `operador`)

### PATCH `/api/agendamentos/:id/reagendar`

Autenticacao: protegida (`admin` ou `operador`)

Body:

- `data`

### PATCH `/api/agendamentos/:id/concluir`

Autenticacao: protegida (`admin` ou `operador`)

Body:

- `valor` opcional
- `data_pagamento` opcional
- `status` opcional (`pago`, `pendente` ou `estornado`)

## Dashboard

### GET `/api/dashboard/resumo?ano=YYYY&mes=M`

Autenticacao: protegida (`admin` ou `operador`)

### GET `/api/dashboard/faturamento-mes?ano=YYYY`

Autenticacao: protegida (`admin` ou `operador`)

### GET `/api/dashboard/servicos-top?ano=YYYY&mes=M`

Autenticacao: protegida (`admin` ou `operador`)

## Erros Comuns

- `400` entrada invalida
- `401` nao autenticado ou sessao expirada
- `403` sem permissao para a acao, usuario desativado ou origem bloqueada
- `404` recurso nao encontrado
- `409` conflito de negocio
- `500` erro interno
