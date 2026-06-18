# URL Shortener — Plano de Implementação (Fases)

Guia de execução do desafio. Cada fase entrega algo **demonstrável e validável** por si só.
Princípio: camadas verticais finas, sem overengineering. Persistência só quando o valor justifica.

---

## Fase 1 — API de encurtar + redirecionar (stateless)

**Objetivo:** provar o contrato da API sem nenhuma infra nem armazenamento.

- `POST /api/shorten` → gera shortCode (~7 alfanuméricos), valida URL (só http/https, senão 400),
  devolve o contrato completo `{ shortCode, shortUrl, originalUrl, createdAt, expiresAt }`.
- **Não armazena nada** — apenas monta e imprime a saída no response.
- Swagger/OpenAPI exposto pra validar entrada/saída.

**Validação:** chamar `POST /api/shorten` pelo Swagger e conferir o JSON de resposta.

---

## Fase 2 — Expiração + listagem

**Objetivo:** completar as regras de negócio dos endpoints "simples" (já com armazenamento mínimo em memória).

- Armazenamento em memória (`Map`) para suportar listagem e redirect.
- `GET /:code` → redirect 301; 404 se não existe; 410 se expirado.
- `expiresAt` opcional respeitado no redirect.
- `GET /api/urls` → lista (mais recentes primeiro). Contagem de cliques ainda 0/estática.

**Validação:** criar link, redirecionar no browser; criar link com expiração curta e ver virar 410; listar URLs.

---

## Fase 3 — Tracking de cliques + stats

**Objetivo:** registrar cliques e alimentar dados de analytics.

- No `GET /:code`, registrar clique: `referrer`, `user-agent`, `ip`, `timestamp`.
- `GET /api/urls` passa a mostrar contagem real.
- `GET /api/stats/:code` → `totalClicks`, `clicksByDay` (30 dias), `topReferrers`.

**Validação:** clicar várias vezes, consultar stats e ver os números/agrupamentos.

---

## Fase 4 — Persistência (SQLite)

**Objetivo:** sobreviver a restart. Trocar o `Map` por um store real.

- SQLite (zero setup, roda local, justificável pro escopo): tabelas `urls` e `clicks`.
- Sem mudar contratos — só a camada de armazenamento.

**Validação:** criar link, reiniciar o servidor, link e cliques continuam lá.

---

## Fase 5 — Página visual de analytics

**Objetivo:** o entregável visual e compartilhável.

- `GET /analytics/:code` → HTML simples: total de cliques, cliques por dia (tabela ou gráfico leve), top referrers.
- Consome `GET /api/stats/:code`. Sem framework de frontend pesado.

**Validação:** abrir no browser e ver os dados da Fase 3.

---

## Fase 6 — Testes + "roda com um comando" + README ✅ COMPLETA

**Objetivo:** fechar os não-funcionais.

✅ **Testes:** 28 testes passando (unitários + integração)
  - `test/url.test.ts` — 15 casos de validação de URL
  - `test/shorten.test.ts` — 4 casos de POST/redirect/listagem
  - `test/stats.test.ts` — 9 casos de tracking e agregações
  - Rodam com `npm test` em ~350ms

✅ **"Roda com um comando"**
  - Backend: `npm run dev` (port 3000, tsx watch, Swagger em /docs)
  - Frontend: `npm run dev:web` (port 5173, Vite HMR)
  - Ambos: `npm run dev:all` (lança os dois em paralelo)

✅ **README:** 
  - `README.md` com setup, como rodar, justificativa da stack
  - Documentação de endpoints (curl examples)
  - Estrutura de projeto
  - Banco de dados explicado
  - Decisões de design

✅ **TypeScript strict:** 
  - `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `exactOptionalPropertyTypes`
  - Sem warnings

---

## Decisões pendentes

1. **Stack** — justificar a escolha (ex.: Node/TypeScript + Fastify/Express).
2. **Ordem persistência vs. tracking** — manter tracking em memória antes do SQLite.
3. **Testes incrementais vs. no fim** — preferência por incrementais.
