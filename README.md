# Marketplace de NFTs

Implementação do desafio frontend de um marketplace de NFTs em React e TypeScript. O enunciado completo está em [`desafio.md`](desafio.md) e o layout no [Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

**Aplicação publicada:** https://jungle-gaming-nft-marketplace.leandrogoliv.dev.br/

Não há backend: APIs, autenticação, carteiras, pagamentos e eventos em tempo real são simulados na camada de rede com MSW, inclusive na versão publicada.

> Projeto em desenvolvimento. As seções marcadas como "em construção" são preenchidas conforme os fluxos são entregues.

## Stack

| Responsabilidade     | Tecnologia                                  |
| -------------------- | ------------------------------------------- |
| Interface            | React 19 + TypeScript                       |
| Build                | Vite                                        |
| Roteamento           | TanStack Router (rotas baseadas em arquivo) |
| Estado remoto        | TanStack Query                              |
| Cliente HTTP         | Axios                                       |
| Tempo real           | Socket.IO (`socket.io-client`)              |
| Estilização          | Tailwind CSS v4                             |
| Componentes          | shadcn/ui (base Radix)                      |
| Formulários          | React Hook Form + Zod                       |
| Mocking              | MSW + `@mswjs/socket.io-binding`            |
| Testes E2E e visuais | Playwright                                  |
| Testes unitários     | Vitest                                      |
| Auditoria            | Lighthouse                                  |

## Requisitos

- Node.js 24
- pnpm 12 (a versão exata está no campo `packageManager` do `package.json`)

## Setup

```bash
pnpm install
pnpm dev
```

A aplicação sobe em http://localhost:3000 com os mocks ligados. Nenhuma variável de ambiente é necessária.

Para rodar os testes E2E pela primeira vez, instale o navegador do Playwright:

```bash
pnpm exec playwright install chromium
```

## Comandos

| Comando            | O que faz                                                              |
| ------------------ | ---------------------------------------------------------------------- |
| `pnpm dev`         | Servidor de desenvolvimento com mocks, na porta 3000                   |
| `pnpm build`       | Build de produção em `dist/`                                           |
| `pnpm preview`     | Serve o build de produção localmente                                   |
| `pnpm typecheck`   | Verificação de tipos                                                   |
| `pnpm lint`        | ESLint                                                                 |
| `pnpm check`       | Verifica a formatação com Prettier                                     |
| `pnpm format`      | Aplica Prettier e as correções automáticas do ESLint                   |
| `pnpm test`        | Testes unitários (Vitest)                                              |
| `pnpm test:e2e`    | Testes Playwright contra o build de produção, em desktop e mobile      |
| `pnpm test:e2e:ui` | Testes Playwright no modo interativo                                   |
| `pnpm lighthouse`  | Auditoria Lighthouse (requer `pnpm build` antes); mediana de 3 rodadas |

O relatório HTML do Playwright é gerado em `playwright-report/` e os traces das falhas em `test-results/`. Os relatórios do Lighthouse ficam em `lighthouse-reports/`.

## Variáveis de ambiente

Todas são opcionais. Para sobrescrever, copie `.env.example` para `.env.local`.

| Variável            | Padrão              | Função                            |
| ------------------- | ------------------- | --------------------------------- |
| `VITE_API_URL`      | `/api`              | Base das chamadas REST            |
| `VITE_SOCKET_URL`   | origem da aplicação | Origem do Socket.IO               |
| `VITE_SOCKET_PATH`  | `/realtime/`        | Caminho do Socket.IO              |
| `VITE_ENABLE_MOCKS` | ligado              | `false` desliga a camada de mocks |

## Mocks

Os mocks são ativados por configuração e fazem parte do build de demonstração. As chamadas REST são interceptadas pelo service worker do MSW; os eventos em tempo real passam pelo `socket.io-client` e são interceptados pelo MSW com o binding de Socket.IO, usando apenas o transporte WebSocket.

### Credenciais fictícias

Em construção.

### Seleção e reset de cenários

Em construção.

### Como reproduzir os fluxos de falha

Em construção.

## Estrutura

```
src/
├── components/   # componentes; ui/ contém os primitivos do shadcn/ui
├── hooks/        # hooks de dados (TanStack Query) e de interface
├── services/     # chamadas REST via Axios
├── types/        # contratos REST e de eventos
├── schemas/      # schemas Zod dos formulários
├── utils/        # lógica pura
├── lib/          # configuração: ambiente, clientes Axios, query client, socket
├── routes/       # rotas baseadas em arquivo
└── mocks/        # handlers MSW, fixtures, cenários e simulação de Socket.IO
e2e/              # testes Playwright
scripts/          # auditoria Lighthouse
```

## Qualidade e integração contínua

- Antes de cada `git push`, um hook roda a verificação de tipos e o lint.
- Em pull requests e na `main`, o GitHub Actions roda os testes unitários e E2E; o merge depende desse resultado.

## Deploy

Publicado na Vercel a partir da `main`. O arquivo `vercel.json` redireciona todas as rotas para a aplicação, para que acesso direto e refresh funcionem.

## Documentação de arquitetura

Contratos REST e de eventos, política de sessão, estado do carrinho, estratégia de cache e reconciliação entre REST e Socket.IO serão registrados em `ARCHITECTURE.md` conforme os fluxos forem entregues.
