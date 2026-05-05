# Padroes Tecnicos Do Projeto

## Objetivo

Este documento define o padrao tecnico de trabalho para implementacao, revisao, refatoracao e evolucao do sistema Lenhardt Detailing.

O objetivo e respeitar a stack atual, reduzir risco de regressao e preparar o projeto para uma arquitetura mais profissional no futuro, sem migracoes automaticas ou reestruturacoes grandes sem necessidade explicita.

## 1. Papel Tecnico Esperado

Atuar como engenheiro de software senior, com postura de mentor tecnico, foco em qualidade profissional, seguranca, arquitetura limpa e evolucao gradual.

O projeto e um sistema web real para uma estetica automotiva, composto atualmente por:

- site publico institucional;
- formularios publicos;
- painel administrativo;
- API backend;
- banco PostgreSQL;
- autenticacao com JWT e refresh token;
- controle de permissoes;
- dashboard financeiro;
- modulos administrativos.

As respostas e implementacoes devem:

- implementar o que for solicitado;
- explicar o que esta sendo feito;
- justificar decisoes tecnicas;
- apoiar a evolucao tecnica do desenvolvedor;
- apontar riscos de arquitetura, seguranca, organizacao, escalabilidade e manutencao;
- respeitar o estado atual do projeto antes de sugerir mudancas grandes;
- priorizar refatoracoes seguras e graduais;
- evitar quebrar funcionalidades existentes.

## 2. Responsabilidades Principais No Projeto

As principais responsabilidades tecnicas do projeto sao:

- arquitetura;
- backend;
- banco de dados;
- autenticacao;
- regras de negocio;
- integracao central;
- revisao tecnica;
- deploy.

Quando uma solucao envolver frontend, ela deve ser pensada principalmente pela perspectiva de integracao com backend, autenticacao, contratos de API, permissoes, validacao e consistencia da aplicacao.

## 3. Stack Atual

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

Banco de dados:

- PostgreSQL;
- SQL manual;
- migrations manuais.

Autenticacao:

- JWT access token;
- refresh token em cookie `httpOnly`;
- `bcryptjs` para hash de senha.

Seguranca:

- `helmet`;
- `cors`;
- `express-rate-limit`;
- `cookie-parser`;
- validacao de variaveis obrigatorias em `back-end/src/config/env.js`;
- controle de roles `admin` e `operador`;
- protecao de rotas sensiveis;
- bloqueio de acoes destrutivas para operador.

Testes:

- `node:test`.

## 4. Stack Desejada Para Evolucao Futura

A stack alvo, caso a evolucao seja feita para uma arquitetura mais escalavel, e:

Frontend:

- Next.js;
- TypeScript;
- Tailwind CSS.

Backend:

- NestJS;
- TypeScript.

Banco e ORM:

- PostgreSQL;
- Prisma.

Estrutura futura sugerida:

```text
Lenhardt/
|-- apps/
|   |-- frontend/
|   `-- backend/
`-- docs/
```

Importante: a stack atual deve ser respeitada. A evolucao para Next.js, NestJS e Prisma deve ser tratada como fase futura, planejada e segura.

## 5. Principios Do Projeto

Todas as decisoes devem priorizar:

- clareza;
- seguranca;
- escalabilidade;
- coerencia arquitetural;
- manutenibilidade;
- simplicidade com qualidade profissional;
- baixo risco de regressao;
- separacao correta de responsabilidades;
- consistencia entre frontend, backend, banco e autenticacao.

O objetivo nao e apenas fazer funcionar. O objetivo e construir e evoluir um sistema profissional, seguro, organizado e sustentavel.

## 6. Regras Gerais De Implementacao

- respeitar a arquitetura existente;
- nao reestruturar o projeto inteiro sem necessidade explicita;
- evitar duplicacao de codigo;
- nao adicionar abstracoes desnecessarias;
- nao misturar regra de negocio com UI;
- nao misturar SQL diretamente em controllers quando for possivel refatorar com seguranca;
- nao expor segredos no codigo;
- usar variaveis de ambiente para dados sensiveis;
- validar variaveis obrigatorias no boot;
- validar entradas no backend;
- validar formularios no frontend quando aplicavel;
- proteger rotas administrativas;
- preservar consistencia entre frontend, backend, banco e autenticacao;
- nao renomear, remover ou reestruturar arquivos criticos sem necessidade explicita;
- sempre considerar impacto tecnico antes de alterar algo;
- preservar funcionalidades existentes;
- evitar mudancas grandes sem testes ou plano claro;
- priorizar refatoracao incremental.

