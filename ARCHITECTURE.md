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

## Desvios do Figma

| Item                | Desvio                                                                                                                                                                                     | Motivo                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Artes dos NFTs      | O arquivo tem 4 artes únicas, repetidas em todas as telas. Os 40 NFTs das fixtures reutilizam as 4, e a galeria do detalhe mostra a arte principal seguida das outras três, como no Figma. | Variedade de catálogo para filtros e paginação, sem inventar arte fora do layout |
| Formato das imagens | PNGs de 1254 px (cerca de 2 MB cada) convertidos para WebP em 400 px (cards) e 800 px (detalhe), em `public/images/nft-artwork-<cor>-<tamanho>.webp`.                                      | Peso de página e LCP (Lighthouse)                                                |
| Página `/simulacao` | Não existe no Figma. Segue os tokens e componentes do projeto.                                                                                                                             | Interface de demonstração para trocar e restaurar cenários                       |
