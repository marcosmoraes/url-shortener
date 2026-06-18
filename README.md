# URL Shortener

Um serviço de encurtamento de URLs com tracking de cliques e página visual de analytics.

## Stack

- **Backend:** TypeScript + Fastify (strict mode) + better-sqlite3
- **Frontend:** React 19 + Vite
- **Testes:** Vitest (unitários + integração)

**Justificativa:**
- **Fastify:** servidor rápido, suporte nativo a schemas OpenAPI, sem overhead
- **better-sqlite3:** zero setup, síncrono (simplifica código async), ideal pra escopo pequeno
- **React + Vite:** frontend moderno, HMR instantâneo, bundle otimizado
- **TypeScript strict:** tipagem total, detecta erros em desenvolvimento

## Instalação

```bash
npm install
```

## Como rodar

### Desenvolvimento (ambos backend + frontend)

```bash
npm run dev:all
```

Abre automaticamente:
- Backend (Swagger): `http://localhost:3000/docs`
- Frontend (Analytics): `http://localhost:5173`

### Backend apenas

```bash
npm run dev
# Swagger em http://localhost:3000/docs
```

### Frontend apenas

```bash
npm run dev:web
# http://localhost:5173 (proxy /api → backend)
```

## Testes

```bash
npm test
```

Executa 28 testes:
- **url.test.ts** — validação de URL (http/https)
- **shorten.test.ts** — POST /api/shorten, redirect 301/404/410, GET /api/urls
- **stats.test.ts** — tracking de cliques, agregações de stats

Todos em TypeScript strict mode, sem dependências externas além do vitest.

## Estrutura

```
src/
├── api/                       # Backend
│   ├── server.ts              # Bootstrap Fastify
│   ├── app.ts                 # Setup e rotas
│   ├── db.ts                  # SQLite schema + init
│   ├── repository.ts          # Camada de dados
│   ├── shortcode.ts           # Gerador de short code (7 chars)
│   ├── url.ts                 # Validação de URL
│   └── routes/
│       ├── shorten.ts         # POST /api/shorten
│       ├── redirect.ts        # GET /:code (tracking)
│       ├── urls.ts            # GET /api/urls
│       └── stats.ts           # GET /api/stats/:code
└── web/                       # Frontend
    ├── main.tsx               # Entry React
    ├── Analytics.tsx          # Componente principal
    ├── Analytics.css          # Styles
    └── index.html             # Template Vite

test/                          # Testes (Vitest)
├── url.test.ts
├── shorten.test.ts
└── stats.test.ts

data.db                        # SQLite (gerado, não commitado)
```

## API Endpoints

### Criar short link

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "expiresAt": "2026-12-31T00:00:00.000Z"}'
```

Resposta:
```json
{
  "shortCode": "aBc1234",
  "shortUrl": "http://localhost:3000/aBc1234",
  "originalUrl": "https://example.com",
  "createdAt": "2026-06-18T...",
  "expiresAt": "2026-12-31T..." 
}
```

### Redirecionar

```bash
curl -L http://localhost:3000/aBc1234
# → 301 Moved Permanently para https://example.com
# Registra clique: referrer, user-agent, ip, timestamp
```

### Listar links

```bash
curl http://localhost:3000/api/urls
```

Retorna array de URLs (mais recentes primeiro) com contagem de cliques.

### Stats de um link

```bash
curl http://localhost:3000/api/stats/aBc1234
```

Resposta:
```json
{
  "shortCode": "aBc1234",
  "totalClicks": 42,
  "clicksByDay": [
    { "date": "2026-06-18", "count": 12 },
    { "date": "2026-06-19", "count": 30 }
  ],
  "topReferrers": [
    { "referrer": "https://google.com", "count": 25 },
    { "referrer": "direct", "count": 10 }
  ]
}
```

### Página de analytics (visual)

Abrir `http://localhost:5173` → digitar short code → ver gráficos e tabelas.

## Banco de dados

SQLite com duas tabelas:

**urls**
- `id` (PK autoincrement)
- `short_code` (UNIQUE, ~7 chars)
- `original_url`
- `created_at` (ISO 8601)
- `expires_at` (nullable, respeita em redirect)

**clicks**
- `id` (PK)
- `url_id` (FK → urls.id, ON DELETE CASCADE)
- `referrer` (nullable)
- `user_agent` (nullable)
- `ip`
- `created_at`

Schema aplicado automaticamente no boot; sem migrations manuais.

## Decisões de design

- **Sem auth:** escopo não incluía; validação só em input de URL
- **Sem rate limiting:** não era requisito; Fastify deixa extensível
- **Short code 7 chars:** ~62^7 ≈ 3.5e12 combinações, suficiente
- **Expiração em UTC ISO:** texto compara lexicograficamente, basta simples
- **Referrer vazio → "direct":** padrão de analytics
- **Stats últimos 30 dias:** agregação na query, sem tabela pré-computada

## Próximos passos (fora do escopo)

- Rate limiting (middleware Fastify)
- Autenticação (JWT ou OAuth)
- Custom domains
- Análise por geolocalização
- Integração com serviços de encurtamento públicos
