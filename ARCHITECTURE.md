# Arquitetura

Decisões de arquitetura, contratos e limitações da solução. As seções são preenchidas conforme os fluxos são entregues.

## Camada de mocks

Não há backend: a API REST e o Socket.IO são simulados com MSW no próprio navegador, em desenvolvimento, na versão publicada e nos testes. A camada fica inteira em `src/mocks/` e é carregada por import dinâmico em `main.tsx` quando `VITE_ENABLE_MOCKS` não é `false`. Componentes, hooks, services e clientes Axios não conhecem os mocks: falam com a API por HTTP e por `socket.io-client`, como fariam com um servidor real.

```
src/mocks/
├── browser.ts          # boot: cria o runtime, aplica ?scenario/?latency, inicia o worker
├── runtime.ts          # junta store, configurações, rede e tempo real; expõe window.__mocks
├── db.ts               # store único (MockStore): estado, persistência, versões e assinaturas
├── scenarios.ts        # cenários e seus dados iniciais
├── network.ts          # latência e regras de falha aplicadas a toda a API
├── realtime.ts         # hub Socket.IO: conexões, broadcast, queda e ponte com o store
├── errors.ts           # formato padrão de erro
├── password.ts         # hash das senhas
├── handlers.ts         # ordem dos handlers MSW
├── sessions.ts         # tokens, validade e resolução das sessões
├── handlers/           # handlers por recurso: auth e a API de controle da simulação
└── fixtures/           # NFTs, usuários, carteiras, favoritos, carrinhos, pedidos e cupons
```

### Store único

`MockStore` guarda um único estado (`MockDb`) com catálogo, usuários, sessões, carteiras, favoritos, carrinhos, pedidos e cupons. Os handlers REST e a simulação de Socket.IO leem e escrevem nesse mesmo objeto, então uma mudança aparece nos dois:

- toda escrita passa por `store.write()`, que persiste o estado e notifica os assinantes;
- dentro da escrita, `tx.touch(tipo, entidade)` incrementa a `version` e o `updatedAt` do recurso e o registra como alterado;
- `realtime.ts` assina o store e emite `nft.updated` para cada NFT alterado, com `eventId` derivado da versão e da época do reset (`evt_nft_<id>_v<versão>_<época>`), de modo que reemitir a mesma mudança gera uma duplicata reconhecível. A época entra porque o reset faz as versões recomeçarem, e um id não pode se repetir entre resets.

Os ids gerados na simulação vêm de um contador persistido (`store.nextId('ord')` → `ord_0003`), e os sorteios de latência vêm de um PRNG com semente. Por isso, a mesma sequência de ações produz sempre o mesmo resultado.

### Persistência e reset

O estado fica no `localStorage` em duas chaves:

- `nft-marketplace:mocks:db`: os dados;
- `nft-marketplace:mocks:settings`: o cenário, a latência, as falhas, a disponibilidade do tempo real e os contadores das regras de falha.

As duas carregam um número de versão: estado salvo em formato antigo, corrompido ou ilegível é descartado e o cenário é recriado a partir das fixtures. Se o storage estiver bloqueado, os mocks funcionam em memória.

O reset (`reset()` ou trocar de cenário) recria os dados a partir das fixtures, com cópia profunda, e restaura as falhas e o tempo real do cenário. O resultado é idêntico ao de um primeiro acesso. A latência escolhida é preservada, por ser condição de rede e não dado.

### Formato de erro

Toda resposta de erro da API usa o mesmo corpo, tipado em `src/types/api.ts` e montado por `apiErrorResponse()`:

```json
{
  "status": 422,
  "code": "VALIDATION_FAILED",
  "message": "Revise os dados informados.",
  "reason": "EMAIL_TAKEN",
  "fieldErrors": { "email": "E-mail já cadastrado." },
  "retryable": false
}
```

| Status | `code`                | Uso                                                          | `retryable` |
| ------ | --------------------- | ------------------------------------------------------------ | ----------- |
| 401    | `UNAUTHENTICATED`     | Sessão ausente, inválida ou expirada                         | não         |
| 403    | `FORBIDDEN`           | Recurso de outro usuário                                     | não         |
| 404    | `NOT_FOUND`           | Recurso inexistente                                          | não         |
| 409    | `CONFLICT`            | Conflito de estado (disponibilidade, cadastro, idempotência) | não         |
| 422    | `VALIDATION_FAILED`   | Dados inválidos; `fieldErrors` traz a mensagem por campo     | não         |
| 500    | `INTERNAL_ERROR`      | Falha inesperada                                             | sim         |
| 503    | `SERVICE_UNAVAILABLE` | Indisponibilidade transitória                                | sim         |

`code` é a categoria genérica, derivada do status. `reason` distingue casos de negócio dentro da mesma categoria (ex.: `EMAIL_TAKEN`, `OUT_OF_STOCK`), e cada fluxo documenta os seus. No cliente, `src/lib/http-error.ts` extrai esse corpo do erro do Axios e diferencia timeout e falta de conexão, que não têm resposta.

### Cenários, latência e falhas

