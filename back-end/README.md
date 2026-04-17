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
|   |-- config/         # conexão com banco
|   |-- controllers/    # regras por módulo
|   |-- middleware/     # autenticação
|   |-- routes/         # definição das rotas
|   `-- utils/          # validações e helpers
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

## Variáveis de Ambiente

Arquivo: `.env`

Campos principais:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `NODE_ENV`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`

Opcional para conexão sem `DATABASE_URL`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DB_POOL_MAX`

## Autenticação

### Modelo

- login gera `accessToken`
- `refresh_token` é salvo em cookie `httpOnly`
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

## Módulos da API

### Auth

- login
- refresh
- logout
- leitura do usuário autenticado
- listagem e decisão de solicitações de acesso
- listagem de usuários admin
- criação de usuário admin
- troca de senha
- ativação e desativação
- alteração de perfil de acesso
- exclusão

### Público

- contato do site
- solicitação pública de agendamento
- solicitação pública de acesso

### Admin

- dashboard
- agendamentos
- veículos
- produtos
- funcionários

## Validações

As validações básicas ficam em:

- `src/utils/validation.js`

Hoje o backend já valida:

- e-mail
- telefone
- placa
- tamanho básico de strings
- datas

## Observações Operacionais

- após alterar rotas ou controllers, reinicie o backend
- se uma funcionalidade nova falhar após deploy local, verifique primeiro se a migration correspondente foi aplicada
- se uma rota nova retornar `Cannot POST` ou `Cannot GET`, verifique se o processo Node ativo foi reiniciado
- no Render Postgres, prefira usar `DATABASE_URL`
