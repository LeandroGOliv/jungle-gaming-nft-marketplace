## Objetivo

Descreva o objetivo deste PR de forma curta e direta, sem sub-headings (`###`), e
evite referências a arquivos/código específicos. Foque no **por quê** foi feito,
não no **como**. Se for um fix, descreva também qual era o problema.

## Issue relacionada

Referencie a issue do GitHub relacionada a este PR (ex.: `Closes #12`, que fecha
a issue automaticamente ao dar merge; ou `Relacionado a #12` se só parte dela foi
resolvida). Caso não haja issue, remova esta seção.

## O que muda

Descreva com mais detalhe as mudanças aplicadas neste PR.

## Fidelidade ao Figma

Para mudanças de UI: frames implementados (desktop/mobile) e qualquer desvio em
relação ao layout, com o motivo. Remova esta seção se o PR não altera interface.

## Testes

Descreva os cenários Playwright e os testes unitários adicionados ou alterados e
o que eles comprovam. Se a mudança é puramente estrutural/config (sem lógica),
diga isso em vez de deixar em branco.

## Test plan

Descreva o que o revisor deve testar manualmente (cenário de mock, credenciais
fictícias, viewport). Se não houver nada manual a testar, escreva "N/A — mudança
puramente estrutural; lint/typecheck cobrem."

## Tipos de mudança

Marque as opções corretas e remova as outras:

- [ ] FEATURE: novo recurso
- [ ] FIX: correção de bug
- [ ] REFACTOR: reestruturação sem mudança de comportamento
- [ ] CHORE: manutenção que não afeta funcionalidade (dependências, config)
- [ ] TEST: adição ou alteração de testes automatizados
- [ ] DOCS: alteração ou adição de documentação

## Antes de solicitar uma revisão, garanta que:

_(remova esta linha ao abrir o PR — os itens abaixo continuam)_

- [ ] Rodei typecheck, lint e os testes Playwright relevantes
- [ ] Conferi a tela em 390, 768 e 1440 px contra o Figma
- [ ] Naveguei o fluxo só com teclado (foco visível, diálogos, erros de formulário)
- [ ] Atualizei a documentação relevante (README/ARCHITECTURE), se contratos,
      comportamento ou setup mudaram
- [ ] Fiz uma auto-revisão do meu código