Um cenário define os dados iniciais, a latência padrão, as regras de falha e se o tempo real aceita conexões. Os cenários gerais estão no [README](README.md#seleção-e-reset-de-cenários); os de cada recurso entram junto com os handlers dele.

O primeiro handler da lista (`createNetworkHandler`) intercepta toda chamada à API, aplica a latência e verifica as regras de falha. Sem falha, ele não responde, e a requisição segue para o handler do recurso. Uma regra (`FaultRule`) casa por método e caminho (padrão do MSW, relativo à base da API) e produz um destes efeitos:

- **`http`**: o status no formato padrão;
- **`network-error`**: erro de rede, sem resposta;
- **`timeout`**: a resposta nunca chega.

`skip` deixa passar as N primeiras requisições e `times` limita quantas vezes a falha se aplica. Os contadores persistem, então um refresh não reinicia a contagem.

A API de controle (`/api/__simulation`) fica isenta de latência e falhas, para a página `/simulacao` continuar operável em qualquer cenário. Já `GET /api/health` passa pela rede simulada e serve de sonda.

### Controle nos testes

Cada teste Playwright roda em um contexto de navegador novo, com `localStorage` e service worker próprios, então sempre parte do cenário padrão. O helper `e2e/support/mocks.ts` estende o `test` com a fixture `mocks`:

- `mocks.goto(path, { scenario, latency })` navega com `?scenario=` e `?latency=` (latência `none` por padrão) e espera o worker estar ativo;
- os demais métodos chamam `window.__mocks` via `page.evaluate`: `reset`, `setLatency`, `addFault`, `setFaults`, `setRealtimeAvailable`, `updateNft` (altera o store, reflete na REST e emite `nft.updated`) e `emit` (evento cru, para duplicatas e versões antigas);
- os eventos saem pelo Socket.IO simulado até o `socket.io-client` da aplicação, nunca por chamada direta à UI ou ao cache.

Como os atrasos usam `setTimeout` na página, `page.clock` controla a latência de forma determinística. Com o relógio pausado, porém, a UI também só atualiza quando o tempo avança, porque o TanStack Query agenda as notificações com `setTimeout`.

### Tempo real

O transporte é **WebSocket apenas**, no caminho `/realtime/`, interceptado pelo `@mswjs/socket.io-binding`. O hub em `realtime.ts`:

- registra cada conexão e lê o `auth` enviado pelo cliente no pacote CONNECT, que o binding não expõe; a leitura serve de base para filtrar eventos privados por usuário;
- envia o ping do Engine.IO a cada 20 s, que o binding não implementa;
- derruba as conexões e recusa novas quando o tempo real é desligado (cenário `offline` ou botão "Derrubar conexões"), para simular a queda e a reconexão.

### Limitações do ambiente de mocks

- **Long-polling**: o binding intercepta só WebSocket, não long-polling; o cliente é configurado com `transports: ['websocket']`.
- **Rooms, namespaces e heartbeat**: o binding não implementa nenhum dos três. Só o namespace `/` existe, o heartbeat é emulado pelo hub e eventos privados exigem filtrar as conexões pelo `auth`.
- **Uma aba por vez**: o estado é por navegador, sem sincronização entre abas; duas abas abertas sobrescrevem o `localStorage` uma da outra.
- **Primeira requisição**: o worker precisa estar ativo antes da primeira chamada, então a aplicação só monta depois de `worker.start()`. Em navegadores sem service worker (aba anônima de alguns navegadores, contexto inseguro), os mocks não funcionam.
- **Hash de senha**: as senhas são guardadas como SHA-256 com salt, suficiente para não ficarem em claro na simulação, mas não é um KDF adequado para produção.

## Layout e navegação

Toda tela é renderizada dentro de `AppShell` (`src/components/layout/`), montado na rota raiz: link "Pular para o conteúdo", header, tab bar mobile, `<main id="conteudo">` e footer. A rota inexistente usa o `notFoundComponent` da raiz, então a 404 também tem header, footer e o caminho de volta ao início.

### Grupos de rota

| Grupo            | Telas                                                       | Papel                                                                      |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `_public`        | Início, `/carrinho`, `/em-breve`, `/simulacao`              | Abertas a qualquer visitante                                               |
| `_authenticated` | `/perfil`, `/carteiras`, `/pagamento`, `/pedidos/$pedidoId` | Exigem sessão; sem ela, o guarda abre o login sobre a Início com o retorno |

Login e cadastro não são rotas: abrem como modal sobre a tela atual pelo parâmetro `auth` da rota raiz (ver [Sessão e autenticação](#sessão-e-autenticação)).

`/pedidos/$pedidoId` só redireciona para `/pagamento?pedido=<id>`: o recibo é o modal sobre o pagamento (ver [Pedido e confirmação](#pedido-e-confirmação)).

`/carrinho`, `/perfil`, `/carteiras`, `/pagamento` e `/pedidos/$pedidoId` nasceram como rotas reservadas ("em construção") para os links e guardas serem tipados desde já; cada tela substitui o componente na sua etapa.

### Opções por rota

Cada rota ajusta o layout pelo `staticData` (tipado em `src/router.tsx`, lido por `useLayoutOptions`); a rota mais interna que define uma opção vence:

- `navSection`: item do header destacado. O Figma destaca **Início** em Início, Login, Cadastro, Perfil e Carteiras, e **Mercado** no fluxo de compra (detalhe, carrinho, pagamento, confirmação). Sem valor (404, `/em-breve`), nenhum item fica destacado.
- `headerDivider`: o filete sob o header aparece em todas as telas, exceto nas do Mercado, como no Figma.
- `mobileTabBar`: no mobile, Detalhes e Carrinho trocam a tab bar pela barra de compra e pelo resumo de pagamento; essas telas desligam a opção.

### Responsividade

- **≥ 768 px**: header do Figma. Entre 768 e 1023 px o logo perde a caixa fixa de 160 px e o espaço entre os itens cai de 40 para 24 px, para caber em 720 px.
- **< 768 px**: o header some e a navegação passa à tab bar fixa, como no frame Mobile / Início, que não tem header. A tab bar vem logo depois do skip link na ordem de foco. A barra de busca mobile fica no topo da Início.
- **Coluna de conteúdo**: 1200 px com 120 px de margem em 1440, fluida abaixo disso com 24 px de respiro (`PageContainer`).

### Itens fora do escopo

Criadores, Aprenda, favoritos, os links editoriais, de suporte e de atividade do footer, e as coleções sem categoria correspondente nos dados (Arte 3D, Utilidade) levam a `/em-breve?secao=<id>`, que diz que a seção não faz parte da demonstração e oferece a volta ao início. A newsletter e o botão de leitura de QR code da tab bar não chamam a API: avisam, na própria interface e numa região viva, que não estão disponíveis e que nada foi feito. Redes sociais são links externos reais, em nova aba.

As coleções Arte digital, Fotografia e Música levam ao catálogo filtrado (`/?categoria=art|photography|music`). "Mercado" e a lupa do header levam à seção do catálogo da Início (`/#catalogo`).

### Estado na URL

| Rota        | Parâmetro              | Valores                                                    | Inválido ou ausente         |
| ----------- | ---------------------- | ---------------------------------------------------------- | --------------------------- |
| `/`         | `busca`                | texto não vazio (número digitado vira texto)               | descartado, sem busca       |
| `/`         | `categoria`            | `art`, `collectible`, `music`, `photography`, `gaming`     | descartado, sem filtro      |
| `/`         | `rede`                 | `ethereum`, `polygon`                                      | descartado, sem filtro      |
| `/`         | `precoMin`, `precoMax` | decimal em ETH (`0.92`); faixa invertida descarta os dois  | descartado, sem limite      |
| `/`         | `aba`                  | `novos`, `em-alta` (ausente = Todos os NFTs)               | descartado, todos           |
| `/`         | `ordem`                | `recentes` (padrão, omitido), `menor-preco`, `maior-preco` | descartado, recentes        |
| `/`         | `pagina`               | inteiro ≥ 1 (a 1 é omitida)                                | descartado, página 1        |
| `/em-breve` | `secao`                | ids de `OUT_OF_SCOPE_SECTION_IDS`                          | texto genérico "Esta seção" |
| qualquer    | `auth`                 | `entrar`, `cadastro`                                       | descartado, sem modal       |
| qualquer    | `motivo`               | `sessao-expirada`, `sessao-encerrada`                      | descartado, sem aviso       |
| qualquer    | `redirect`             | caminho interno                                            | descartado                  |

Mudar busca, filtro, aba ou ordenação remove `pagina` (`withFilters` em `src/utils/catalog-search.ts`); trocar de página preserva o resto (`withPage`). Os valores da URL são sempre texto: o router usa um `parseSearch` próprio com `URLSearchParams`, porque o padrão do TanStack lê `0.92` como número (mas não `8.00`) e grava strings numéricas entre aspas. Os schemas das rotas convertem o que precisa ser número (`pagina`).

`auth`, `motivo` e `redirect` são validados na rota raiz, então valem em qualquer tela. O `redirect` passa por `safeRedirect` (`src/utils/redirect.ts`): resolve o valor contra a origem da aplicação e só aceita o mesmo host, devolvendo o caminho normalizado. Checar o prefixo `/` não basta, porque o parser de URL trata `\` como `/` e descarta tab e quebra de linha (`/\evil.com` resolve para outro host).

### Item ativo e `aria-current`

O destaque da navegação segue a seção da rota, não só a URL exata (Mercado fica ativo em todo o fluxo de compra; "Minha conta" na tab bar cobre perfil, carteiras e login). O `Link` do TanStack marcaria `aria-current` só pela URL, então header e tab bar usam `NavLink` (`createLink`), que define `aria-current="page"` a partir do mesmo estado do destaque.

### Pontos de extensão

- `CartIndicator` recebe `count` e `isPending` (badge em skeleton); a consulta do carrinho passa a contagem.
- `AccountIndicator` lê a sessão: `pending` (skeleton), visitante (botão "Entrar", que abre o login sobre a tela atual) ou conectado (botão "Sair", com o nome do colecionador no nome acessível).
- `useAnnounce()` publica mensagens nas regiões vivas únicas do layout (`polite` e `assertive`), para feedback de mutations e de eventos em tempo real.
- `StateMessage` é o painel de 404, `/em-breve` e estados vazios ou de erro.
- O `Input` do shadcn/ui usa o placeholder na cor `secondary` (a dos campos do Figma) e foco sólido em `ring`. Na newsletter e na busca mobile ele fica embutido num contêiner que desenha o fundo, o raio e o foco (`focus-within`), como os campos compostos do Figma.
- O `Skeleton` do shadcn/ui usa shimmer com os tokens de superfície e fica parado com `prefers-reduced-motion`. Ele é `aria-hidden`: quem o usa anuncia o carregamento (`aria-busy` no contêiner ou texto `sr-only`).

## Sessão e autenticação

### Contratos REST

Todas as rotas ficam sob `VITE_API_URL` (`/api`), passam pela latência e pelas falhas do cenário e usam o [formato de erro](#formato-de-erro). Os tipos estão em `src/types/auth.ts`.

| Método e caminho     | Cliente           | Corpo           | Sucesso                                | Erros                                                                                          |
| -------------------- | ----------------- | --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `POST /auth/sign-up` | `publicClientApi` | `SignUpRequest` | 201 `AuthSession` (já entra na conta)  | 422 `fieldErrors` (formato, usuário reservado); 409 `EMAIL_TAKEN` ou `USERNAME_TAKEN` no campo |
| `POST /auth/login`   | `publicClientApi` | `LoginRequest`  | 200 `AuthSession`                      | 422 `fieldErrors`; 401 `INVALID_CREDENTIALS`, igual para e-mail inexistente e senha errada     |
| `GET /auth/session`  | `clientApi`       | —               | 200 `SessionInfo` (usuário e validade) | 401 `SESSION_EXPIRED` ou `SESSION_INVALID`                                                     |
| `POST /auth/logout`  | `clientApi`       | —               | 204, também para sessão já inexistente | —                                                                                              |

`AuthSession` traz o token opaco, `expiresAt` e o perfil público (`User`); o hash e o salt da senha nunca saem dos mocks. O cadastro valida no servidor as mesmas regras do formulário (usuário de 3 a 20 caracteres `a-z0-9._`, e-mail, senha de 8+ caracteres com letras e números) e mais uma que só ele conhece: usuários reservados (`admin`, `kurio`, `suporte`, `root`), para o cliente exibir um 422 vindo da API.

### Política de sessão

- **Token**: opaco, guardado no `localStorage` (`nft-marketplace:session`) para a sessão sobreviver ao refresh. Só o token fica no navegador; o perfil vem de `GET /auth/session`. A senha não é guardada em lugar nenhum do cliente.
- **Validade**: 2 h a partir do login, sem renovação. O cenário `short-session` reduz para 1 minuto, e "Expirar sessões" em `/simulacao` (ou `window.__mocks.expireSessions()`) vence todas na hora.
- **Dois clientes Axios** (`src/lib/http.ts`): `publicClientApi` não envia sessão; `clientApi` anexa `Authorization: Bearer <token>` e centraliza o 401. Um 401 só derruba a sessão se a requisição foi feita com o token atual: respostas atrasadas de uma sessão anterior são ignoradas.
- **Revalidação**: a consulta da sessão é chaveada pelo token (`['session', token]`) e fica fresca por 60 s, para não repetir a requisição logo após o login. O guarda das rotas privadas libera a navegação com a sessão em cache e a revalida em segundo plano a cada entrada (`staleTime` 0 na chamada do guarda); voltar à aba revalida sempre (`refetchOnWindowFocus: 'always'`). É assim que a expiração aparece durante a navegação. Por isso a tela privada pode aparecer por um instante antes de o 401 levar ao login; ela só mostra dados da sessão que acabou de expirar, do mesmo usuário.
- **401**: o handler registrado em `main.tsx` encerra a sessão local, limpa o cache privado e abre o login sobre o endereço mais recente, com `motivo` `sessao-expirada` ou `sessao-encerrada` (token que deixou de existir, como após um reset dos mocks). Numa rota privada, o guarda reavalia a rota e leva à Início com `redirect` para a tela onde o colecionador estava, sem os parâmetros do modal; depois do login, ele volta para lá.
- **Guarda**: `_authenticated` (`beforeLoad`) consulta a sessão; sem sessão, redireciona para `/?auth=entrar&redirect=<destino>`. Sem sessão em cache (acesso direto, refresh), a rota mostra um skeleton enquanto espera. Se a verificação falhar sem resposta (rede, timeout, 5xx), após uma repetição a rota mostra o erro com "Tentar novamente".
- **Logout**: encerra a sessão local na hora e avisa a API em seguida; uma falha de rede no `POST /auth/logout` não mantém ninguém conectado. Numa tela privada, volta à Início; "Você saiu da sua conta." sai na região viva.
- **Isolamento por usuário**: consultas privadas ficam sob `['user', userId, ...]`. Login, logout e troca de usuário removem essas consultas e as sessões de outros tokens do cache antes de a nova sessão aparecer.
- **Tempo real por sessão**: `RealtimeProvider` mantém uma conexão Socket.IO por token, enviado no `auth` do handshake. Entrar, sair ou trocar de usuário desconecta o socket anterior com todos os listeners e abre outro, então eventos da sessão anterior não chegam à nova. O servidor simulado registra o dono de cada conexão no handshake e o expõe em `getState().realtimeUsers`; como o registro não muda quando a sessão termina, um socket antigo esquecido continuaria aparecendo, e os testes usam isso para provar a troca. O `socket.io-client` é importado dinamicamente, depois do worker do MSW, porque o engine.io captura o `WebSocket` global ao carregar.

### Login e cadastro na interface

- **Modal pela URL**: `?auth=entrar` ou `?auth=cadastro` abre o modal sobre a tela atual. Acesso direto, refresh e histórico funcionam, e o visitante continua onde estava ao entrar. Fechar (X, Esc ou clique fora) remove os parâmetros. Com sessão ativa, o parâmetro é ignorado e o colecionador segue para o `redirect`.
- **Foco**: ao abrir, vai para o primeiro campo; fica preso no modal; ao fechar, volta a quem abriu. Se esse elemento sumiu (o "Entrar" vira "Sair" ao autenticar) ou o modal veio da URL, vai para o `<main>`. O retorno é feito no `onCloseAutoFocus`, porque o Radix guarda como foco anterior um elemento de dentro do modal quando o efeito de foco roda de novo, e o devolveria ao `<body>`.
- **Envio**: durante o envio, o botão fica com `aria-disabled` (não `disabled`, que tiraria o foco dele) e o formulário ignora novos envios. Os anúncios de sucesso saem do `onSuccess` dos hooks `useLogin`/`useSignUp`, que rodam mesmo com o formulário já desmontado.
- **Erros**: validação no cliente com Zod; `fieldErrors` da API (422 e 409) vão para os campos, com o primeiro focado. Credenciais inválidas, falta de conexão e 5xx viram um alerta do formulário (`role="alert"`). Cada mensagem fica associada ao campo por `aria-describedby`.
- **Regiões vivas no modal**: o Radix esconde o resto da página dos leitores de tela enquanto o modal está aberto, então os avisos do próprio modal usam uma região `role="status"` dentro dele, sempre montada.
- **Fora do escopo**: "Continuar com Google/Facebook" e "Esqueceu a senha?" não chamam a API nem simulam conexão; avisam, no modal, que não estão disponíveis na demonstração.

## Catálogo da Início

### Contrato REST

`GET /nfts` (`publicClientApi`, `src/services/nfts.ts`), tipos `NftListQuery` e `NftListResponse` em `src/types/nft.ts`.

| Parâmetro              | Valores                                                                                      | Padrão   |
| ---------------------- | -------------------------------------------------------------------------------------------- | -------- |
| `search`               | texto; casa nome, coleção e criador, sem diferenciar caixa e acento                          | —        |
| `category`             | `NftCategory`                                                                                | —        |
| `network`              | `BlockchainNetwork`                                                                          | —        |
| `minPrice`, `maxPrice` | decimal em ETH, limites inclusivos                                                           | —        |
| `featured`             | `true` para só os destaques da curadoria                                                     | —        |
| `tab`                  | `all`, `new` (até 60 dias antes da listagem mais recente), `trending` (`trendingScore` ≥ 70) | `all`    |
| `sort`                 | `recent`, `price-asc`, `price-desc` (desempate pelo id)                                      | `recent` |
| `page`, `pageSize`     | inteiros ≥ 1; `pageSize` até 48                                                              | 1, 9     |

A resposta traz `items`, `page`, `pageSize`, `total`, `totalPages` e `facets`: a contagem de cada categoria e rede aplicando todos os outros filtros menos o da própria dimensão (o número mostra o que a escolha devolveria) e a faixa de preço do catálogo inteiro, que limita o slider. Parâmetro inválido responde 422 com `fieldErrors`; página além do fim responde 200 com `items` vazio e o `total` real. As comparações de preço no mock usam `compareEth` (`src/utils/eth.ts`, BigInt em wei), nunca `Number`.

A URL (em português) vira essa query por `toNftListQuery`; o hook nunca lê a URL direto.

### Cache e cancelamento

- **Uma entrada por consulta.** A chave é `['nfts', 'list', query]` com a query inteira. A resposta de uma consulta antiga que chega depois (latência `out-of-order`) grava na própria entrada e nunca ocupa a da consulta atual.
- **Cancelamento.** O `queryFn` repassa o `signal` ao Axios. Quando a URL muda, a consulta anterior perde o observador e o TanStack Query aborta a requisição.
- **Sem "piscar".** `placeholderData: keepPreviousData` mantém a lista anterior na tela durante a troca de página ou filtro, com opacidade reduzida, uma barra de progresso e `aria-busy`. O skeleton aparece só no primeiro carregamento.
- **Frescor.** `staleTime` padrão de 30 s: voltar a uma combinação já vista mostra o cache na hora e revalida em segundo plano se o prazo passou. O catálogo é público, então as chaves não levam o usuário.
- **Falhas.** 5xx e falhas de rede têm 2 repetições automáticas (padrão do `QueryClient`). Sem dados, a grade dá lugar ao erro com "Tentar novamente"; com dados anteriores, a lista fica e um aviso com o mesmo botão aparece acima dela.
- **Região viva.** Cada resultado novo anuncia o total ("4 NFTs encontrados"); o carregamento inicial não anuncia.

### Decisões de UX

- Coleção e rede são de escolha única, como no Figma (o item ativo fica em `text-accent`); clicar nele de novo remove o filtro. Todas as dimensões combinam entre si.
- A faixa de preço só vale ao clicar em "Aplicar"; os extremos do slider valem como "sem limite" e não vão para a URL.
- As abas são links (`aria-current`), não `tablist`: recortam o catálogo pela URL e entram no histórico.
- Abaixo de 1024 px os filtros saem da sidebar para um bottom sheet. No mobile ele abre pelo botão ao lado da busca e inclui a ordenação; no tablet, por um botão "Filtros" ao lado da ordenação.
- "Explorar" do hero rola até o catálogo; o das promoções filtra pela coleção (`?busca=Genesis Drops`, `?busca=Curated Art`). "Ler mais" do blog leva a `/em-breve?secao=diario-da-cunhagem`.
- O card leva ao detalhe, `/nft/$nftId`.

## Detalhes do NFT

### Contratos REST

| Método e caminho           | Cliente           | Resposta                                                         | Erros                        |
| -------------------------- | ----------------- | ---------------------------------------------------------------- | ---------------------------- |
| `GET /nfts/:id`            | `publicClientApi` | `Nft`                                                            | 404 se o NFT não existe      |
| `GET /nfts/:id/related`    | `publicClientApi` | `NftRelatedResponse` (até 5 da mesma coleção, dos mais recentes) | 404 se o NFT não existe      |
| `GET /favorites`           | `clientApi`       | `FavoritesResponse` (`nftIds`)                                   | 401 sem sessão               |
| `PUT /favorites/:nftId`    | `clientApi`       | `FavoritesResponse`, a lista após incluir                        | 401; 404 se o NFT não existe |
| `DELETE /favorites/:nftId` | `clientApi`       | `FavoritesResponse`, a lista após remover                        | 401                          |

`PUT` e `DELETE` são idempotentes: favoritar duas vezes ou remover o que não está na lista também respondem 200. Os favoritos ficam no store dos mocks (`favorites[userId]`) e persistem com ele. `Nft` ganhou `summary`, a frase de "Sobre este NFT"; o store subiu para a versão 2 do esquema, então um estado salvo antes é descartado.

O cenário `favorite-error` faz `PUT` e `DELETE /favorites/:nftId` responderem 503. A edição esgotada e o NFT inexistente não precisam de cenário: as fixtures já têm edições com `available: 0` (ex.: 1/1 de Ivory Baron #088) e qualquer id desconhecido responde 404.

### Cache

- **Detalhe e relacionados** são públicos: `['nfts', 'detail', id]` e `['nfts', 'detail', id, 'related']`. O 404 não é repetido (regra geral de 4xx do `QueryClient`) e vira o estado "NFT não encontrado".
- **Favoritos** são privados: `['user', userId, 'favorites']`, sob a raiz que o login, o logout e a troca de usuário limpam. Para o visitante a consulta fica desligada.

### Atualização otimista dos favoritos

`useToggleFavorite` (`src/hooks/use-favorites.ts`):

1. **`onMutate`**: cancela a consulta de favoritos em andamento (a resposta dela sobrescreveria o valor otimista), guarda a lista atual e grava a nova no cache. O botão muda na hora.
2. **`onError`**: devolve a lista guardada ao cache e anuncia a falha na região viva `assertive`. Um 401 não é anunciado: o tratamento central já encerra a sessão e abre o login.
3. **`onSuccess`**: grava a lista devolvida pela API, que é a fonte da verdade, e anuncia a inclusão ou a remoção na região viva `polite`.
4. **`onSettled`**: revalida a lista.

Cliques seguidos geram mutations concorrentes. Só a última pendente escreve no cache (rollback, resposta e revalidação), para uma resposta antiga não desfazer o clique mais novo. A mutation não é repetida automaticamente.

### Decisões de UX

- **Edição:** as pílulas formam um grupo de rádio. A primeira edição com unidades à venda vem selecionada; a esgotada fica desabilitada, riscada e é anunciada como "esgotada". Abaixo, uma linha mostra "N de M disponíveis" ou "Esta edição está esgotada".
- **Quantidade:** inteira, de 1 ao disponível da edição selecionada, com os botões desabilitados nos limites. Volta a 1 ao trocar de edição e acompanha a disponibilidade se ela cair.
- **Favoritar como visitante:** abre o login com `redirect` para o próprio detalhe. Depois de entrar, o colecionador volta ao detalhe, sem favoritar automaticamente.
- **Compra:** "COMPRAR" (desktop) e "Comprar NFT" (mobile) incluem a edição e a quantidade selecionadas no carrinho e levam até ele. O botão de carrinho do mobile inclui e fica no detalhe. Uma recusa da API (ex.: passar do disponível) aparece abaixo dos botões, sem sair da página.
- **Avaliações:** a aba aparece como no Figma, mas desabilitada (`aria-disabled`), porque avaliações estão fora do escopo.
- **Compartilhar:** LinkedIn, e-mail e X abrem os links de compartilhamento reais dessas redes em nova aba, com a URL do detalhe.
- **Lupa:** amplia a imagem selecionada num diálogo.
- **Estados:** skeleton com as dimensões finais (mobile e desktop), 404 próprio, erro com "Tentar novamente" e, com dados já na tela, um aviso de falha na atualização acima do conteúdo, com `aria-busy` durante a revalidação. Os relacionados têm skeleton, erro com nova tentativa e vazio próprios.

## Carrinho

### Estado: visitante e usuário

O carrinho vive na API, nos dois casos; o navegador não guarda itens.

- **Visitante:** a primeira inclusão cria um carrinho de visitante na API, que devolve o id em `guestCartId`. O cliente guarda só esse id opaco (`src/lib/guest-cart.ts`, `localStorage`) e o envia no header `X-Cart-Id`. É isso que mantém o carrinho após o refresh. Um id que a API não conhece mais (ex.: depois de restaurar o cenário) é tratado como "sem carrinho", e a próxima inclusão cria outro.
- **Usuário:** com sessão, a API resolve o carrinho pelo token e ignora o `X-Cart-Id`.
- **Ao autenticar:** a primeira consulta do carrinho com sessão chama `POST /cart/merge` com o id do visitante. Para o mesmo NFT e edição, as quantidades se somam até o limite disponível. O cupom do visitante, se houver, substitui o do usuário. A API apaga o carrinho do visitante, e só depois da resposta o cliente descarta o id. Assim, uma falha ou um refresh no meio só repetem a mescla, que é idempotente.
- **No logout:** o carrinho da conta fica na conta (o cache privado é limpo), e o visitante recomeça com um carrinho vazio.

O carrinho não exige login (`desafio.md` só exige autenticação para checkout, perfil, carteiras, favoritos e pedidos). O "Conectar e finalizar" leva a `/pagamento`, cujo guarda abre o login.

### Cotação

`GET /cart/quote` é a referência de valores: subtotal, desconto, taxa de rede, total, situação do cupom e itens com problema de disponibilidade. Ela é recalculada a cada chamada a partir do catálogo e dos cupons atuais, nunca do que o cliente enviou. A interface só exibe esses números. O total de cada linha (`lineTotalEth`) também vem da API.

A cotação traz `cartVersion`, e a chave de cache inclui a versão do carrinho. Depois de qualquer alteração, a cotação da versão nova é buscada, e a anterior continua na tela, esmaecida e marcada como "Atualizando valores…" (`aria-busy`). O checkout só fica disponível com a cotação da versão exibida, sem problemas de disponibilidade.

Valores em ETH são strings decimais de ponta a ponta. A aritmética (soma, subtração sem negativo, multiplicação por quantidade inteira, percentual arredondado para baixo no wei) fica em `src/utils/eth.ts`, em `bigint` sobre wei, com testes unitários. Os mocks usam as mesmas funções.

### Contratos REST

Todas as rotas usam `clientApi`: anexam a sessão quando há uma, e o visitante envia `X-Cart-Id`. Um token inválido responde 401, como em toda rota autenticada.

| Método e caminho                       | Corpo                            | Resposta    | Erros                                                                                                                     |
| -------------------------------------- | -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /cart`                            | —                                | `Cart`      | 401                                                                                                                       |
| `GET /cart/quote`                      | —                                | `CartQuote` | 401                                                                                                                       |
| `POST /cart/items`                     | `{ nftId, editionId, quantity }` | `Cart`      | 404 `EDITION_NOT_FOUND`; 409 `CART_QUANTITY_UNAVAILABLE` (soma com o que já está no carrinho); 422 quantidade não inteira |
| `PATCH /cart/items/:nftId/:editionId`  | `{ quantity }`                   | `Cart`      | 404 `CART_ITEM_NOT_FOUND`; 409 ao aumentar além do disponível (diminuir é sempre aceito); 422                             |
| `DELETE /cart/items/:nftId/:editionId` | —                                | `Cart`      | 404 `CART_ITEM_NOT_FOUND`                                                                                                 |
| `PUT /cart/coupon`                     | `{ code }`                       | `Cart`      | 422 `COUPON_INVALID`, `COUPON_EXPIRED` ou `COUPON_MIN_SUBTOTAL`, com `fieldErrors.code`                                   |
| `DELETE /cart/coupon`                  | —                                | `Cart`      | —                                                                                                                         |
| `POST /cart/merge`                     | — (`X-Cart-Id` do visitante)     | `Cart`      | 401 sem sessão                                                                                                            |

`Cart` traz as linhas já com nome, token, edição, imagem, preço unitário, total da linha e unidades disponíveis, mais `itemCount` (soma das quantidades, o número do indicador) e `version`. Os tipos ficam em `src/types/cart.ts`.

No store dos mocks, `carts` passou a guardar `{ items, couponCode, version }` por dono (id de usuário ou `guest_NNNN`), e o esquema subiu para a versão 3, o que descarta um estado salvo antes.

**Cupons das fixtures** (`src/mocks/fixtures/coupons.ts`): `KURIO10` (10%), `GENESIS05` (0.05 ETH, a partir de 1 ETH de subtotal) e `VERAO25` (expirado). Qualquer outro código é inválido. Um cupom guardado é revalidado em cada cotação: se o subtotal cair abaixo do mínimo, o desconto zera e a mensagem explica por quê. A taxa de rede estimada é fixa em 0.016 ETH, e zero com o carrinho vazio.

Os cenários do carrinho não precisam de configuração: cupom inválido e expirado vêm dos códigos acima, e o conflito de disponibilidade vem das edições com poucas unidades (ex.: Golden Beat #207, 1/10, com 2 unidades) ou de `__mocks.updateNft`, que reduz o disponível com o item no carrinho.

### Cache

- **Usuário:** `['user', userId, 'cart']`, sob a raiz privada que o login, o logout e a troca de usuário limpam.
- **Visitante:** `['cart', 'guest', guestCartId | 'none']`.
- **Cotação:** a chave do carrinho + `['quote', version]`, com `keepPreviousData`.

As alterações não são otimistas: quantidade, inclusão e cupom dependem da disponibilidade e das regras da API. A linha alterada fica em `aria-busy`, com os controles desabilitados até a resposta, e o carrinho devolvido entra direto no cache. Um 409 também revalida o carrinho, porque o motivo costuma ser estoque que mudou.

### Decisões de UX

- **Indicador do header:** mostra a soma das quantidades ("Carrinho, 3 itens").
- **Quantidade:** de 1 ao disponível da edição. Se a disponibilidade cair abaixo da quantidade, o "+" trava, a linha ganha um contorno coral com a explicação ("Só resta 1 unidade desta edição…"), e o checkout fica bloqueado até o ajuste.
- **Cupom:** formulário com React Hook Form + Zod; os erros da API vão para o campo (`aria-invalid` e mensagem associada). Aplicado, o código aparece abaixo do campo com o desconto e um "Remover".
- **Feedback:** inclusão, alteração, remoção e cupom são anunciados na região viva (`polite`); as falhas, na `assertive`.
- **Estados:** skeleton do carrinho e do resumo com as dimensões finais, carrinho vazio com caminho para o mercado, erro com "Tentar novamente" (carrinho e cotação, separadamente), e atualização em segundo plano esmaecendo os valores.
- **"Colecionadores também viram":** os 5 NFTs em alta do catálogo (`GET /nfts?tab=trending`), na mesma vitrine do detalhe (`NftShelf`).
- **Alterações em tempo real:** ver [Tempo real na aplicação](#tempo-real-na-aplicação).

## Tempo real na aplicação

### Contrato do evento `nft.updated`

Todo evento usa o envelope de `src/types/realtime.ts`:

| Campo       | Conteúdo                                                                |
| ----------- | ----------------------------------------------------------------------- |
| `eventId`   | Identidade da emissão; uma duplicata repete o mesmo id                  |
| `resource`  | Recurso afetado: `{ type: 'nft', id }`                                  |
| `version`   | Versão do recurso depois da mudança, a mesma do campo `version` da REST |
| `emittedAt` | ISO 8601                                                                |
| `data`      | `priceEth` (string decimal) e `editions: [{ id, available }]`           |

O evento é público: vai a todas as conexões, de visitante ou de usuário. O payload é validado (`isNftUpdatedEvent`) antes de tocar o cache, e o que não segue o contrato é descartado.

### Aplicação no cliente

`useNftRealtime` (montado por `RealtimeSync` no layout) assina o socket da sessão atual:

1. **Filtro de entrega** (`createEventGate`, em `utils/realtime.ts`): descarta o `eventId` já visto e toda versão que não seja maior que a conhecida. O piso é a maior versão do NFT no cache (detalhe, listas, relacionados); sem cache, vale a última versão aceita pelo filtro. Duplicatas e eventos antigos não regridem o estado nem repetem anúncios.
2. **Catálogo e detalhe**: o NFT é atualizado no lugar em todas as consultas de `['nfts', ...]` (`applyNftUpdate` também recusa versão não mais nova). As listas ficam marcadas como desatualizadas, sem refetch imediato: o preço novo pode tirar o NFT de um filtro ou mudar a ordenação, e a REST recompõe a lista quando ela voltar a montar.
3. **Carrinho**: se o NFT está no carrinho em cache, o carrinho e a cotação são invalidados e voltam da API (a cotação é a referência; o cliente não recalcula). As mudanças relevantes (preço, edição esgotada, disponível abaixo da quantidade) viram avisos.
4. **Feedback acessível**: o detalhe aberto anuncia preço novo e edição esgotada; o carrinho anuncia o que afetou seus itens. Tudo vai para a região viva `polite`; o catálogo atualiza em silêncio, para não ler cada card.

### Reconciliação com a REST

Eventos emitidos durante uma queda não são reenviados. No `reconnect` do Manager do Socket.IO, o filtro é zerado e as consultas de NFT e do carrinho são invalidadas: o que está na tela volta da REST na hora, o resto fica desatualizado até montar de novo. A partir daí, a versão da REST volta a ser o piso.

### Sessão e ciclo de vida

Os listeners pertencem ao socket da sessão (ver [Política de sessão](#política-de-sessão)). Trocar de usuário troca o socket: o efeito remove `nft.updated` e `reconnect` do socket anterior e descarta os avisos do carrinho da sessão que terminou. Como o carrinho é lido pela chave do dono atual, um evento nunca altera o carrinho de outro usuário.

### Decisões de UX

- **Aviso no carrinho**: a mudança pode chegar enquanto o colecionador está em outra tela. O anúncio sai na hora, e o aviso "Itens do carrinho foram atualizados" fica no topo do carrinho até ser dispensado. O enunciado não pede notificação global, então não há toast.
- **Aviso só em memória**: um refresh descarta os avisos. O carrinho recarregado já mostra os valores atuais e os itens sem estoque, pela cotação.

### Limitações

- **Ordem dos eventos**: uma resposta REST antiga que chegue depois de um evento mais novo sobrescreve o cache; o próximo evento ou a próxima revalidação corrige.
- **Reconexão nos testes**: o `socket.io-client` espera até 5 s entre tentativas (com variação), então o teste de reconexão aceita até 15 s.

## Carteiras

### Contratos REST

Todas as rotas usam `clientApi` e exigem sessão (401 sem ela). As respostas de sucesso trazem sempre a lista completa do usuário (`WalletsResponse`, principal antes da secundária), que vira o cache sem nova consulta. Os tipos ficam em `src/types/wallet.ts`.

| Método e caminho         | Corpo                          | Resposta                | Erros                                                                                     |
| ------------------------ | ------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `GET /wallets`           | —                              | `WalletsResponse`       | 401                                                                                       |
| `POST /wallets`          | `CreateWalletRequest` (`slot`) | `WalletsResponse` (201) | 409 `WALLET_SLOT_TAKEN` (a posição já tem carteira); 422 com `fieldErrors`                |
| `PUT /wallets/:walletId` | `UpdateWalletRequest`          | `WalletsResponse`       | 404 `WALLET_NOT_FOUND` (inclusive carteira de outro usuário, sem revelar que existe); 422 |

Cada usuário tem no máximo uma carteira por posição (`primary`, `secondary`). Os campos seguem o formulário do Figma: nome de exibição, apelido, rede, nome do perfil, endereço `0x`, ENS ou carteira secundária (opcional), tipo de carteira, código de indicação, e-mail e nome ENS (sem o `.eth`). O enunciado não define os campos, então o Figma prevalece.

A API repete as regras de formato do formulário e acrescenta duas que só ela conhece: o **código de indicação** precisa existir (`KURIO2026`, `GREENMINT` ou `SELVA10`, em `src/mocks/fixtures/users.ts`) e o **endereço** não pode repetir o da outra carteira do usuário. Os dois erros voltam no 422, no campo correspondente.

No store, `wallets` guarda a lista por id de usuário; o esquema subiu para a versão 4, o que descarta um estado salvo antes. O cenário `wallet-error` faz o primeiro `POST` e o primeiro `PUT` responderem 503, e os seguintes funcionarem.

### Cache

A lista fica em `['user', userId, 'wallets']`, sob a chave do usuário: o logout e a troca de conta removem tudo o que está em `['user']`. Não há atualização otimista: o formulário só fecha com a resposta da API, que é gravada no cache e seguida de uma invalidação para reconciliar. Mutations não repetem sozinhas; depois de uma falha transitória o formulário mantém os valores e o colecionador envia de novo.

### Decisões de UX

- **Principal sem carteira:** o formulário fica aberto (o estado desenhado no Figma) e "Adicionar" leva o foco ao primeiro campo.
- **Carteira cadastrada:** aparece um resumo (apelido, rede, tipo, endereço e ENS) com "Editar"; o formulário abre no lugar, com "Cancelar". Salvar fecha o formulário e anuncia "Carteira principal atualizada." (ou "cadastrada") na região viva.
- **Secundária:** "Adicionar" abre o mesmo formulário da principal; o enunciado pede cadastro e edição das duas.
- **Validação:** React Hook Form + Zod no cliente; os erros da API (422) voltam para o campo com foco no primeiro. Falhas de rede ou 5xx aparecem num alerta acima de "Salvar carteira". Enquanto a requisição está pendente, novos envios são ignorados.
- **Estados:** skeleton com shimmer na geometria das duas seções, erro com "Tentar novamente" e `aria-busy` durante a atualização em segundo plano.
- **Navegação da conta:** a "Account Sidebar" do Figma (`AccountLayout`, compartilhada com o perfil) aparece a partir de 1024 px. Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte levam a `/em-breve`. Abaixo de 1024 px a tela usa o cabeçalho com "Voltar" do carrinho mobile.

## Pagamento

### Contratos REST

Todas as rotas usam `clientApi` e exigem sessão (401 sem ela). Os tipos ficam em `src/types/checkout.ts` e `src/types/order.ts`.

| Método e caminho                          | Corpo                           | Resposta                 | Erros                                                                                                                     |
| ----------------------------------------- | ------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /cart/quote`                         | —                               | `CartQuote`              | Revalidação de preço, disponibilidade, cupom e taxas antes do envio (contrato do carrinho)                                |
| `GET /wallets`                            | —                               | `WalletsResponse`        | Carteiras cadastradas usadas no pagamento (contrato das carteiras)                                                        |
| `POST /wallet-connections`                | `CreateWalletConnectionRequest` | `WalletConnection` (201) | 403 `WALLET_CONNECTION_REFUSED`; 422 endereço, rede ou provedor inválidos                                                 |
| `GET /wallet-connections/:id`             | —                               | `WalletConnection`       | 404 `WALLET_CONNECTION_NOT_FOUND` (inclusive conexão de outro usuário)                                                    |
| `DELETE /wallet-connections/:id`          | —                               | 204                      | —                                                                                                                         |
| `POST /orders` (header `Idempotency-Key`) | `CreateOrderRequest`            | `Order` (201, `pending`) | 409 `QUOTE_CHANGED`, `WALLET_NOT_CONNECTED`, `CART_EMPTY`, `IDEMPOTENCY_KEY_REUSED`; 422 com `fieldErrors` ou sem a chave |

- **Conexão simulada:** uma conexão vale para um endereço, uma rede e um provedor (MetaMask, WalletConnect ou Coinbase). Cada usuário tem uma conexão ativa; conectar outra encerra a anterior.
- **Pedido:** o corpo leva a conexão, a carteira cadastrada (`walletId`, ou `null` com "Usar outra carteira?"), os dados do colecionador (`CollectorInput`, que vão só no snapshot do pedido e não alteram o perfil) e a cotação revisada (`cartVersion` e `totalEth`). O servidor recalcula a cotação. Se a versão do carrinho ou o total divergirem, ou se houver item indisponível, nada é criado e a resposta é 409 `QUOTE_CHANGED`.
- **Idempotência:** a mesma chave com o mesmo conteúdo devolve o pedido já criado (200). Com outro conteúdo, a resposta é 409 `IDEMPOTENCY_KEY_REUSED`. A conexão não entra na comparação, então uma nova tentativa depois de reconectar a carteira continua sendo a mesma tentativa. O ciclo de vida segue em [Pedido e confirmação](#pedido-e-confirmação). Aqui o pedido nasce `pending` e a tela leva a `/pedidos/:id`.
- **Store:** `walletConnections`, `orderRequests` (impressão de cada requisição, base da idempotência) e `checkoutTriggers`. O esquema subiu para a versão 5.

### Evento `wallet.disconnected`

O envelope é o mesmo dos demais eventos (`eventId`, `resource: { type: 'wallet-connection', id }`, `version`, `emittedAt`) e `data` traz `{ reason }`. É emitido só para as conexões Socket.IO do dono (`sendToUser`): a conexão de outra sessão não recebe o evento. O cliente descarta duplicatas e versões antigas e, após reconectar o socket, consulta `GET /wallet-connections/:id` para saber se a conexão sobreviveu à queda.

### Cenários

Todos partem do carrinho da Nova com Emerald Ape #042 (×2), Violet Nomad #314 (1/10, ×1) e o cupom `KURIO10`.

| Cenário                   | Comportamento                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `checkout`                | Carrinho pronto para o pagamento                                                                   |
| `checkout-price-change`   | Na primeira tentativa de pedido, o preço do primeiro item sobe 0.25 ETH (também sai `nft.updated`) |
| `checkout-sold-out`       | Na primeira tentativa, a edição do primeiro item esgota                                            |
| `checkout-coupon-expired` | Na primeira tentativa, o cupom do carrinho expira                                                  |
| `wallet-refused`          | A primeira conexão de carteira é recusada; a seguinte é aceita                                     |
| `wallet-disconnect`       | A carteira desconecta 3 s depois de conectar (`wallet.disconnected`)                               |

A sessão expirada usa `expireSessions` (ou o cenário `short-session`). `window.__mocks.disconnectWallets()` encerra as conexões abertas e emite o evento.

### Revalidação da cotação

- A primeira cotação exibida para a versão atual do carrinho é a **revisão aceita**. `toReviewSnapshot` e `describeReviewChanges` (`src/utils/checkout-review.ts`) comparam a revisão aceita com a atual: itens, preço unitário, quantidade, indisponibilidade, cupom, desconto, taxa e total, com valores ETH comparados em wei.
- Um `nft.updated` com a tela aberta invalida o carrinho (fluxo do tempo real), a cotação é recalculada e as diferenças aparecem no alerta "Os valores do pedido mudaram", anunciado na região viva. A compra fica bloqueada até o colecionador clicar em "Aceitar novos valores".
- Ao confirmar, carrinho e cotação são buscados de novo na API, ignorando o cache (`useRevalidateCart`). Qualquer diferença em relação à revisão aceita cancela o envio. O 409 `QUOTE_CHANGED` do servidor tem o mesmo efeito: o carrinho recarrega e o alerta pede nova confirmação.
- Enquanto a cotação atualiza em segundo plano, os valores ficam esmaecidos com "Atualizando valores…" e a confirmação espera.

### Sessão expirada

O formulário é salvo continuamente em `sessionStorage`, por usuário (`src/lib/checkout-draft.ts`). Um 401 leva ao login carregando `/pagamento` como retorno. Ao entrar de novo, a tela recupera os dados digitados e a carteira escolhida, e o carrinho continua na API. O rascunho é apagado quando o pedido é criado e no logout explícito. Outro usuário na mesma aba lê a própria chave.

### Decisões de UX

- **Carteira cadastrada:** a principal vem escolhida e preenche o "Perfil do colecionador". Endereço, rede, ENS e carteira secundária ficam somente leitura enquanto uma carteira cadastrada está escolhida. "Usar outra carteira?" libera esses campos e os limpa. O nome de usuário vem da sessão.
- **Conexão:** escolher um provedor em "Carteira e rede" conecta na hora. O provedor da carteira cadastrada já vem marcado, com "Conectar". A opção marcada mostra "Conectando…", "Conectada", "Conexão recusada" ou "Desconectada", com "Tentar novamente" ou "Reconectar". Mudar endereço, rede ou provedor invalida a conexão, e sair da tela a encerra.
- **Confirmar compra:** o botão fica sempre focável (`aria-disabled` quando bloqueado), com o motivo abaixo dele ligado por `aria-describedby`. Enviar valida o formulário e leva o foco ao primeiro campo inválido. Sem conexão, o foco vai para "Carteira e rede"; com valores alterados, vai para o alerta.
- **Idempotência no cliente:** a chave é a mesma enquanto o conteúdo do pedido não muda (clique repetido, nova tentativa após falha) e é renovada quando o colecionador altera algo. A chave sobrevive ao refresh (ver [Pedido e confirmação](#pedido-e-confirmação)).
- **Estados:** skeleton com shimmer na grade final, erro com "Tentar novamente" (carrinho, cotação e carteiras), carrinho vazio com "Explorar o mercado", e `aria-busy` com valores esmaecidos durante a atualização.

## Pedido e confirmação

### Contratos REST

| Método e caminho                          | Corpo                | Resposta                                   | Erros                                                                                 |
| ----------------------------------------- | -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `POST /orders` (header `Idempotency-Key`) | `CreateOrderRequest` | `Order` (201 novo, 200 repetição da chave) | Ver [Pagamento](#pagamento)                                                           |
| `GET /orders/:id`                         | —                    | `Order`                                    | 404 `ORDER_NOT_FOUND`, inclusive para pedido de outro usuário (não vaza a existência) |

`Order` (`src/types/order.ts`) é o snapshot da compra: itens com nome, token, edição, imagem, preço unitário e subtotal, mais desconto, taxa de rede, total, cupom, carteira, provedor, rede e dados do colecionador. Só `status`, `transactionHash`, `refusalReason`, `updatedAt` e `version` mudam depois da criação. O recibo é desenhado só a partir dele, então mudanças posteriores no catálogo não alteram os valores.

### Evento `order.updated`

Envelope comum (`eventId`, `resource: { type: 'order', id }`, `version`, `emittedAt`). `data` traz `{ status, transactionHash, refusalReason, updatedAt }`. É emitido só para as conexões do dono (`sendToUser`), toda vez que o store marca o pedido como alterado. O id deriva da versão e da época do reset, então reemitir a mesma mudança gera uma duplicata reconhecível.

### Ciclo de vida na simulação

- O pedido nasce `pending` e o runtime agenda o desfecho 2,5 s depois da criação, contados a partir de `createdAt`. Como o worker reinicia a cada refresh, os pendentes são reagendados pelo tempo que falta (`scheduleSettlement` em `src/mocks/runtime.ts`).
- **Confirmar** (`settleOrder` em `src/mocks/orders.ts`) gera um hash simulado e determinístico (FNV-1a sobre id e chave). Tira do carrinho só os itens e quantidades do pedido (sobe a versão do carrinho e libera o cupom usado) e baixa o estoque das edições, o que também emite `nft.updated`. **Recusar** grava o motivo e não mexe em mais nada.
- Confirmado e recusado são terminais: `settleOrder` ignora pedido que já terminou.
- `window.__mocks.settleOrder(id, 'confirmed' | 'refused')` e o painel `/simulacao` ("Pedidos pendentes") decidem um pedido na hora.

| Cenário             | Comportamento                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkout` e demais | Confirmação automática após 2,5 s                                                                                                                        |
| `order-refused`     | Recusa automática após 2,5 s                                                                                                                             |
| `order-timeout`     | O primeiro `POST /orders` cria o pedido e a resposta nunca chega (`delay('infinite')`): vale o timeout de 15 s do cliente                                |
| `order-pending`     | Nada é decidido sozinho: o painel ou o teste confirma ou recusa                                                                                          |
| `order-disconnect`  | 1 s após a criação, o Socket.IO cai por 5 s; a confirmação (2,5 s) sai durante a queda e se perde. A queda fica só em memória: um refresh não a prolonga |

### Idempotência no cliente

- A tentativa fica em `sessionStorage`, por usuário (`src/lib/order-attempt.ts`): `{ fingerprint, key, inFlight }`. A chave é a mesma enquanto o conteúdo do pedido (tudo menos a conexão) não muda, inclusive depois de um refresh.
- `inFlight` guarda o envio sem resposta. Na resposta (pedido ou erro definitivo) ele é limpo. Em timeout ou queda ele fica, e a mutation repete o envio com a mesma chave até 2 vezes (`useCreateOrder` em `src/hooks/use-order.ts`). Se o pedido já existia, a API devolve o mesmo.
- Se a página recarregou com um envio em dúvida, ao abrir `/pagamento` o `ResumeOrderAttempt` reenvia aquele corpo com a mesma chave. Pedido existente abre o resultado. Se nada foi criado, a API recusa (a conexão antiga já caiu) sem criar nada.
- Pedido terminado libera a chave: depois de uma recusa, a nova tentativa é outra compra, com outro pedido.
- O logout explícito apaga as tentativas, como o rascunho do pagamento.
- O resultado abre pelo `onSuccess` da mutation, não pelo `mutate`. No timeout o pedido já foi confirmado quando a resposta chega, o carrinho esvaziou e o formulário desmontou, e o callback do `mutate` não rodaria.

### Estado do pedido no cliente

- `useOrder` consulta `['user', userId, 'orders', id]`, uma chave privada que sai do cache no logout como as demais.
- `order.updated` passa pelo `createEventGate`, que descarta duplicatas, e pelo `applyOrderUpdate` (`src/utils/order.ts`), que ignora versão não mais nova que a do cache e nunca altera pedido terminal.
- **Reconexão:** no `reconnect` do socket, o pedido é buscado de novo na REST. Enquanto pendente, uma consulta a cada 10 s cobre o caso de o tempo real estar fora.
- **Desfecho:** ao virar terminal, a chave é liberada. Na confirmação, carrinho e NFTs são invalidados. A mudança é anunciada na região viva: polida na confirmação, assertiva na recusa. Abrir um recibo que já estava terminado não gera anúncio.

### Decisões de UX

- **Modal sobre o pagamento:** como no Figma, o resultado é um modal sobre `/pagamento`, aberto por `?pedido=<id>`. Acesso direto e refresh funcionam, e fechar remove o parâmetro. No mobile ocupa a tela inteira, como o login.
- **Pendente:** anel girando (parado com `prefers-reduced-motion`), "Aguardando a confirmação do pagamento", os itens e valores do snapshot e "ID da transação: Aguardando". Não há recibo nem link do explorador.
- **Recusado:** marca "!" coral, o motivo vindo da simulação, os itens e "Voltar ao pagamento", que fecha o modal com o formulário e o carrinho intactos.
- **Confirmado:** o recibo do Figma. "Ver no Etherscan" leva a `/em-breve?secao=explorador-de-blocos`, com a nota "Hash e explorador simulados: nenhuma transação real foi feita." O hash curto tem o completo no `title`.
- **Estados:** skeleton com shimmer nas alturas do recibo, "Pedido não encontrado" para 404 (pedido de outro usuário incluído), erro com "Tentar novamente" e "Atualizando…" durante a reconciliação em segundo plano.

## Perfil do colecionador

### Contratos REST

Todas as rotas usam `clientApi` e exigem sessão (401 sem ela). Os tipos ficam em `src/types/user.ts`. As respostas de sucesso trazem o perfil público (`User`), que nunca inclui hash nem salt da senha.

| Método e caminho         | Corpo                                 | Resposta | Erros                                                                             |
| ------------------------ | ------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `GET /profile`           | —                                     | `User`   | 401                                                                               |
| `PATCH /profile`         | `UpdateProfileRequest`                | `User`   | 422 com `fieldErrors` (formato, nome de usuário reservado ou já em uso)           |
| `PUT /profile/avatar`    | `multipart/form-data`, campo `avatar` | `User`   | 422 `fieldErrors.avatar` (ausente, fora de PNG/JPEG/WebP, mais de 2 MB, ilegível) |
| `DELETE /profile/avatar` | —                                     | `User`   | 401                                                                               |
| `POST /profile/password` | `ChangePasswordRequest`               | 204      | 422 com `fieldErrors`; `INVALID_CURRENT_PASSWORD` em `currentPassword`            |

`UpdateProfileRequest` tem nome de exibição, nome de usuário, nome ENS (sem `.eth`, aceita subnomes com ponto) e apelido da carteira. O **e-mail fica de fora**: é a credencial de login e o enunciado só pede "edição dos dados"; na tela ele aparece desabilitado.

A API decodifica o avatar e o guarda recortado em 256 × 256 WebP, como data URL no estado persistido (o arquivo original de até 2 MB não caberia no `localStorage`). Um arquivo com tipo certo e conteúdo inválido só é recusado nesse passo, como faria um servidor real. A regra de formato e tamanho é a mesma no cliente e na API (`src/utils/avatar-file.ts`).

Na troca de senha a API confere a senha atual contra o hash, exige a regra do cadastro (8 caracteres, letras e números) e uma senha diferente da atual, e grava só o novo hash com salt novo. A sessão atual continua válida.

No store, `User` ganhou `walletNickname`; o esquema subiu para a versão 6. Falha transitória: `addFault` (ou o painel `/simulacao`) com `PATCH /profile` respondendo 503.

### Cache

O perfil fica em `['user', userId, 'profile']`, sob a chave do usuário, e sai do cache no logout e na troca de conta. Cada resposta confirmada é gravada no perfil **e** na sessão em cache (só se for do mesmo usuário), que alimenta o header: a mudança aparece na hora e, depois do refresh, volta de `GET /auth/session`. Não há atualização otimista.

### Decisões de UX

- **Um "Salvar":** o Figma tem um único botão. Ele envia os dados, depois o avatar (se mudou) e depois a senha (se os campos foram preenchidos). Cada etapa confirmada já vale; se uma falha, o erro aponta o campo dela e as anteriores ficam salvas. Os nomes dos `fieldErrors` não se repetem entre as etapas.
- **Senha opcional:** os três campos em branco mantêm a senha; preencher qualquer um exige os três. Depois de salvar, os campos de senha são limpos.
- **Avatar:** "Alterar" abre o seletor; o arquivo é validado na hora e pré-visualizado (object URL liberado ao trocar ou desmontar). A troca só vale no "Salvar". Com um arquivo pendente, "Remover" vira "Descartar".
- **Validação:** React Hook Form + Zod; os 422 voltam para o campo com foco no primeiro. Falhas de rede ou 5xx aparecem num alerta acima do "Salvar", sem aparentar sucesso.
- **Feedback:** "Perfil atualizado." (ou "Perfil e senha atualizados.") na região viva; falha anunciada como `assertive`.
- **Estados:** skeleton com shimmer na geometria do formulário, erro com "Tentar novamente" e `aria-busy` durante a atualização em segundo plano. Um refetch não reinicia o que está sendo digitado.
- **Mobile:** sem header nem sidebar abaixo de 768 px, o "Sair" da sidebar fica no fim do perfil, aonde a aba "Minha conta" leva.

## Desvios do Figma

| Item                                      | Desvio                                                                                                                                                                                                                                                                                            | Motivo                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Artes dos NFTs                            | O arquivo tem 4 artes únicas, repetidas em todas as telas. Os 40 NFTs das fixtures reutilizam as 4, e a galeria do detalhe mostra a arte principal seguida das outras três, como no Figma.                                                                                                        | Variedade de catálogo para filtros e paginação, sem inventar arte fora do layout                                |
| Formato das imagens                       | PNGs de 1254 px (cerca de 2 MB cada) convertidos para WebP em 400 px (cards) e 800 px (detalhe), em `public/images/nft-artwork-<cor>-<tamanho>.webp`.                                                                                                                                             | Peso de página e LCP (Lighthouse)                                                                               |
| Página `/simulacao`                       | Não existe no Figma. Segue os tokens e componentes do projeto.                                                                                                                                                                                                                                    | Interface de demonstração para trocar e restaurar cenários                                                      |
| Footer mobile e tablet                    | O Figma só tem o footer desktop. Abaixo de 1024 px as faixas empilham: destaques em 1–3 colunas, newsletter em largura total, contato em 2 colunas e links em 2–3 colunas. Títulos que quebram linha usam entrelinha de 20 px em vez de 16.                                                       | Caber em 390 e 768 px sem perder conteúdo                                                                       |
| Tab bar                                   | Desenhada para 414 px; em telas mais largas fica centralizada com no máximo 414 px, e em 390 px o fundo escala na horizontal. Os ícones usam o SVG do Figma como máscara, para a aba ativa trocar de cor sem editar o asset.                                                                      | Responsividade e estado ativo por rota                                                                          |
| Filetes do header                         | O filete de 0,3 px sob o header é uma borda de 1 px em `primary` com 30% de opacidade, que dá a mesma cobertura visual; o sublinhado do item ativo é uma faixa CSS de 3 px. Nenhum dos dois usa o SVG exportado.                                                                                  | Navegadores arredondam bordas abaixo de 1 px para um pixel físico inteiro                                       |
| Badge do carrinho                         | Feito em CSS (círculo `primary` com anel `ink` de 2 px), não o SVG exportado, para a largura acompanhar contagens de dois dígitos.                                                                                                                                                                | Contagem dinâmica                                                                                               |
| Botão de scan da tab bar                  | Um disco opaco no fundo `ink` fica atrás do círculo do Figma, que tem gradiente a 40% de opacidade.                                                                                                                                                                                               | No Figma o círculo está sobre o fundo do frame; sem o disco, o conteúdo que rola por baixo aparece através dele |
| Foco dos botões                           | O anel de foco do `Button` do shadcn (borda `ring` sobre fundo `primary`, contraste 1:1) foi trocado pelo contorno sólido de 2 px em `ring` com afastamento de 2 px, o mesmo dos links do layout. O Figma não desenha o foco.                                                                     | Foco visível com contraste mínimo de 3:1                                                                        |
| Rotas inexistentes e "Em breve"           | Não existem no Figma. Usam o card `surface-card`, a tipografia Display/43 e o botão primário do layout.                                                                                                                                                                                           | Estados não desenhados no padrão visual                                                                         |
| Login e cadastro: labels                  | Os campos do Figma só têm placeholder. Cada campo ganhou um label visualmente oculto ("E-mail", "Senha", "Confirmação de senha" etc.).                                                                                                                                                            | Nome acessível dos campos                                                                                       |
| Login e cadastro: erros                   | O Figma não desenha erro. Mensagens em 13/16 abaixo do campo e borda no coral do divisor de abas (`text-coral #F0805F`), que passa a ser o `--destructive` do tema; erros gerais num quadro com a mesma cor.                                                                                      | Estado não desenhado, na paleta do layout                                                                       |
| Login e cadastro: olho da senha           | No mobile o ícone é `#55321F` (contraste 1,6:1 sobre `ink`); usamos `secondary #B39463`, a cor do desktop. O Figma só tem o ícone de "ocultar"; o estado "senha visível" usa o `Eye` do Lucide.                                                                                                   | Contraste mínimo de 3:1 para controles; estado não desenhado                                                    |
| Login e cadastro: fechar no mobile        | Os frames mobile não têm como fechar. Um "X" igual ao do modal desktop fica no canto superior direito.                                                                                                                                                                                            | Saída do fluxo em telas de toque                                                                                |
| Login e cadastro: posição                 | O modal fica a 160 px do topo, como no Figma, mas sobe até 24 px em telas baixas e rola por dentro.                                                                                                                                                                                               | Não cortar conteúdo com zoom ou telas baixas                                                                    |
| Login e cadastro: aviso de sessão         | O aviso de sessão expirada não existe no Figma: quadro com borda `primary` e texto `text-accent`. As abas "Entrar \| Criar conta" são links que trocam o formulário pela URL.                                                                                                                     | Estado não desenhado                                                                                            |
| Ícone do Google                           | As 7 camadas vetoriais do "google 1" foram unidas num SVG de 20 × 20 (`signin-google.svg`), nas posições do Figma.                                                                                                                                                                                | Um arquivo em vez de 7 requisições                                                                              |
| Botão "Sair"                              | O Figma não desenha o header autenticado. O "Sair" tem o tamanho, o estilo e o ícone do "Entrar" (no Figma, o mesmo glifo "Logout" do Iconly).                                                                                                                                                    | Estado não desenhado                                                                                            |
| Coleções e redes do filtro                | O Figma lista 9 coleções (com Arte 3D, Generativa, Assinaturas e Utilidade) e a rede Solana. O painel mostra só as 5 categorias e as 2 redes da API, com contagens reais em vez dos números fixos do Figma.                                                                                       | Filtrar por opções que não existem nos dados devolveria sempre vazio                                            |
| Busca no desktop                          | O Figma não desenha campo de busca no desktop (só a lupa do header, que leva a `#catalogo`). A busca fica no topo da sidebar, com o visual da busca mobile.                                                                                                                                       | Busca é requisito do catálogo                                                                                   |
| Filtros no mobile e tablet                | O Figma só desenha o botão de filtro. O painel abre num bottom sheet com os mesmos grupos da sidebar e a ordenação.                                                                                                                                                                               | Estado não desenhado                                                                                            |
| Slider de preço                           | No Figma o trilho inteiro é `primary`. Fora da faixa escolhida ele fica em `primary` com 40% de opacidade.                                                                                                                                                                                        | Mostrar qual parte da faixa está selecionada                                                                    |
| Paginação                                 | O Figma mostra 1–4 e "próxima". Mostramos até 5 números ao redor da página atual e uma seta "anterior" a partir da página 2.                                                                                                                                                                      | Navegar nas duas direções                                                                                       |
| Card de NFT                               | O preço riscado (2.29 ETH) não tem dado na API e não aparece. O coração de favorito do card mobile fica para a issue de favoritos. O selo de raridade (Raro, Épico, Lendário) aparece só no mobile, como no Figma, e cresce para caber "Lendário".                                                | Sem dado de preço anterior; favoritos fora do escopo desta tela                                                 |
| Hero e banner mobile                      | Os três pontos são decorativos (não há carrossel). O fundo do banner mobile (grupo de máscara no Figma) é aproximado com um gradiente cinza translúcido e os dois círculos com 40% de opacidade. No tablet o título desce para 26/44.                                                             | Máscara do Figma sem equivalente direto em CSS; o título de 43 px quebraria em 3 linhas                         |
| Promoções                                 | Os cards empilham abaixo de 1024 px e, abaixo de 640 px, a arte fica sobre o texto.                                                                                                                                                                                                               | Caber em 390 e 768 px                                                                                           |
| Blog                                      | Os 4 cards de 268 px ficam alinhados à esquerda no desktop, como no Figma; abaixo de 1024 px viram 2 colunas e, no mobile, 1.                                                                                                                                                                     | Responsividade                                                                                                  |
| Detalhe: edições                          | O Figma mostra 1/1, 1/10, 1/50 e "ABERTA". O seletor mostra só as edições que o NFT oferece na API (`EditionLabel`); "ABERTA" não existe nos dados. Esgotada e "N de M disponíveis" não estão no Figma.                                                                                           | Seleção ligada à disponibilidade real                                                                           |
| Detalhe: "Atributos"                      | Não há atributos na API. A linha mostra categoria e raridade (ex.: "Arte digital, Raro").                                                                                                                                                                                                         | Sem dado equivalente                                                                                            |
| Detalhe: "Contrato" e "Direitos autorais" | No Figma os textos estão trocados ("Contrato:" traz os royalties e "Direitos autorais:" o endereço). Cada rótulo mostra o texto correspondente.                                                                                                                                                   | Coerência do conteúdo                                                                                           |
| Detalhe: favoritado                       | O Figma só desenha o "Favoritar" vazio. Favoritado, o botão (e o círculo do hero mobile) fica preenchido em `primary` com o ícone em `ink`; o texto continua "Favoritar" e o estado vai em `aria-pressed`.                                                                                        | Estado não desenhado                                                                                            |
| Detalhe: mobile                           | O frame mobile termina nos dados do token. Abaixo do sheet entram a descrição e "Mais desta coleção", e a barra de compra fica fixa no rodapé. O header do layout continua visível; a tab bar sai, como nas outras telas de compra. Os pontos do hero trocam a imagem (um por imagem da galeria). | Não perder conteúdo do desktop no mobile                                                                        |
| Detalhe: tablet                           | Entre 768 e 1023 px, a galeria fica acima das informações, com a imagem principal fluida.                                                                                                                                                                                                         | Caber em 768 px                                                                                                 |
| Detalhe: "Mais desta coleção"             | Os pontos do carrossel não aparecem: os 5 cards cabem numa linha no desktop. Abaixo de 1024 px a lista rola na horizontal.                                                                                                                                                                        | Sem páginas para navegar                                                                                        |
| Detalhe: ícones                           | Ícones exportados do Figma em SVG (`public/icons/detail-*.svg`) e pintados como máscara. A estrela do selo mobile mantém o `#E3A44E` do Figma.                                                                                                                                                    | Mesmo asset nos estados ativo e inativo                                                                         |
| Carrinho: edição na linha desktop         | A linha desktop mostra "ID do token: #0042 · 1/50". O Figma traz só o token; o mobile mostra a edição.                                                                                                                                                                                            | Duas edições do mesmo NFT seriam linhas idênticas                                                               |
| Carrinho: desconto zero                   | O Figma escreve "(-) 00.00"; mostramos "(-) 0.00 ETH", no formato dos outros valores.                                                                                                                                                                                                             | Coerência dos valores em ETH                                                                                    |
| Carrinho: remover no mobile               | No frame mobile a lixeira aparece só no item 3, sobreposta ao "+". Cada card tem a lixeira no canto superior direito.                                                                                                                                                                             | Deslize do frame; remover precisa existir em todos os itens                                                     |
| Carrinho: nomes no mobile                 | Em 390 px o card tem 334 px (358 no frame de 414); nomes longos quebram em até duas linhas e o card cresce.                                                                                                                                                                                       | Não cortar o nome                                                                                               |
| Carrinho: resumo mobile                   | O painel fica preso ao rodapé (`sticky`), como no Figma, e volta ao fluxo normal em telas com menos de 640 px de altura. O rótulo "Código promocional" e o título "Resumo da carteira" ficam visualmente ocultos no mobile, como no frame.                                                        | Não cobrir os itens com zoom ou em paisagem                                                                     |
| Carrinho: tablet                          | Entre 768 e 1023 px a tabela ocupa a largura toda e o resumo vem abaixo. As colunas mantêm as proporções do Figma.                                                                                                                                                                                | Caber em 768 px                                                                                                 |
| Carrinho: relacionados no mobile          | O frame mobile não tem "Colecionadores também viram"; a seção aparece a partir de 768 px.                                                                                                                                                                                                         | Seguir o frame mobile                                                                                           |
| Carrinho: estados                         | Vazio, erro, problema de disponibilidade, cupom aplicado e "Atualizando valores…" não estão no Figma. Usam o card `surface-card`, o coral dos erros e o `text-secondary` do layout.                                                                                                               | Estados não desenhados                                                                                          |
| Carrinho: lixeira                         | Ícone "Iconly/Curved/Delete" exportado em SVG (`public/icons/cart-delete.svg`) e pintado como máscara.                                                                                                                                                                                            | Mesmo asset nos estados normal e hover                                                                          |
| Carteiras: mobile e tablet                | Sem frame no Figma. Abaixo de 1024 px a sidebar some, entra o cabeçalho com "Voltar" e título do carrinho mobile, e os campos ficam em uma coluna (duas a partir de 768 px).                                                                                                                      |
| Carteiras: resumo e "Editar"              | O Figma só desenha a principal vazia com o formulário aberto. A carteira cadastrada aparece num resumo com borda `border-strong` e o link vira "Editar"/"Cancelar".                                                                                                                               |
| Carteiras: "Igual à carteira principal"   | O enunciado não descreve esse vínculo. O controle aparece desabilitado (60% de opacidade, "indisponível nesta versão" para leitores de tela), sem aparentar funcionar.                                                                                                                            |
| Carteiras: campo opcional sem label       | "ENS ou carteira secundária (opcional)" só tem placeholder no Figma; ganhou um label visualmente oculto com o mesmo texto.                                                                                                                                                                        |
| Carteiras: sufixo ".eth"                  | Desenhado como select, mas `.eth` é o único domínio aceito: o quadro é fixo, com a seta do Figma, e o campo descreve o sufixo para leitores de tela.                                                                                                                                              |
| Carteiras: erros                          | Não estão no Figma. Seguem o login: mensagem em 13/16 em `text-coral` abaixo do campo e borda coral.                                                                                                                                                                                              |
| Carteiras: ícones                         | Ícones da sidebar e a seta dos selects exportados do Figma em SVG (`public/icons/account-*.svg`, `select-arrow-down.svg`), com as cores originais.                                                                                                                                                |
| Pagamento: escolha da carteira (desktop)  | O frame desktop não desenha a escolha da carteira cadastrada. Entrou um select "Carteira cadastrada" acima do formulário, no estilo dos campos.                                                                                                                                                   | Usar as carteiras cadastradas, como pede o enunciado                                                            |
| Pagamento: formulário e itens (mobile)    | O frame mobile não desenha o formulário nem os itens. "Revisar pedido" e "Dados do colecionador" entram como seções recolhíveis entre os provedores e o total, fechadas por padrão e abertas automaticamente quando há erro.                                                                      | Validação e revisão antes do envio também no mobile                                                             |
| Pagamento: tablet (768 px)                | Sem frame. Do desktop vêm os campos em duas colunas, com "Seus NFTs", "Carteira e rede" e o botão abaixo. A partir de 1024 px, as colunas de 763 e 405 px ficam lado a lado.                                                                                                                      | —                                                                                                               |
| Pagamento: kebab dos cards (mobile)       | O "⋮" dos cards de carteira foi omitido. "Trocar carteira" leva a `/carteiras`.                                                                                                                                                                                                                   | Evitar um controle que aparenta ação sem tê-la                                                                  |
| Pagamento: marca da Coinbase (mobile)     | O ícone da Coinbase não foi exportado (MCP e REST sem cota). No lugar dele entrou o ícone de carteira já usado na conta (`account-wallets.svg`), no mesmo círculo de 40 px das marcas "W" e "M".                                                                                                  | Asset indisponível                                                                                              |
| Pagamento: status, alerta e erros         | Não estão no Figma. O status da conexão fica em 12 px na opção marcada. O alerta de valores alterados usa o card com borda coral, e os erros seguem as carteiras.                                                                                                                                 | Estados exigidos pelo enunciado                                                                                 |
| Pagamento: "Aplique aqui"                 | Virou link para o carrinho, onde o cupom é aplicado.                                                                                                                                                                                                                                              | O cupom pertence ao carrinho; a cotação do pagamento o reflete                                                  |
| Confirmação: pendente, recusado e erros   | Só o confirmado está no Figma. Pendente e recusado reutilizam o mesmo modal, com anel girando ou marca "!" coral no lugar do ícone e descrição em `text-secondary`.                                                                                                                               | Estados exigidos pelo enunciado                                                                                 |
| Confirmação: desconto e edição            | O Figma não mostra desconto nem edição. "Desconto (CUPOM)" entra acima da taxa quando o pedido teve cupom, e cada item ganha "Edição 1/50" abaixo do token.                                                                                                                                       | Recibo completo a partir do snapshot                                                                            |
| Confirmação: nota do explorador           | Texto "Hash e explorador simulados…" abaixo de "Ver no Etherscan", que leva a `/em-breve`.                                                                                                                                                                                                        | Não aparentar integração real                                                                                   |
| Confirmação: imagens dos itens            | Os itens 2 e 3 têm 66 e 65 px no Figma; todos usam 70 px (44 px no mobile).                                                                                                                                                                                                                       | Inconsistência do arquivo                                                                                       |
| Confirmação: mobile                       | Sem frame. Tela cheia, metadados em grade 2 × 2, tabela com fonte menor e ID do token sem quebra.                                                                                                                                                                                                 | Caber em 390 px                                                                                                 |
| Confirmação: metadados longos             | Com nome de carteira longo (Coinbase Wallet), o valor quebra linha em vez de ser cortado.                                                                                                                                                                                                         | Sem perda de conteúdo                                                                                           |
| Perfil: avatar no header                  | O header do Figma não tem acesso ao perfil. Com sessão, um círculo de 35 px com o avatar (ou as iniciais do nome de exibição) aparece antes do "Sair" e leva a `/perfil`.                                                                                                                         | A issue pede que as alterações reflitam no header, e no desktop não havia caminho para o perfil                 |
| Perfil: e-mail desabilitado               | O Figma desenha o e-mail como campo editável; ele aparece com a mesma caixa, texto `text-secondary` e desabilitado.                                                                                                                                                                               | É a credencial de login e o enunciado não pede sua edição                                                       |
| Perfil: "Apelido da carteira"             | Campo do Figma sem dado correspondente no usuário; virou `walletNickname` do perfil, salvo com os demais dados.                                                                                                                                                                                   | Fidelidade ao Figma sem depender das carteiras, que são outra tela                                              |
| Perfil: mobile e tablet                   | Sem frame. Mesmo padrão das carteiras: cabeçalho com "Voltar" abaixo de 1024 px, uma coluna abaixo de 768 px, "Salvar" em largura total e "Sair" no fim da tela no mobile.                                                                                                                        | Coerência com as demais telas da conta                                                                          |
| Perfil: medidas                           | A cota do MCP do Figma e a API REST estavam esgotadas; as medidas vieram da Plugin API no navegador (`docs/figma/raw/70386-239.txt`), sem screenshot de referência em cache.                                                                                                                      | Limite do plano Starter                                                                                         |
