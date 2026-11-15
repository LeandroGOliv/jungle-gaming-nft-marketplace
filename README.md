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

O estado simulado (catálogo, usuários, carteiras, favoritos, carrinhos e pedidos) fica salvo no `localStorage` do navegador e sobrevive ao refresh. Detalhes do funcionamento e das limitações estão em [`ARCHITECTURE.md`](ARCHITECTURE.md#camada-de-mocks).

### Credenciais fictícias

| Usuário     | E-mail                     | Senha        | Perfil                                                                  |
| ----------- | -------------------------- | ------------ | ----------------------------------------------------------------------- |
| Nova Sato   | `nova@colecionador.test`   | `Kurio@2026` | Carteira principal na Polygon, 3 favoritos, 1 pedido confirmado         |
| Rafael Lima | `rafael@colecionador.test` | `Selva#2026` | Carteiras principal e secundária, 1 item no carrinho, 1 pedido recusado |

As senhas não ficam salvas em claro: os mocks guardam só o hash SHA-256 com salt. O navegador guarda apenas o token opaco da sessão, que vale 2 horas.

Para entrar, use "Entrar" no header (desktop) ou "Minha conta" na tab bar (mobile), ou abra qualquer tela com `?auth=entrar` (`?auth=cadastro` para criar uma conta). O login abre como modal sobre a tela atual; ao acessar uma tela privada (`/perfil`, `/carteiras`, `/pagamento`, `/pedidos/<id>`) sem sessão, ele abre sobre a Início e, depois de entrar, volta ao destino. No cadastro, `admin`, `kurio`, `suporte` e `root` são nomes de usuário reservados pela API, para exercitar um erro de validação vindo do servidor.

No perfil (`/perfil`), os mesmos nomes reservados valem para o nome de usuário, e a troca de senha recusa a senha atual incorreta com erro no campo. O avatar aceita PNG, JPEG ou WebP de até 2 MB.

### Seleção e reset de cenários

Há três formas de controlar a simulação, todas sobre o mesmo estado:

- **Página `/simulacao`**: mostra o estado atual e permite trocar de cenário, restaurar os dados, mudar a latência, derrubar as conexões em tempo real e disparar uma requisição de teste.
- **URL**: abra qualquer rota com `?scenario=<cenário>` e/ou `?latency=<latência>`, por exemplo `/?scenario=empty&latency=slow`. Os parâmetros são aplicados no carregamento e removidos da URL, para o refresh não repetir o reset.
- **Console ou testes**: `window.__mocks` expõe `reset()`, `selectScenario()`, `setLatency()`, `addFault()`, `setFaults()`, `setRealtimeAvailable()`, `updateNft()`, `emit()` e `expireSessions()`.

Trocar de cenário ou restaurar os dados volta integralmente ao estado inicial do cenário e descarta as falhas adicionadas. A latência escolhida é preservada no reset.

| Cenário            | O que acontece                                                                    |
| ------------------ | --------------------------------------------------------------------------------- |
| `default`          | Fixtures completas, rede saudável com latência de 200–400 ms                      |
| `empty`            | Nenhum NFT à venda; usuários e carteiras continuam disponíveis                    |
| `offline`          | Toda chamada à API falha por rede e o Socket.IO recusa conexões                   |
| `timeout`          | A API nunca responde; vale o timeout de 15 s do cliente HTTP                      |
| `server-error`     | Toda chamada à API responde 503                                                   |
| `flaky`            | As 3 primeiras chamadas respondem 503 (tentativa + 2 repetições); depois funciona |
| `short-session`    | Fixtures completas; a sessão expira 1 minuto após o login                         |
| `favorite-error`   | Fixtures completas; incluir ou remover favoritos responde 503                     |
| `wallet-error`     | Fixtures completas; o primeiro cadastro ou edição de carteira responde 503        |
| `order-refused`    | Carrinho pronto; o pagamento é recusado 2,5 s depois de criar o pedido            |
| `order-timeout`    | Carrinho pronto; o pedido é criado, mas a primeira resposta não chega (timeout)   |
| `order-pending`    | Carrinho pronto; o pedido fica pendente até ser decidido em `/simulacao`          |
| `order-disconnect` | Carrinho pronto; o Socket.IO cai com o pedido pendente e volta 5 s depois         |

| Latência       | Comportamento                                                                |
| -------------- | ---------------------------------------------------------------------------- |
| `none`         | Resposta imediata (padrão dos testes E2E)                                    |
| `default`      | Sorteio entre 200 e 400 ms com semente fixa: a sequência se repete           |
| `slow`         | 2,5 s fixos                                                                  |
| `variable`     | Sorteio entre 100 ms e 2,5 s com semente fixa                                |
| `out-of-order` | Alterna 1,5 s e 150 ms por endpoint: a resposta mais antiga chega por último |

### Como reproduzir os fluxos de falha

- **Sem conexão, timeout e erro 5xx**: abra `/simulacao`, aplique o cenário `offline`, `timeout` ou `server-error` e use "Enviar requisição", ou navegue pelas telas.
- **Falha transitória com recuperação**: aplique `flaky`; as primeiras chamadas falham e a nova tentativa funciona.
- **Respostas fora de ordem e carregamento lento**: escolha a latência `out-of-order` ou `slow`.
- **Erro HTTP pontual** (qualquer status 401, 403, 404, 409, 422, 500 ou 503 em um endpoint): pelo console, por exemplo `window.__mocks.addFault({ id: 'fav', method: 'POST', path: '/favorites', effect: { kind: 'http', status: 503 }, times: 1 })`.
- **Queda do tempo real**: em `/simulacao`, "Derrubar conexões" e depois "Restabelecer conexões".
- **Falha ao favoritar**: aplique `favorite-error`, entre e clique em "Favoritar" no detalhe de um NFT. O coração muda na hora, volta ao estado anterior quando a API recusa e o erro é anunciado. Volte ao cenário `default` para a mesma ação funcionar.
- **Sessão expirada durante a navegação**: entre, abra `/simulacao` e use "Expirar sessões" (ou aplique `short-session` e espere 1 minuto). A próxima tela privada, ou a volta à aba, pede login de novo com o aviso de sessão expirada, e depois do login o colecionador volta à tela em que estava.
- **Erros ao salvar carteira**: entre e abra `/carteiras`. Em "Editar", um código de indicação diferente de `KURIO2026`, `GREENMINT` ou `SELVA10`, ou o endereço da outra carteira, volta como erro da API no próprio campo. Com o cenário `wallet-error`, o primeiro "Salvar carteira" falha com 503 e o seguinte funciona.
- **Conflito de cadastro**: crie uma conta com `nova@colecionador.test` ou com o usuário `novasato`; o erro aparece no próprio campo.
- **Login social e recuperação de senha**: os botões avisam que não estão disponíveis, sem simular sucesso.

- **Pedido (compra completa, recusa, timeout, queda):** entre como Nova num dos cenários `order-*` (ou `checkout`, que confirma sozinho), abra `/pagamento`, conecte a MetaMask e clique em "Confirmar compra". O resultado abre em `/pagamento?pedido=<id>`. Em `order-timeout`, a confirmação aparece depois dos 15 s do timeout, com o mesmo pedido. Em `order-pending`, decida o pedido em `/simulacao` > "Pedidos pendentes" ou recarregue a página para ver que nenhuma outra compra é criada.

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

A política de sessão e os contratos de autenticação estão em [`ARCHITECTURE.md`](ARCHITECTURE.md#sessão-e-autenticação). Os demais contratos REST e de eventos, o estado do carrinho, a estratégia de cache e a reconciliação entre REST e Socket.IO entram no mesmo arquivo conforme os fluxos forem entregues.

## Desvio do Figma: avatar no header

O header do Figma não tem acesso ao perfil. Com sessão, o header mostra um círculo com o avatar do colecionador (ou as iniciais do nome de exibição) antes do "Sair", que leva a `/perfil` e reflete na hora os dados salvos. Os demais desvios estão em [`ARCHITECTURE.md`](ARCHITECTURE.md#desvios-do-figma).
