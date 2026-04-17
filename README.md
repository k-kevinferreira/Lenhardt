# Lenhardt Detailing

Sistema web para operação de uma estética automotiva, com site público e painel administrativo para agendamentos, veículos, estoque, funcionários, dashboard financeiro e gestão de usuários admin.

## Visão Geral

O projeto é dividido em:

- frontend público estático na raiz do projeto e em `src/`
- painel admin estático em `admin/`
- API Node.js/Express em `back-end/`
- banco PostgreSQL para persistência operacional

## Principais Funcionalidades

- site institucional com formulário público de contato
- solicitação pública de agendamento
- solicitação pública de acesso para operador, com aprovação administrativa
- login administrativo com JWT + refresh token
- perfis de acesso `admin` e `operador`
- exclusões operacionais restritas a `admin`
- dashboard com resumo financeiro
- gestão de agendamentos
- gestão de veículos
- gestão de estoque
- gestão de funcionários
- gestão de usuários admin pelo painel

## Tecnologias

- frontend: HTML, CSS e JavaScript puro
- backend: Node.js, Express
- banco: PostgreSQL
- autenticação: JWT + cookie `httpOnly` para refresh token
- segurança: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`
- auditoria mínima para login e gestão de usuários admin
- testes mínimos com `node:test`

## Estrutura do Projeto

```text
.
|-- admin/                # Painel administrativo
|   |-- *.html
|   |-- css/
|   `-- js/
|-- back-end/             # API e acesso ao banco
|   |-- migrations/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   `-- utils/
|   `-- package.json
|-- docs/                 # Documentação funcional e técnica
|-- src/                  # Assets e scripts do site público
`-- index.html            # Site público
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+ ou compatível
- um servidor estático para o frontend, como Live Server

## Configuração do Ambiente

### 1. Instalar dependências do backend

```powershell
cd back-end
npm install
```

### 2. Configurar variáveis de ambiente

Arquivo: `back-end/.env`

Exemplo:

```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/lenhardt_db

CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
NODE_ENV=development

ACCESS_TOKEN_SECRET=defina_um_segredo_forte
REFRESH_TOKEN_SECRET=defina_outro_segredo_forte
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
```

Opcional sem `DATABASE_URL`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=senha
DB_NAME=lenhardt_db
```

### 3. Criar banco e aplicar migrations

Leia: `back-end/migrations/README.md`

### 4. Subir o backend

```powershell
cd back-end
npm run dev
```

Ou:

```powershell
cd back-end
npm start
```

### 4.1. Rodar testes mínimos do backend

```powershell
cd back-end
npm test
```

### 5. Subir o frontend

Abra a raiz do projeto com um servidor estático.

Exemplo comum:

- site público em `http://127.0.0.1:5500/index.html`
- admin em `http://127.0.0.1:5500/admin/login.html`

## Deploy

### Vercel

- o frontend estático pode ser publicado na Vercel sem build
- as telas usam `meta[name="api-base"]` e saem com `content="/api"`
- se o backend ficar em outro domínio, troque esse valor nas páginas HTML para a URL pública da API

### Render

- o backend Node/Express está compatível com Render
- a recomendação é usar `Render Web Service` para a API e `Render Postgres` para o banco
- defina no Render: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` e `CORS_ORIGINS`
- em `CORS_ORIGINS`, informe os domínios exatos do frontend publicado, por exemplo `https://seu-projeto.vercel.app`
- o endpoint de saúde disponível para monitoramento é `/health`

### Supabase

- como o backend agora usa PostgreSQL, Supabase pode ser usado apenas como banco
- mesmo assim, a recomendação operacional deste projeto continua sendo `Vercel + Render + Render Postgres`

## Login Admin

O sistema não possui cadastro público de administrador.

Existe, porém, solicitação pública de acesso pela tela `admin/login.html`.
Esse fluxo gera uma solicitação pendente e, quando aprovada por um admin,
cria um usuário com perfil `operador`.

Você pode:

- criar via tela `Funcionários > + Novo Usuário`, se já estiver logado
- aprovar solicitações pendentes na tela `Funcionários`, se for `admin`
- criar via script do backend:

```powershell
cd back-end
npm run create-admin -- email@empresa.com senha123
```

## Manutenção

Quando houver mudança estrutural:

1. atualizar migrations, se houver mudança de banco
2. atualizar `docs/schema.md`
3. atualizar `docs/api.md`, se houver rota nova
4. atualizar `docs/fluxos.md`, se houver mudança de operação
5. reiniciar o backend local