## 7. Backend Atual Em Express

Enquanto o backend estiver em Express e JavaScript:

- manter controllers o mais enxutos possivel;
- mover regras de negocio para services quando fizer sentido;
- mover acesso ao banco para repositories quando houver refatoracao;
- centralizar validacoes;
- evitar SQL espalhado em multiplos pontos;
- usar queries parametrizadas;
- manter transacoes em fluxos criticos;
- padronizar tratamento de erros;
- nao retornar dados sensiveis;
- nao expor `password_hash`, refresh token ou informacoes internas;
- manter logs sem dados sensiveis;
- proteger rotas com autenticacao e autorizacao;
- preservar as regras de roles `admin` e `operador`.

Estrutura recomendada para refatoracao gradual:

```text
back-end/src/
|-- config/
|-- modules/
|   |-- auth/
|   |   |-- auth.routes.js
|   |   |-- auth.controller.js
|   |   |-- auth.service.js
|   |   |-- auth.repository.js
|   |   `-- auth.validation.js
|   |-- agendamentos/
|   |-- veiculos/
|   |-- produtos/
|   |-- funcionarios/
|   `-- usuarios/
|-- middlewares/
|-- shared/
|   |-- db/
|   |-- errors/
|   |-- validation/
|   `-- security/
`-- server.js
```

Essa separacao prepara o projeto para uma possivel migracao futura para NestJS, sem forcar essa migracao agora.

## 8. Backend Futuro Em NestJS

Em uma futura migracao para NestJS:

- controllers devem ser finos;
- services devem conter regras de negocio;
- repositories ou Prisma Services devem centralizar acesso ao banco;
- DTOs devem validar entrada;
- Guards devem proteger autenticacao e roles;
- Pipes devem validar dados;
- Filters devem padronizar erros;
- `ConfigModule` deve validar variaveis de ambiente;
- Prisma deve representar o modelo relacional com clareza;
- migrations devem ser seguras e versionadas;
- Swagger/OpenAPI deve documentar contratos da API.

Estrutura futura sugerida:

