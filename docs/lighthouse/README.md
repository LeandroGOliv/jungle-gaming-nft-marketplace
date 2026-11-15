# Auditoria Lighthouse

Relatórios entregues da auditoria de desempenho e qualidade. A configuração está em [`scripts/lighthouse.mjs`](../../scripts/lighthouse.mjs) e roda com:

```bash
pnpm build && pnpm lighthouse
```

## Condições de execução

| Item            | Valor                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Lighthouse      | 13.6.0 (CLI, dependência do projeto)                                                               |
| Navegador       | Chrome headless 157 (`--headless=new`)                                                             |
| Node.js         | 24.22.1                                                                                            |
| Sistema         | Windows 11, x64, 12 threads lógicas                                                                |
| Servidor        | `vite preview` do build de produção, em `localhost`                                                |
| Dados           | Cenário padrão dos mocks (`default`), com a latência padrão de 200–400 ms                          |
| Perfil mobile   | Padrão do Lighthouse: emulação de celular, rede 4G lenta e CPU 4× mais lenta (throttling simulado) |
| Perfil desktop  | `--preset=desktop`                                                                                 |
| Páginas         | Início (`/`) e detalhe do NFT (`/nft/emerald-ape-042`)                                             |
| Medições        | 3 por página e perfil; o resumo reporta a mediana de cada categoria e métrica                      |
| Data da medição | 15/11/2026                                                                                         |

A auditoria carrega a aplicação entregue, sem simplificações: as mesmas imagens, fontes, MSW, Socket.IO simulado e código do deploy.

## Resultados (medianas)

| Página  | Perfil  | Performance | Accessibility | Best Practices | SEO |   LCP |   CLS |    TBT |
| ------- | ------- | ----------: | ------------: | -------------: | --: | ----: | ----: | -----: |
| Início  | mobile  |      **79** |           100 |            100 | 100 | 4,5 s | 0,016 | 153 ms |
| Início  | desktop |          98 |           100 |            100 | 100 | 1,1 s | 0,002 |   0 ms |
| Detalhe | mobile  |      **82** |           100 |            100 | 100 | 4,7 s |     0 | 100 ms |
| Detalhe | desktop |          97 |           100 |            100 | 100 | 1,3 s |     0 |   0 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Em negrito, o que ficou abaixo.

As medições individuais, que mostram a variação entre as rodadas, estão em [`summary.json`](summary.json). O HTML e o JSON da medição de Performance mediana de cada página e perfil estão nesta pasta (`<página>-<perfil>.report.html|json`).

## O que mudou com a auditoria

A primeira rodada mostrou estes números:

| Página  | Perfil  | Performance | Accessibility | Best Practices | SEO |   CLS |
| ------- | ------- | ----------: | ------------: | -------------: | --: | ----: |
| Início  | mobile  |          71 |           100 |             96 |  92 | 0,016 |
| Início  | desktop |          93 |           100 |             96 |  92 | 0,002 |
| Detalhe | mobile  |          77 |            97 |             96 |  92 | 0,128 |
| Detalhe | desktop |          88 |           100 |             96 |  92 | 0,184 |

As causas encontradas e as correções feitas:

- **CLS de 0,13–0,18 no detalhe**: o skeleton cobria só o topo da página, e o footer saltava quando a descrição e os relacionados chegavam. O skeleton agora reserva a altura final das duas seções.
- **Best Practices 96**: faltava favicon, e o 404 dele aparecia como erro no console. Foi adicionado `public/favicon.svg`.
- **SEO 92**: não havia `robots.txt`, e o rewrite da SPA devolvia o HTML no lugar dele. Foi adicionado `public/robots.txt`.
- **Accessibility 97 no detalhe mobile**: os pontos da galeria tinham áreas de toque de 23 px sobrepostas. Agora são 24 px sem sobreposição (WCAG 2.5.8).
- **JS no caminho crítico**: os formulários de login e cadastro (React Hook Form e schemas) saíram do chunk de entrada e passaram a carregar quando o navegador fica ocioso.
- **Cadeia de carregamento serial**: o chunk da simulação só começava a baixar depois de o JS de entrada executar. Um `modulepreload` no HTML agora baixa os dois em paralelo.
- **Imagem do LCP não descoberta no HTML** (fundo da tab bar no mobile): ganhou `preload` restrito ao mobile.

Detalhes das otimizações em [`ARCHITECTURE.md`](../../ARCHITECTURE.md#desempenho).

## Por que a Performance mobile fica abaixo de 90

No perfil mobile o LCP fica em ~4,5 s e responde por quase toda a perda de pontos. O FCP fica entre 0,9 e 2,6 s, e o TBT entre 100 e 150 ms, dentro da faixa boa. A causa é estrutural e vem de um requisito do desafio:

1. **A simulação roda na thread principal antes da primeira renderização.** Não há backend: o MSW registra o service worker e monta o store, as fixtures e o servidor Socket.IO simulado antes de a aplicação renderizar, senão as primeiras consultas iriam para a rede. Com a CPU 4× mais lenta, só a avaliação desse chunk (`browser-*.js`: MSW, o binding de Socket.IO, as fixtures e as dependências de cookies do MSW, `tough-cookie` e `tldts`) custa ~0,65–0,9 s de script. Somam-se o registro do service worker e a latência padrão de 200–400 ms do cenário em cada chamada.
2. **O conteúdo do LCP depende dessa cadeia.** Na Início mobile, o LCP é o fundo da tab bar, que só aparece com a aplicação renderizada. No detalhe, é a arte do NFT, cuja URL vem da resposta da API simulada. O atraso do LCP é o tempo da cadeia "JS de entrada, simulação, primeira resposta, renderização", não o download da imagem. A imagem já tem `fetchpriority="high"` e leva ~25 ms para baixar.
3. **O Lighthouse aponta ~130 KiB de JS não usado**, quase todo nesses dois chunks: código do MSW e do React DOM que a primeira tela não executa. Não dá para dividir mais sem tirar a simulação do carregamento inicial, o que mudaria o comportamento da entrega.

Num produto real, com API de verdade, os itens 1 e 2 não existiriam: a primeira renderização sairia logo após o JS de entrada, como mostram o desktop (97–98) e o FCP do detalhe mobile (0,9 s). O enunciado pede que a auditoria use as funcionalidades da entrega, então as medições incluem esse custo, e ele fica documentado aqui em vez de removido.
