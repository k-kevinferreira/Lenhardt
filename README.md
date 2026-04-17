# Lenhardt Detailing

Sistema web para operacao de uma estetica automotiva, com site publico e painel administrativo para agendamentos, veiculos, estoque, funcionarios, dashboard financeiro e gestao de usuarios admin.

## Visao Geral

O projeto e dividido em:

- frontend publico estatico na raiz do projeto e em `src/`
- painel admin estatico em `admin/`
- API Node.js/Express em `back-end/`
- banco PostgreSQL para persistencia operacional

## Principais Funcionalidades

- site institucional com formulario publico de contato
- solicitacao publica de agendamento
- solicitacao publica de acesso para operador, com aprovacao administrativa
- login administrativo com JWT + refresh token
- perfis de acesso `admin` e `operador`
- exclusoes operacionais restritas a `admin`
- dashboard com resumo financeiro
- gestao de agendamentos
- gestao de veiculos
- gestao de estoque
- gestao de funcionarios
- gestao de usuarios admin pelo painel

## Tecnologias

- frontend: HTML, CSS e JavaScript puro
- backend: Node.js, Express
- banco: PostgreSQL
- autenticacao: JWT + cookie `httpOnly` para refresh token
- seguranca: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`
- auditoria minima para login e gestao de usuarios admin
- testes minimos com `node:test`

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
|-- docs/                 # Documentacao funcional e tecnica
|-- src/                  # Assets e scripts do site publico
`-- index.html            # Site publico
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+ ou compativel
- um servidor estatico para o frontend, como Live Server

## Configuracao do Ambiente

### 1. Instalar dependencias do backend

```powershell
cd back-end
npm install
```

### 2. Configurar variaveis de ambiente

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

### 4.1. Rodar testes minimos do backend

```powershell
cd back-end
npm test
```

### 5. Subir o frontend

Abra a raiz do projeto com um servidor estatico.

Exemplo comum:

- site publico em `http://127.0.0.1:5500/index.html`
- admin em `http://127.0.0.1:5500/admin/login.html`

## Deploy

### Vercel

- o frontend estatico pode ser publicado na Vercel sem build
- as telas usam `meta[name="api-base"]` e saem com `content="/api"`
- se o backend ficar em outro dominio, troque esse valor nas paginas HTML para a URL publica da API

### Render

- o backend Node/Express esta compativel com Render
- a recomendacao e usar `Render Web Service` para a API e `Render Postgres` para o banco
- defina no Render: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` e `CORS_ORIGINS`
- em `CORS_ORIGINS`, informe os dominios exatos do frontend publicado, por exemplo `https://seu-projeto.vercel.app`
- o endpoint de saude disponivel para monitoramento e `/health`

### Supabase

- como o backend agora usa PostgreSQL, Supabase pode ser usado apenas como banco
- mesmo assim, a recomendacao operacional deste projeto continua sendo `Vercel + Render + Render Postgres`

## Login Admin

O sistema nao possui cadastro publico de administrador.

Existe, porem, solicitacao publica de acesso pela tela `admin/login.html`.
Esse fluxo gera uma solicitacao pendente e, quando aprovada por um admin,
cria um usuario com perfil `operador`.

Voce pode:

- criar via tela `Funcionarios > + Novo Usuario`, se ja estiver logado
- aprovar solicitacoes pendentes na tela `Funcionarios`, se for `admin`
- criar via script do backend:

```powershell
cd back-end
npm run create-admin -- email@empresa.com senha123
```

## Manutencao

Quando houver mudanca estrutural:

1. atualizar migrations, se houver mudanca de banco
2. atualizar `docs/schema.md`
3. atualizar `docs/api.md`, se houver rota nova
4. atualizar `docs/fluxos.md`, se houver mudanca de operacao
5. reiniciar o backend local
