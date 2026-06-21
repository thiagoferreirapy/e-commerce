# TORQUE — App nativo (Capacitor)

App nativo (Android/iOS) da loja TORQUE usando [Capacitor](https://capacitorjs.com).
**Isolado nesta pasta `mobile/`** — tem seu próprio `package.json`/`node_modules` e os
projetos nativos, sem misturar com as dependências do site (Next) nem da API.

## Como funciona (importante)

A loja é um app **Next.js com SSR**. Por isso **não** é empacotada como site estático.
O Capacitor é usado no modo **"native shell"**: o app é uma WebView que abre o **site
Next rodando** (via `server.url`).

```
┌──────────── Celular ────────────┐        ┌──── Sua máquina / servidor ────┐
│  App nativo (Capacitor WebView)  │  HTTP  │  Next.js (front)  :3000        │
│  carrega  http://IP:3000  ───────┼───────▶│  Express (API)    :3001  /api  │
└──────────────────────────────────┘        └─────────────────────────────────┘
```

- O site/API precisa estar **acessível pelo celular** (IP na rede local em dev, ou URL
  pública/HTTPS em produção).
- Sem servidor acessível, o app mostra a tela de fallback (`mobile/www/`).

## Pré-requisitos

- **Node 20.6+**
- **Android**: [Android Studio](https://developer.android.com/studio) + SDK + **JDK 17**
- **iOS** (só em **macOS**): Xcode + CocoaPods — não dá para buildar iOS no Windows

## Estrutura (`mobile/`)

| Item | Caminho |
| ---- | ------- |
| Config do Capacitor | `mobile/capacitor.config.ts` |
| Fallback (offline) | `mobile/www/index.html` |
| Projeto Android | `mobile/android/` |
| Projeto iOS | gerado no Mac (`npx cap add ios`) |
| Dependências nativas | `mobile/package.json` |

`appId`: `com.torque.app` · `appName`: `TORQUE`

> O site (Next) e a API (Express) continuam fora desta pasta — em `e-commerce/` e
> `e-commerce/backend/`. Esta pasta só contém o **shell nativo**.

## Configuração (3 lugares que precisam casar)

Ao usar o IP da rede local, três coisas apontam para o **mesmo IP**:

1. **`mobile/capacitor.config.ts`** → `server.url` (o que o app abre).
   Padrão atual: `http://192.168.15.6:3000`. Sobrescreva com a env `CAP_SERVER_URL`.
2. **`../.env`** (front) → `NEXT_PUBLIC_API_URL=http://192.168.15.6:3001/api`
   (o celular precisa do IP, não `localhost`).
3. **`../backend/.env`** →
   - `CORS_ORIGIN="http://localhost:3000,http://192.168.15.6:3000"`
   - `PUBLIC_URL="http://192.168.15.6:3001"` (imagens enviadas no admin)
   - `PORT=3001`

> O backend lê o `.env` automaticamente (via `process.loadEnvFile`).

### Descobrir o IP (Windows)

```powershell
ipconfig
```
Use o **IPv4** da sua Wi-Fi (`192.168.x.x`). Se for diferente de `192.168.15.6`,
atualize os 3 lugares acima e rode `npm run sync` aqui.

## Rodar no Android (dev)

```bash
# Terminal 1 — API (na raiz do backend)
cd ../backend && npm run dev          # API em http://0.0.0.0:3001/api

# Terminal 2 — front acessível na rede (na raiz do front)
cd .. && npm run dev -- -H 0.0.0.0    # loja em http://IP:3000

# Terminal 3 — app (nesta pasta)
npm run android                        # = cap sync android && cap open android
```

1. Libere as portas **3000** e **3001** no firewall do Windows (a 1ª vez pergunta).
2. No Android Studio, **Run ▶** no emulador ou num celular (mesma Wi-Fi).
3. Apontar para outra URL: `set CAP_SERVER_URL=http://OUTRO_IP:3000` (PowerShell:
   `$env:CAP_SERVER_URL="..."`) antes de `npm run android`.

## Rodar no iOS (somente macOS)

```bash
cd mobile
npm install
npx cap add ios
export CAP_SERVER_URL=http://SEU_IP:3000
npm run ios
```

## Scripts (rodar dentro de `mobile/`)

| Script | O que faz |
| ------ | --------- |
| `npm run sync` | Copia config/assets para os projetos nativos |
| `npm run android` | Sincroniza **e** abre o Android Studio |
| `npm run ios` | Sincroniza **e** abre o Xcode (no Mac) |

Rode `npm run sync` após mudar `capacitor.config.ts`, plugins ou `CAP_SERVER_URL`.

## Produção

1. Deploy do front (Next) e da API (Express) com **HTTPS**.
2. Ajuste:
   - `CAP_SERVER_URL=https://loja.seudominio.com`
   - `../.env` → `NEXT_PUBLIC_API_URL=https://api.seudominio.com/api`
   - `../backend/.env` → `CORS_ORIGIN` incluindo `https://loja.seudominio.com`
3. `npm run sync` e gere o release:
   - **Android**: Android Studio → *Build > Generate Signed Bundle/APK* (AAB)
   - **iOS**: Xcode → *Product > Archive*

## Troubleshooting

| Sintoma | Causa / solução |
| ------- | --------------- |
| "Não foi possível conectar à loja" | App não alcança `server.url`. Confira IP, front com `-H 0.0.0.0` e firewall. |
| Tela branca | URL errada ou Next não está rodando. Rode `npm run sync` após mudar a URL. |
| Erros de CORS | Inclua `http://IP:3000` em `CORS_ORIGIN` (../backend/.env) e **reinicie a API**. |
| Imagens do admin não carregam | `PUBLIC_URL` precisa ser o IP (`http://IP:3001`). |
| Mudei de Wi-Fi e parou | O IP mudou. Atualize os 3 lugares e rode `npm run sync`. |
| `.env` não surte efeito | Reinicie o backend (lido na inicialização). |

## Resumo rápido (dev)

```bash
cd ../backend && npm run dev            # API
cd .. && npm run dev -- -H 0.0.0.0      # front na rede
cd mobile && npm run android            # app
```
IP atual: **192.168.15.6** (front `:3000`, API `:3001`).
