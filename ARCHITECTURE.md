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
├── handlers/           # handlers por recurso (hoje, a API de controle da simulação)
└── fixtures/           # NFTs, usuários, carteiras, favoritos, carrinhos, pedidos e cupons
```

### Store único

`MockStore` guarda um único estado (`MockDb`) com catálogo, usuários, sessões, carteiras, favoritos, carrinhos, pedidos e cupons. Os handlers REST e a simulação de Socket.IO leem e escrevem nesse mesmo objeto, então uma mudança aparece nos dois:

- toda escrita passa por `store.write()`, que persiste o estado e notifica os assinantes;
- dentro da escrita, `tx.touch(tipo, entidade)` incrementa a `version` e o `updatedAt` do recurso e o registra como alterado;
- `realtime.ts` assina o store e emite `nft.updated` para cada NFT alterado, com `eventId` derivado da versão (`evt_nft_<id>_v<versão>`), de modo que reemitir a mesma mudança gera uma duplicata reconhecível.

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

| Grupo              | Telas                                          | Papel                                                                          |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `_public`          | Início, `/carrinho`, `/em-breve`, `/simulacao` | Abertas a qualquer visitante                                                   |
| `_authenticated`   | `/perfil`, `/carteiras`                        | Exigem sessão; o guarda (`beforeLoad` com retorno ao login) entra com a sessão |
| `_unauthenticated` | `/login`                                       | Login e cadastro; `?redirect=` validado por `safeRedirect`                     |

`/carrinho`, `/perfil`, `/carteiras` e `/login` existem como rotas reservadas ("em construção") para os links do layout serem tipados desde já; cada tela substitui o componente na sua etapa.

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

| Rota        | Parâmetro   | Valores                                                | Inválido ou ausente         |
| ----------- | ----------- | ------------------------------------------------------ | --------------------------- |
| `/`         | `busca`     | texto não vazio (número digitado vira texto)           | descartado, sem busca       |
| `/`         | `categoria` | `art`, `collectible`, `music`, `photography`, `gaming` | descartado, sem filtro      |
| `/em-breve` | `secao`     | ids de `OUT_OF_SCOPE_SECTION_IDS`                      | texto genérico "Esta seção" |
| `/login`    | `redirect`  | caminho interno                                        | descartado                  |

O `redirect` passa por `safeRedirect` (`src/utils/redirect.ts`): resolve o valor contra a origem da aplicação e só aceita o mesmo host, devolvendo o caminho normalizado. Checar o prefixo `/` não basta, porque o parser de URL trata `\` como `/` e descarta tab e quebra de linha (`/\evil.com` resolve para outro host). O guarda de `_authenticated` e o tratamento de 401 do `clientApi` devem usar a mesma função quando entrarem. Dentro do fluxo de login, o botão "Entrar" repassa o `redirect` que já está na URL em vez de trocá-lo pela tela atual.

### Item ativo e `aria-current`

O destaque da navegação segue a seção da rota, não só a URL exata (Mercado fica ativo em todo o fluxo de compra; "Minha conta" na tab bar cobre perfil, carteiras e login). O `Link` do TanStack marcaria `aria-current` só pela URL, então header e tab bar usam `NavLink` (`createLink`), que define `aria-current="page"` a partir do mesmo estado do destaque.

### Pontos de extensão

- `CartIndicator` recebe `count` e `isPending` (badge em skeleton); a consulta do carrinho passa a contagem.
- `AccountIndicator` tem os estados `pending` (skeleton) e `anonymous` (botão "Entrar", que leva ao login com `redirect` para a tela atual, ou mantém o `redirect` recebido quando já está no fluxo de login); a sessão acrescenta o estado autenticado.
- `useAnnounce()` publica mensagens nas regiões vivas únicas do layout (`polite` e `assertive`), para feedback de mutations e de eventos em tempo real.
- `StateMessage` é o painel de 404, `/em-breve` e estados vazios ou de erro.
- O `Input` do shadcn/ui usa o placeholder na cor `secondary` (a dos campos do Figma) e foco sólido em `ring`. Na newsletter e na busca mobile ele fica embutido num contêiner que desenha o fundo, o raio e o foco (`focus-within`), como os campos compostos do Figma.
- O `Skeleton` do shadcn/ui usa shimmer com os tokens de superfície e fica parado com `prefers-reduced-motion`. Ele é `aria-hidden`: quem o usa anuncia o carregamento (`aria-busy` no contêiner ou texto `sr-only`).

## Desvios do Figma

| Item                            | Desvio                                                                                                                                                                                                                                      | Motivo                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Artes dos NFTs                  | O arquivo tem 4 artes únicas, repetidas em todas as telas. Os 40 NFTs das fixtures reutilizam as 4, e a galeria do detalhe mostra a arte principal seguida das outras três, como no Figma.                                                  | Variedade de catálogo para filtros e paginação, sem inventar arte fora do layout                                |
| Formato das imagens             | PNGs de 1254 px (cerca de 2 MB cada) convertidos para WebP em 400 px (cards) e 800 px (detalhe), em `public/images/nft-artwork-<cor>-<tamanho>.webp`.                                                                                       | Peso de página e LCP (Lighthouse)                                                                               |
| Página `/simulacao`             | Não existe no Figma. Segue os tokens e componentes do projeto.                                                                                                                                                                              | Interface de demonstração para trocar e restaurar cenários                                                      |
| Footer mobile e tablet          | O Figma só tem o footer desktop. Abaixo de 1024 px as faixas empilham: destaques em 1–3 colunas, newsletter em largura total, contato em 2 colunas e links em 2–3 colunas. Títulos que quebram linha usam entrelinha de 20 px em vez de 16. | Caber em 390 e 768 px sem perder conteúdo                                                                       |
| Tab bar                         | Desenhada para 414 px; em telas mais largas fica centralizada com no máximo 414 px, e em 390 px o fundo escala na horizontal. Os ícones usam o SVG do Figma como máscara, para a aba ativa trocar de cor sem editar o asset.                | Responsividade e estado ativo por rota                                                                          |
| Filetes do header               | O filete de 0,3 px sob o header é uma borda de 1 px em `primary` com 30% de opacidade, que dá a mesma cobertura visual; o sublinhado do item ativo é uma faixa CSS de 3 px. Nenhum dos dois usa o SVG exportado.                            | Navegadores arredondam bordas abaixo de 1 px para um pixel físico inteiro                                       |
| Badge do carrinho               | Feito em CSS (círculo `primary` com anel `ink` de 2 px), não o SVG exportado, para a largura acompanhar contagens de dois dígitos.                                                                                                          | Contagem dinâmica                                                                                               |
| Botão de scan da tab bar        | Um disco opaco no fundo `ink` fica atrás do círculo do Figma, que tem gradiente a 40% de opacidade.                                                                                                                                         | No Figma o círculo está sobre o fundo do frame; sem o disco, o conteúdo que rola por baixo aparece através dele |
| Foco dos botões                 | O anel de foco do `Button` do shadcn (borda `ring` sobre fundo `primary`, contraste 1:1) foi trocado pelo contorno sólido de 2 px em `ring` com afastamento de 2 px, o mesmo dos links do layout. O Figma não desenha o foco.               | Foco visível com contraste mínimo de 3:1                                                                        |
| Rotas inexistentes e "Em breve" | Não existem no Figma. Usam o card `surface-card`, a tipografia Display/43 e o botão primário do layout.                                                                                                                                     | Estados não desenhados no padrão visual                                                                         |
| Filtros da busca mobile         | O botão aparece desabilitado até o catálogo ter o painel de filtros.                                                                                                                                                                        | Não aparentar uma ação que ainda não existe                                                                     |
