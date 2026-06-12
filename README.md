# TORQUE — E-commerce de equipamentos e acessórios para motociclistas

E-commerce **premium, responsivo (mobile-first)** construído com Next.js 15 (App
Router), TypeScript e Tailwind CSS. Nicho: capacetes, escapamentos, vestuário,
pneus, baús, óleos e acessórios para moto. Dados **mockados** (sem backend), com
uma camada de serviço assíncrona pronta para ser trocada por uma API real.

## Stack

| Camada            | Tecnologia                                  |
| ----------------- | ------------------------------------------- |
| Framework         | Next.js 15 (App Router, RSC, SSG)           |
| Linguagem         | TypeScript (strict)                         |
| Estilo            | Tailwind CSS v3 + design tokens próprios    |
| Estado global     | Zustand (carrinho, favoritos, auth, toasts) |
| Persistência      | `localStorage` (middleware `persist`)       |
| Fontes            | Archivo (display) + Inter (corpo) + JetBrains Mono |

## Como rodar (fullstack)

O projeto tem **dois apps**: o front (Next.js, este diretório) e a **API**
(`backend/`, Express + Prisma + SQLite). Suba os dois.

**1) Backend** (uma vez, depois `npm run dev`):

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev      # cria o SQLite e aplica o schema
npm run seed                # popula a partir do seed (reaproveita ../src/data)
npm run dev                 # API em http://localhost:4000/api
```

**2) Front** (outro terminal):

```bash
# na raiz do projeto
npm install
# .env.local já aponta para a API:
#   NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                 # loja em http://localhost:3000
npm run build && npm run start
npm run typecheck
```

> **Login demo:** `vfreitas664@gmail.com` / `torque123`
>
> **Imagens:** placeholders de `picsum.photos` / `placehold.co` (hosts liberados
> em `next.config.mjs`) — exigem conexão à internet.
>
> **CORS:** o backend libera `CORS_ORIGIN` (padrão `http://localhost:3000`).
> Rode o front nessa porta para as chamadas do navegador funcionarem.

## Arquitetura de pastas

```
src/
├─ app/                      # rotas (App Router)
│  ├─ page.tsx               # 3.1 Home
│  ├─ categoria/[slug]/      # 3.2 Catálogo / PLP (+ subcategorias)
│  ├─ busca/                 # 3.3 Busca (?q=)
│  ├─ produto/[slug]/        # 3.4 PDP (SSG + schema.org)
│  ├─ carrinho/              # 3.5 Carrinho
│  ├─ checkout/              # 3.6 Checkout multi-step (5 passos + confirmação)
│  ├─ login, cadastro,       # 3.7 Autenticação
│  │  recuperar-senha/
│  ├─ conta/                 # 3.8 Minha Conta (pedidos, endereços, dados)
│  ├─ favoritos/             # 3.9 Wishlist
│  ├─ ofertas/               # vitrine de ofertas
│  ├─ layout.tsx             # shell (header, footer, toasts, fontes, SEO)
│  └─ not-found.tsx          # 404
├─ components/
│  ├─ ui/                    # design system (Button, Input, Badge, Rating,
│  │                         #   Tabs, Accordion, Drawer/Modal, Carousel,
│  │                         #   Pagination, Skeleton, Toast, PriceBlock…)
│  ├─ layout/                # Header, Footer, MobileNav, SearchBox, Newsletter
│  ├─ home/                  # Hero, BenefitsBar, CategoryGrid, BrandStrip
│  ├─ product/               # ProductCard, Gallery, ProductDetail, Reviews…
│  ├─ catalog/               # ProductListing, FilterSidebar, PriceRange
│  ├─ cart/                  # CartLineItem, CouponField, OrderSummary
│  ├─ checkout/              # Stepper
│  └─ auth/                  # AuthShell
├─ data/                     # seed mockado (brands, categories, ~40 produtos,
│                            #   coupons, pedidos/usuário demo)
├─ services/                 # camada "API" assíncrona (catalog, shipping,
│                            #   coupon, cep, newsletter) — a UI nunca lê data/
│                            #   diretamente
├─ store/                    # Zustand (cart, wishlist, auth, toast)
├─ lib/                      # utils, format pt-BR, cart math, coupon, hooks
├─ config/                   # site.ts (marca, navegação, footer)
└─ types/                    # tipos de domínio (Product, Order, Coupon…)
```

## Funcionalidades implementadas

- **Carrinho global persistente** com contador no header e drawer/resumo.
- **Filtros** (marca, preço com slider, cor, tamanho, estoque, frete grátis,
  desconto) + **ordenação** + **paginação** + contador "Exibindo X de Y".
- **Busca** com autocomplete no header e página de resultados.
- **PDP** com galeria + zoom, troca de variante (cor/tamanho com troca de
  imagem), preço cheio + Pix + parcelamento, frete por CEP, abas, avaliações,
  relacionados e "vistos recentemente".
- **Checkout multi-step**: identificação → endereço (CEP automático) → frete
  (PAC/SEDEX/Expressa) → pagamento (Pix/cartão parcelado/boleto) → revisão →
  confirmação.
- **Cupons** (percentual e valor fixo): `TORQUE10`, `FRETEZERO`, `MOTO50`,
  `BEMVINDO`.
- **Cálculo de frete por CEP** mockado por região + faixa de valor.
- **Avaliações** (estrelas, distribuição, formulário).
- **Selos**: % OFF, frete grátis, últimas unidades, mais vendido, novidade,
  countdown de oferta.
- **Newsletter** funcional com feedback de sucesso.
- **Autenticação** mockada (login/cadastro/recuperação) + área "Minha Conta".
- **Favoritos** persistentes.
- **Responsividade real**: menu hambúrguer, filtros em drawer no mobile, grids
  reflowáveis, carrosséis com scroll-snap.
- **Estados** de loading (skeletons), vazio e erro em todas as listas.
- **Acessibilidade**: foco visível, navegação por teclado, `alt`, `aria-*`,
  respeito a `prefers-reduced-motion`.
- **SEO**: metadata por rota, Open Graph e **dados estruturados** schema.org
  (Store + Product).

## Design System

Tokens em `tailwind.config.ts` (cores, tipografia, espaçamento 4/8, raios,
sombras, breakpoints). Identidade: grafite editorial (`ink`) + acento "ignição"
(`flame`) reservado a CTAs/ofertas. Componentes consomem somente os tokens.

## Camada de dados / API

A UI fala com o backend exclusivamente pelos arquivos `src/services/*`
(`catalog`, `shipping`, `coupon`, `cep`, `newsletter`, `orders`), através do
cliente único `src/lib/api.ts` (injeta o JWT salvo no `localStorage`). Os dados
dinâmicos (produtos, busca, vitrines, carrinho, favoritos, pedidos, auth) vêm da
API/SQLite; **categorias e marcas** seguem como dados de referência estáticos em
`src/data` (espelham o banco) para navegação/breadcrumb/SSG.

Carrinho e favoritos são offline-first (localStorage) para visitantes e
sincronizam com o servidor ao logar (`SyncProvider` faz o merge). Veja
`backend/README.md` para a lista completa de endpoints.
# e-commerce
