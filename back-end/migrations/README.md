# Migrations

Execute os arquivos SQL em ordem numerica no PostgreSQL da aplicacao.

Ordem recomendada:

1. `001_create_admins.sql`
2. `002_create_refresh_tokens.sql`
3. `003_create_funcionarios.sql`
4. `004_create_veiculos.sql`
5. `005_create_agendamentos.sql`
6. `006_create_produtos.sql`
7. `007_create_pagamentos.sql`
8. `008_create_contatos.sql`
9. `009_alter_veiculos_make_history_optional.sql`
10. `010_alter_admins_add_ativo.sql`
11. `011_create_solicitacoes_acesso.sql`
12. `012_alter_admins_add_role.sql`
13. `013_create_audit_logs.sql`

Observacoes:

- `agendamentos` depende de `veiculos`
- `pagamentos` depende de `agendamentos`
- `refresh_tokens` depende de `admins`
- a `001_create_admins.sql` cria tambem a funcao compartilhada `set_updated_at()`
- apos aplicar as migrations, o backend nao depende mais de criacao implicita de tabela no controller
- em banco ja existente, execute tambem a `009_alter_veiculos_make_history_optional.sql`
- para gerir usuarios admin pelo painel, execute tambem a `010_alter_admins_add_ativo.sql`
- para permissoes por perfil e auditoria, execute tambem `012_alter_admins_add_role.sql` e `013_create_audit_logs.sql`
