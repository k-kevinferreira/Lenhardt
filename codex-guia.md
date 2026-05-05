# Codex Guia

## Objetivo

Este guia resume onde o projeto Lenhardt Detailing esta hoje e quais sao os proximos passos recomendados para evoluir o sistema com seguranca, boas praticas, testes e refatoracao gradual.

Para diretrizes completas de arquitetura, seguranca, backend, banco, frontend, TDD e deploy, consulte:

- `docs/padroes-tecnicos.md`

## Estado Atual Do Projeto

O projeto atual e um sistema web real para uma estetica automotiva.

Funcionalidades existentes:

- site publico institucional;
- formulario publico de contato;
- formulario publico de agendamento;
- solicitacao publica de acesso ao painel;
- painel administrativo;
- login administrativo;
- autenticacao com JWT e refresh token;
- controle de roles `admin` e `operador`;
- protecao de rotas administrativas;
- dashboard financeiro;
- gestao de agendamentos;
- gestao de veiculos;
- gestao de estoque/produtos;
- gestao de funcionarios;
- gestao de usuarios admin;
- audit log parcial;
- migrations SQL para PostgreSQL;
- testes minimos no backend.

## Stack Real Atual

Frontend publico:

- HTML;
- CSS;
- JavaScript puro.

Painel administrativo:

- HTML;
- CSS;
- JavaScript puro com ES Modules.

Backend:

- Node.js;
- Express;
- JavaScript.

Banco:

- PostgreSQL;
- SQL manual;
- migrations manuais.

Autenticacao:

- JWT access token;
- refresh token em cookie `httpOnly`;
- refresh token salvo com hash no banco;
- `bcryptjs` para hash de senha.

Testes:

- `node:test`.

## Stack Alvo Futura

A stack futura desejada e:

- Next.js;
- TypeScript;
- Tailwind CSS;
- NestJS;
- Prisma;
- PostgreSQL;
- monorepo em `apps/frontend` e `apps/backend`.

Importante: nao migrar automaticamente. A migracao deve ser uma fase futura, planejada, com testes e baixo risco de regressao.

## Diagnostico Tecnico

Pontos positivos atuais:

- queries parametrizadas;
- uso de `helmet`;
- rate limit em login e formularios publicos;
- validacao de variaveis obrigatorias no boot;
- CORS restrito em producao;
- refresh token em cookie `httpOnly`;
- refresh token hasheado no banco;
- rotacao de refresh token;
- roles `admin` e `operador`;
- bloqueio de acoes destrutivas para operador;
- protecao contra desativar, rebaixar ou excluir ultimo admin ativo;
- constraints e foreign keys no banco;
- separacao basica entre routes, controllers, middlewares e utils;
- testes iniciais de autenticacao/autorizacao.

Principais riscos atuais:

- controllers concentram regra de negocio, SQL, validacao e resposta HTTP;
- access token pode ser persistido em `sessionStorage`;
- solicitacao publica de acesso coleta senha antes da aprovacao;
- ampliar validacao de configuracao conforme novas variaveis criticas surgirem;
- migrations nao possuem tabela de controle de execucao;
- regras de status de agendamento ainda nao estao centralizadas;
- audit log ainda nao cobre todos os fluxos criticos;
- frontend usa bastante manipulacao manual de DOM;
- alguns arquivos apresentam problema de encoding.

## Ordem Recomendada De Evolucao

### 1. Estabilizar seguranca

Prioridade:

- manter e evoluir a validacao de env vars obrigatorias no boot;
- manter CORS restrito em producao;
- revisar persistencia do access token no frontend;
- remover senha do fluxo publico de solicitacao de acesso;
- criar fluxo futuro de convite ou definicao segura de senha;
- revisar uso de CDN e politica CSP;
- ampliar audit log para acoes criticas.

### 2. Criar testes antes de refatorar

Cobrir primeiro:

- login valido;
- login invalido;
- usuario desativado;
- refresh token valido;
- refresh token revogado;
- logout;
- operador bloqueado em acoes administrativas;
- admin autorizado em acoes sensiveis;
- ultimo admin ativo protegido;
- criar agendamento publico;
- criar agendamento interno;
- concluir agendamento e gerar pagamento;
- impedir pagamento duplicado;
- impedir quantidade negativa em estoque.

### 3. Refatorar backend atual com baixo risco

Antes de migrar stack:

- extrair services dos controllers maiores;
- extrair repositories para acesso ao banco;
- centralizar validacoes;
- padronizar erros;
- centralizar regras de status de agendamento;
- criar helpers para transacoes criticas;
- preservar contratos atuais da API.

Estrutura gradual sugerida:

```text
back-end/src/
|-- modules/
|   |-- auth/
|   |-- agendamentos/
|   |-- veiculos/
|   |-- produtos/
|   |-- funcionarios/
|   `-- usuarios/
|-- shared/
|   |-- db/
|   |-- errors/
|   |-- validation/
|   `-- security/
```

### 4. Melhorar banco e migrations

Proximos passos:

- criar `schema_migrations`;
- controlar quais migrations ja foram aplicadas;
- criar constraints para valores positivos;
- avaliar `BOOLEAN` em campos de ativo/inativo;
- planejar tabelas `clientes`, `servicos`, `estoque_movimentacoes` e `user_invites`;
- evitar alteracoes destrutivas sem backup e plano de rollback.

### 5. Evoluir frontend admin

Enquanto estiver em HTML/CSS/JS:

- manter `apiClient.js` como ponto central de integracao;
- reduzir duplicacao entre paginas;
- evitar `innerHTML` sem sanitizacao;
- melhorar tratamento de erro, loading e empty state;
- manter regra de negocio no backend;
- garantir que permissoes visuais tambem sejam aplicadas na API.

### 6. Planejar migracao futura

Migrar para Next.js, NestJS e Prisma somente depois de:

- fluxos criticos testados;
- seguranca estabilizada;
- contratos de API documentados;
- banco modelado com mais clareza;
- plano de migracao incremental definido.

## Proximas Tarefas Praticas

Ordem sugerida para os proximos commits:

1. Concluido: `fix(security): validate environment and restrict production CORS`
2. `test(auth): add coverage for login and refresh token flow`
3. `test(appointments): cover appointment completion payment flow`
4. `refactor(auth): extract authentication service and repository`
5. `refactor(appointments): centralize appointment status transitions`
6. `feat(db): add schema migrations tracking`
7. `feat(auth): replace public password collection with invite flow`

## Regra De Trabalho Para O Codex

Antes de implementar qualquer mudanca:

1. entender o estado atual do codigo;
2. explicar o plano;
3. apontar impacto tecnico;
4. preservar funcionalidades existentes;
5. implementar de forma incremental;
6. rodar ou recomendar testes;
7. informar arquivos alterados;
8. sugerir commit profissional.

O foco do projeto e evoluir com seguranca: estabilizar, testar, refatorar e so depois migrar stack se fizer sentido.