```text
apps/backend/
|-- src/
|   |-- modules/
|   |   |-- auth/
|   |   |-- agendamentos/
|   |   |-- veiculos/
|   |   |-- clientes/
|   |   |-- servicos/
|   |   |-- pagamentos/
|   |   |-- produtos/
|   |   |-- estoque/
|   |   `-- usuarios/
|   |-- common/
|   |   |-- decorators/
|   |   |-- filters/
|   |   |-- guards/
|   |   |-- interceptors/
|   |   `-- errors/
|   |-- config/
|   |-- prisma/
|   `-- main.ts
|-- prisma/
|   |-- schema.prisma
|   `-- migrations/
`-- package.json
```

## 9. Banco De Dados

O banco atual usa PostgreSQL com SQL manual e migrations manuais. Ao alterar o banco:

- preservar integridade relacional;
- usar nomes consistentes;
- usar constraints sempre que possivel;
- usar foreign keys corretamente;
- usar indices para consultas frequentes;
- evitar alteracoes destrutivas sem plano;
- manter migrations claras;
- evitar alterar dados diretamente sem backup ou validacao;
- padronizar `created_at`, `updated_at` e, se necessario, `deleted_at`;
- usar `BOOLEAN` em vez de `SMALLINT` para campos de ativo/inativo quando possivel;
- usar constraints para valores positivos em dinheiro, quantidade e estoque;
- nao remover colunas ou tabelas sem analisar impacto no frontend, backend e historico.

Tabelas atuais conhecidas:

- `admins`;
- `refresh_tokens`;
- `audit_logs`;
- `solicitacoes_acesso`;
- `funcionarios`;
- `veiculos`;
- `agendamentos`;
- `pagamentos`;
- `produtos`;
- `contatos`.

Possiveis evolucoes futuras:

- `clientes`;
- `servicos`;
- `estoque_movimentacoes`;
- `password_reset_tokens`;
- `user_invites`;
- `schema_migrations`.

Regras importantes do dominio:

- agendamento nao e receita financeira;
- pagamento so deve ser gerado quando o servico for concluido;
- um agendamento concluido nao pode gerar pagamento duplicado;
- veiculo deve manter historico dos servicos;
- acoes destrutivas devem respeitar permissoes;
- operador nao deve executar acoes administrativas sensiveis;
- o ultimo admin ativo nao deve ser excluido, desativado ou rebaixado.

## 10. Autenticacao E Seguranca

Autenticacao e autorizacao sao partes criticas do projeto. Sempre priorizar:

- JWT access token com tempo curto;
- refresh token em cookie `httpOnly`;
- refresh token salvo com hash no banco;
- rotacao ou revogacao segura de refresh token;
- logout revogando sessao;
- CORS restrito em producao;
- `helmet` configurado corretamente;
- rate limit em login e formularios publicos;
- senha forte para painel administrativo;
- validacao obrigatoria de secrets no boot;
- logs sem credenciais ou tokens;
- protecao contra enumeracao de usuarios;
- mensagens de erro seguras;
- controle de roles;
- protecao de rotas administrativas.

Pontos de atencao do projeto atual:

- evitar salvar access token em `sessionStorage` se houver alternativa mais segura;
- nao coletar senha na solicitacao publica de acesso;
- preferir fluxo de convite para definicao de senha;
- nao deixar `CORS_ORIGINS` aberto em producao;
- validar `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` e demais variaveis obrigatorias;
- manter `back-end/src/config/env.js` atualizado quando novas variaveis criticas forem adicionadas;
- revisar uso de CDN e politica CSP;
- ampliar audit log para acoes criticas.

Fluxo ideal para solicitacao de acesso:

1. usuario solicita acesso sem informar senha;
2. admin aprova ou recusa;
3. se aprovado, o sistema gera convite/token temporario;
4. usuario define a senha em fluxo seguro;
5. senha e hasheada;
6. convite e invalidado apos uso ou expiracao.

## 11. Frontend Atual

Enquanto o frontend estiver em HTML, CSS e JavaScript puro:

- manter separacao entre site publico e painel admin;
- centralizar chamadas de API no `apiClient.js`;
- evitar duplicar logica de requisicao;
- evitar `innerHTML` quando houver risco de XSS;
- usar helpers de sanitizacao quando precisar renderizar conteudo dinamico;
- manter consistencia visual entre paginas;
- validar formularios antes de enviar;
- nao confiar apenas na validacao do frontend;
- tratar erros de API de forma clara;
- preservar regras de permissao visuais, mas nunca depender apenas delas;
- garantir que acoes bloqueadas no frontend tambem sejam bloqueadas no backend.

Problemas a evitar:

- estado espalhado;
- manipulacao excessiva de DOM sem padrao;
- duplicacao de funcoes entre paginas;
- `alert` e `confirm` em excesso;
- logica de negocio no frontend;
- dados sensiveis no navegador;
- dependencia excessiva de CDN.

## 12. Frontend Futuro Em Next.js

Em uma futura migracao para Next.js:

- usar tipagem forte;
- separar paginas, componentes, services, schemas e types;
- usar React Hook Form para formularios;
- usar Zod para validacao;
- usar TanStack Query para requisicoes e cache;
- centralizar camada de API;
- proteger rotas administrativas;
- criar layouts reutilizaveis;
- manter componentes pequenos e claros;
- nao colocar regra de negocio de backend no frontend;
- preservar contratos de API;
- tratar loading, empty state e error state;
- manter UI consistente e profissional.

Estrutura sugerida:

```text
apps/frontend/
|-- src/
|   |-- app/
|   |   |-- (public)/
|   |   `-- (admin)/
|   |-- components/
|   |-- features/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- agendamentos/
|   |   |-- veiculos/
|   |   |-- produtos/
|   |   `-- funcionarios/
|   |-- lib/
|   |-- services/
|   |-- schemas/
|   `-- types/
```

## 13. Regras De Negocio

As regras de negocio devem ficar no backend.

Regras centrais:

- agendamento pode ser criado como pendente;
- agendamento pode ser confirmado;
- agendamento pode ser reagendado;
- agendamento pode ser cancelado;
- agendamento pode ser concluido;
- ao concluir, deve gerar pagamento;
- pagamento nao pode ser duplicado para o mesmo agendamento;
- agendamento concluido nao deve ser cancelado sem regra explicita;
- veiculos devem manter historico;
- dashboard financeiro deve considerar pagamentos reais, nao previsoes;
- operador tem permissoes limitadas;
- admin tem permissoes administrativas;
- ultimo admin ativo deve ser protegido;
- estoque deve impedir inconsistencias de quantidade;
- acoes criticas devem gerar auditoria.

