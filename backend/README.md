# TORQUE API — backend

API REST da loja TORQUE. **Express + TypeScript + Prisma (SQLite) + Zod**, em
camadas por módulo (`routes → controller → service → Prisma`), com middlewares de
validação (Zod), autenticação (JWT) e tratamento central de erros.

## Como rodar

```bash
cd backend
cp .env.example .env          # ajuste se quiser
npm install
npx prisma migrate dev        # cria o SQLite (dev.db) e aplica o schema
npm run seed                  # popula a partir do seed do front (../src/data)
npm run dev                   # http://localhost:4000/api  (tsx watch)
```

Outros scripts: `npm run build` (typecheck), `npm run start` (tsx), `npm run
prisma:reset` (recria o banco), `npm run typecheck`.

**Login demo:** `vfreitas664@gmail.com` / `torque123`

## Estrutura

```
src/
├─ server.ts / app.ts        # bootstrap + montagem das rotas /api/*
├─ env.ts                    # env validado por Zod
├─ lib/                      # prisma, jwt, errors, format, variants (mapper de eixos)
├─ middleware/               # auth (requireAuth/optionalAuth), validate(zod), error
└─ modules/<dominio>/        # routes + controller + service + schema + mapper
   products · categories · brands · home · shipping · coupons · cep ·
   newsletter · auth · account · orders · cart · wishlist
prisma/
├─ schema.prisma             # modelos (SQLite)
└─ seed.ts                   # importa ../src/data/* (reuso do seed do front)
```

## Endpoints (prefixo `/api`)

| Método | Rota | Auth | Descrição |
| ------ | ---- | ---- | --------- |
| GET | `/health` | — | healthcheck |
| GET | `/products` | — | lista com filtros/ordenação/paginação + `facets`/`priceBounds` |
| GET | `/products/:slug` | — | detalhe do produto |
| GET | `/products/:slug/related` | — | relacionados |
| GET | `/products/by-ids?ids=a,b` | — | resolve por ids (carrinho/vistos/busca) |
| POST | `/products/:slug/reviews` | opcional | publica avaliação e recalcula a nota |
| GET | `/home` | — | vitrines (ofertas, mais-vendidos, novidades, descontos) |
| GET | `/categories` · `/brands` | — | listas |
| POST | `/shipping/quote` | — | `{cep, subtotal}` → opções de frete |
| POST | `/coupons/apply` | — | `{code, subtotal}` → `{coupon, discount}` |
| GET | `/cep/:cep` | — | busca de endereço (mock) |
| POST | `/newsletter` | — | `{email}` |
| POST | `/auth/register` · `/auth/login` | — | → `{user, token}` + cookie httpOnly (rate-limited) |
| POST | `/auth/logout` | — | limpa o cookie de sessão |
| POST | `/auth/forgot-password` | — | gera token de reset (em dev, retorna `devToken`) |
| POST | `/auth/reset-password` | — | redefine a senha via token |
| GET | `/auth/me` | JWT | usuário atual |
| GET/PUT | `/account/profile` | JWT | dados pessoais |
| GET/POST/PUT/DELETE | `/account/addresses` | JWT | endereços |
| POST | `/orders` | opcional | cria pedido (recalcula totais no servidor) |
| GET | `/orders` · `/orders/:id` | JWT | pedidos do usuário |
| GET/PUT | `/cart` | JWT | carrinho do usuário |
| POST | `/cart/items` · PATCH · DELETE | JWT | mutações de item |
| POST | `/cart/merge` | JWT | mescla carrinho do visitante no login |
| POST | `/cart/resolve` | — | resolve itens do visitante em linhas |
| GET | `/wishlist` · POST/DELETE `/:id` · POST `/merge` | JWT | favoritos |
| GET | `/admin/stats` | **admin** | métricas do dashboard |
| GET/POST/PUT/DELETE | `/admin/products` (+`/:id`) | **admin** | CRUD de produtos (variantes/estoque/preços) |
| GET | `/admin/orders` · PATCH `/:id/status` | **admin** | listar pedidos / mudar status |
| GET/POST/PUT/DELETE | `/admin/coupons` (+`/:code`) | **admin** | CRUD de cupons |

> Rotas `/admin/*` exigem usuário com `role: "admin"` (middleware `requireAdmin`).
> O usuário-demo é admin. No front, o painel fica em **`/admin`** (link no menu
> "Minha conta" quando você é admin).

### Notas de negócio / segurança
- **Preços e totais nunca confiam no cliente**: `POST /orders` recarrega os
  produtos, valida estoque, reaplica cupom e frete, calcula o total (com desconto
  Pix quando Pix, parcelas quando cartão) e dá baixa no estoque.
- **Sessão em cookie httpOnly** (`torque_token`, `SameSite=Lax`, `Secure` em
  produção) — mitiga roubo de token por XSS. O header `Authorization: Bearer`
  também é aceito (clientes não-browser). CORS roda com `credentials: true` e
  reflete a origem permitida (`CORS_ORIGIN`, aceita `*` ou lista separada por vírgula).
- **Rate limiting** (`express-rate-limit`) nos endpoints de auth (20 req / 15 min / IP).
- **Senha forte**: mínimo 8 caracteres com ao menos um número (cadastro e reset).
- Frete/cupom/CEP replicam exatamente as regras do front (mesmas tabelas e limiares).
- O índice único do carrinho usa `""` para "sem variante" (NULLs são distintos em
  SQLite).

## Trocar SQLite por Postgres (futuro)
Basta alterar `datasource db { provider = "postgresql" }` e `DATABASE_URL`, depois
`prisma migrate dev`. Nenhuma mudança nos serviços/controllers é necessária.
