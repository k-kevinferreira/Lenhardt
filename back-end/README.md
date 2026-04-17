# Backend

API REST do sistema Lenhardt Detailing.

## Stack

- Node.js
- Express
- PostgreSQL
- JWT
- `bcryptjs`

## Estrutura

```text
back-end/
|-- migrations/
|-- src/
|   |-- config/         # conexao com banco
|   |-- controllers/    # regras por modulo
|   |-- middleware/     # autenticacao
|   |-- routes/         # definicao das rotas
|   `-- utils/          # validacoes e helpers
|-- package.json
`-- .env
```

## Scripts

```powershell
npm install
npm run dev
npm start
npm run create-admin -- email@empresa.com senha123
npm run db:check
npm run migrate
npm test
```

## Variaveis de Ambiente

Arquivo: `.env`

Campos principais:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `NODE_ENV`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`

Opcional para conexao sem `DATABASE_URL`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DB_POOL_MAX`

## Autenticacao

### Modelo

- login gera `accessToken`
- `refresh_token` e salvo em cookie `httpOnly`
- rotas protegidas exigem header `Authorization: Bearer <token>`
- refresh rotaciona o token anterior

### Arquivos centrais

- `src/controllers/auth.controller.js`
- `src/middleware/auth.js`
- `src/routes/auth.routes.js`

## Migrations

As migrations ficam em `migrations/`.

Leia e execute em ordem:

- `migrations/README.md`

## Modulos da API

### Auth

- login
- refresh
- logout
- leitura do usuario autenticado
- listagem e decisao de solicitacoes de acesso
- listagem de usuarios admin
- criacao de usuario admin
- troca de senha
- ativacao e desativacao
- alteracao de perfil de acesso
- exclusao

### Publico

- contato do site
- solicitacao publica de agendamento
- solicitacao publica de acesso

### Admin

- dashboard
- agendamentos
- veiculos
- produtos
- funcionarios

## Validacoes

As validacoes basicas ficam em:

- `src/utils/validation.js`

Hoje o backend ja valida:

- e-mail
- telefone
- placa
- tamanho basico de strings
- datas

## Observacoes Operacionais

- apos alterar rotas ou controllers, reinicie o backend
- se uma funcionalidade nova falhar apos deploy local, verifique primeiro se a migration correspondente foi aplicada
- se uma rota nova retornar `Cannot POST` ou `Cannot GET`, verifique se o processo Node ativo foi reiniciado
- no Render Postgres, prefira usar `DATABASE_URL`