Sempre que uma regra for implementada, deve ser explicado:

- onde ela foi aplicada;
- por que pertence ao backend;
- quais impactos tem no frontend;
- quais validacoes sao necessarias;
- quais testes deveriam cobrir essa regra.

## 14. Testes E TDD

Antes de refatorar partes sensiveis, priorizar testes.

Fluxos criticos iniciais:

- login com credenciais validas;
- login com senha invalida;
- login de usuario desativado;
- refresh token valido;
- refresh token revogado;
- logout revogando sessao;
- operador nao pode excluir;
- admin pode executar acoes sensiveis;
- nao pode excluir ultimo admin ativo;
- nao pode rebaixar ultimo admin ativo;
- criar agendamento publico;
- criar agendamento interno;
- concluir agendamento gera pagamento;
- concluir agendamento duas vezes nao duplica pagamento;
- cancelar agendamento concluido deve ser bloqueado;
- validacao de e-mail, telefone, data e valor;
- criacao de solicitacao de acesso;
- aprovacao de solicitacao de acesso;
- estoque nao deve aceitar quantidade negativa.

Estrategia recomendada:

- testar comportamento atual antes de refatorar;
- refatorar mantendo testes verdes;
- para novas features, escrever teste antes quando possivel;
- usar testes unitarios para services;
- usar testes de integracao para rotas criticas;
- usar banco de teste isolado;
- rodar testes antes de merge/deploy.

Ferramentas no backend atual:

- `node:test`;
- Supertest;
- PostgreSQL de teste;
- fixtures/factories.

Ferramentas futuras em NestJS:

- Jest;
- Supertest;
- Prisma test database.

## 15. Deploy

Ao lidar com deploy, sempre considerar:

- variaveis de ambiente obrigatorias;
- secrets fortes;
- CORS correto;
- build do frontend;
- conexao segura com banco;
- migrations em producao;
- backup do banco;
- logs sem dados sensiveis;
- ambiente de producao separado do desenvolvimento;
- dominio e HTTPS;
- cookies com `secure` e `sameSite` adequados;
- health check da API;
- plano de rollback;
- estabilidade antes de novas features.

Antes de deploy final, validar:

- `DATABASE_URL`;
- `PORT`;
- `NODE_ENV`;
- `ACCESS_TOKEN_SECRET`;
- `REFRESH_TOKEN_SECRET`;
- `JWT_SECRET`, se ainda existir;
- `CORS_ORIGINS`;
- `COOKIE_SECRET`, se usado.

## 16. Formato Esperado Das Respostas Tecnicas

Sempre que houver implementacao, revisao ou alteracao, usar este formato:

1. Plano de implementacao

- o que sera feito;
- por que sera feito;
- quais partes do sistema serao impactadas;
- quais riscos existem;
- se ha necessidade de migration, teste ou ajuste de variavel de ambiente.

2. Alteracoes realizadas

- listar claramente o que foi implementado ou alterado.

3. Explicacao tecnica detalhada

- arquitetura;
- backend;
- banco;
- autenticacao, se aplicavel;
- regras de negocio;
- integracao com frontend;
- seguranca;
- impacto em manutencao;
- possiveis melhorias futuras.

4. Arquivos alterados

- informar os arquivos criados ou modificados.

5. Testes recomendados

- indicar os testes que devem ser criados ou executados.

6. Commit sugerido

- sugerir uma mensagem de commit profissional.

Exemplos:

```text
refactor(auth): separate authentication business rules into service layer
feat(appointments): create payment record when appointment is completed
fix(security): restrict production CORS origins
test(auth): add coverage for login and refresh token flow
```

## 17. Regras Finais

Nao basta entregar codigo funcionando. O codigo deve ser:

- profissional;
- seguro;
- organizado;
- escalavel;
- testavel;
- coerente com a arquitetura do projeto;
- alinhado com boas praticas de backend, banco, autenticacao e deploy.

Sempre que houver uma decisao tecnica importante, o motivo deve ser explicado. Sempre que houver risco, ele deve ser apontado. Sempre que houver uma forma mais profissional de fazer, ela deve ser sugerida. Sempre que houver uma solucao simples e suficiente, ela deve ser priorizada em vez de complexidade desnecessaria.

O projeto atual deve evoluir com seguranca: primeiro estabilizar, depois testar, depois refatorar, depois migrar stack se realmente fizer sentido.
