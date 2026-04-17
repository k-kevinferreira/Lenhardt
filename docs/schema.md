# Schema

Resumo das tabelas usadas pelo sistema.

## `admins`

Finalidade:

- usuarios com acesso ao painel admin

Campos principais:

- `id`
- `email`
- `senha`
- `ativo`
- `role`
- `created_at`
- `updated_at`

Observacoes:

- `email` e unico
- `senha` e armazenada com hash `bcrypt`
- `role` pode ser `admin` ou `operador`

## `refresh_tokens`

Finalidade:

- controle de refresh token por usuario

Campos principais:

- `id`
- `user_id`
- `token_hash`
- `revoked`
- `expires_at`
- `created_at`

Relacionamento:

- `user_id -> admins.id`

## `audit_logs`

Finalidade:

- registrar acoes sensiveis de autenticacao e gestao de usuarios admin

Campos principais:

- `id`
- `actor_admin_id`
- `actor_email`
- `action`
- `target_type`
- `target_id`
- `status`
- `ip`
- `user_agent`
- `details`
- `created_at`

## `solicitacoes_acesso`

Finalidade:

- registrar pedidos publicos de acesso ao painel

Campos principais:

- `id`
- `nome`
- `email`
- `telefone`
- `senha_hash`
- `observacoes`
- `status`
- `reviewed_at`
- `reviewed_by_admin_id`
- `created_at`
- `updated_at`

Observacoes:

- `status` pode ser `pendente`, `aprovado` ou `recusado`
- quando aprovada, a solicitacao gera um usuario em `admins` com perfil `operador`

Relacionamento:

- `reviewed_by_admin_id -> admins.id`

## `funcionarios`

Finalidade:

- cadastro operacional da equipe

Campos principais:

- `id`
- `nome`
- `cargo`
- `email`
- `telefone`
- `status`
- `observacoes`
- `created_at`
- `updated_at`

Observacao:

- funcionario nao e o mesmo que usuario admin

## `veiculos`

Finalidade:

- ficha base dos veiculos dos clientes

Campos principais:

- `id`
- `placa`
- `nome_cliente`
- `veiculo`
- `ultimo_servico`
- `data_ultimo_servico`
- `observacao`
- `created_at`
- `updated_at`

Observacoes:

- `placa` e unica
- historico real vem dos agendamentos e pagamentos

## `agendamentos`

Finalidade:

- agenda operacional de atendimentos

Campos principais:

- `id`
- `nome`
- `email`
- `telefone`
- `veiculo_id`
- `servico`
- `data`
- `valor`
- `status`
- `observacoes`
- `created_at`
- `updated_at`

Relacionamento:

- `veiculo_id -> veiculos.id`

## `pagamentos`

Finalidade:

- registrar conclusao financeira dos agendamentos

Campos principais:

- `id`
- `agendamento_id`
- `nome_cliente`
- `servico`
- `valor`
- `data_pagamento`
- `status`
- `created_at`

Relacionamento:

- `agendamento_id -> agendamentos.id`

## `produtos`

Finalidade:

- controle de estoque

Campos principais:

- `id`
- `produto`
- `quantidade`
- `data_compra`
- `valor_gasto`
- `status`
- `created_at`
- `updated_at`

## `contatos`

Finalidade:

- mensagens enviadas pelo site

Campos principais:

- `id`
- `nome`
- `email`
- `telefone`
- `mensagem`
- `created_at`

## Relacoes Principais

```text
admins 1---N refresh_tokens
admins 1---N audit_logs
admins 1---N solicitacoes_acesso (reviewed_by_admin_id)
veiculos 1---N agendamentos
agendamentos 1---1 pagamentos
```

## Regras de Negocio Relevantes

- um agendamento concluido pode gerar pagamento
- o veiculo pode existir sem historico inicial
- desativar usuario admin invalida seus refresh tokens
- excluir o ultimo usuario admin do sistema nao e permitido
- solicitacoes publicas aprovadas criam usuario com perfil inicial `operador`
