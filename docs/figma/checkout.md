# Pagamento — desktop (`11:2862`) e mobile (`16:748`)

Read with the Plugin API (MCP out of calls, REST 429). Positions are relative
to the node root. Screenshots are editor captures (approximate):
[checkout-desktop.jpg](screenshots/checkout-desktop.jpg),
[checkout-mobile-canvas.jpg](screenshots/checkout-mobile-canvas.jpg) (mobile is
the middle frame). Fonts are Roboto Mono throughout.

## Desktop — Checkout Page `70522:3321` (1200 × 903, column, gap 32)

Header With Divider (cached in `layout-shell.md`), then Page Content
`@0,77`, column, gap 32:

- Breadcrumb "Início / Mercado / Pagamento" Bold 15 / lh 16 `#f5f1eb`.
- Row (gap 32): **form column 763** + **summary column 405** (x 795).

### Perfil do colecionador (763 wide, column gap 12)

- Title "Perfil do colecionador" Bold 17 / lh 16 `#f5f1eb`.
- Fields grid: two 370 px columns, gap 24 (second column x 394); rows gap 12
  (row pitch 81). Same field anatomy as `wallets-desktop.md`: label Regular 15 /
  lh 15 `#f5f1eb` + asterisk Regular 22 / lh 29 `#f0805f`, label row 29 high,
  input 370 × 40, stroke 1 `#3f2319`, radius 3, placeholder Regular 14
  `#b39463`, inset 12. Select chevron 10 × 6 `#b39463` at right ~33.
  - Nome de exibição* · Nome de usuário*
  - Rede* (select "Selecione uma rede") · Nome do perfil*
  - Endereço da carteira* ("Endereço 0x da carteira") · (no label) "ENS ou
    carteira secundária (opcional)"
  - Tipo de carteira* (select "Selecione uma carteira") · Código de indicação*
  - E-mail* · Nome ENS* (78 × 40 ".eth" suffix select, Regular 15 `#f5f1eb`)
- Radio (15 circle, stroke 2 `#d28a4c`) + "Usar outra carteira?" Regular 15
  `#f5f1eb`, gap 8, at y 570.
- "Observação do colecionador (opcional)" Regular 15, textarea 350 × 152,
  stroke 1 `#3f2319`, radius 3, label→box 12.

### Seus NFTs (405 wide)

- Title "Seus NFTs" Bold 17; header row "NFTs" Bold 16 · "Subtotal" Medium 16
  (space-between), then divider 1 px `#d28a4c` @ 30 %, 12 below.
- Item rows 405 × 70, fill `#241612`, gap 12 between rows, pad-left 4:
  artwork ~70 × 70 radius 8; name Bold 16 `#f5f1eb`; "ID do token: #0042"
  Regular 14 `#b39463` (gap 6); "(x 2)" Regular 14 `#cfb28c`; line total
  Bold 18 `#e89b55`, right pad 16.
- "Tem um código promocional? Aplique aqui" Regular 14 `#f5f1eb`, centred.
- Totals rows (pitch 32): label Regular 15 `#f5f1eb`, value Regular 18
  `#f5f1eb` — Subtotal, Desconto do lançamento "(-) 00.00" (Regular 15), Taxa de
  rede; "Taxa estimada" Regular 12 `#e89b55` centred. Divider @30 %. "Total"
  Bold 16 · value Bold 18 `#e89b55` (row inset ~42 both sides).

### Carteira e rede

- Title "Carteira e rede" Bold 17, centred.
- Options 405 × 45, stroke 1 `#3f2319` (selected: `#d28a4c`), radius 3, gap 16,
  pad-left 12: radio 16 circle stroke 1.2 `#d28a4c` (selected: inner 10 dot
  `#d28a4c`) + label Regular 15 `#f5f1eb` (gap 10).
  1. Chip 224 × 26 fill `#38220f` stroke `#55321f` radius 6: "METAMASK •
     WALLETCONNECT • COINBASE" Bold 9 `#e89b55`.
  2. MetaMask 3. Coinbase Wallet (selected).
- "Confirmar compra" button 405 × 45, fill `#d28a4c`, radius 8, Bold 15
  `#140d0a`, 24 below the last option.

## Mobile — `16:748` (414 × 896, fill `#140d0a`, pad 32 / 28)

Content column, gap 16:

- Screen header: back circle 35 (fill `#2f1d15`, stroke `#3f2319`) + title
  "Pagamento com carteira" Bold 20 `#f5f1eb`.
- Row space-between: "Carteira conectada" Bold 16 `#f5f1eb` · "Trocar
  carteira" Bold 14 `#e89b55`.
- Wallet cards (gap 20): 358 × 93, fill `#241612`, radius 14, shadow
  0 20 20 `#0a0604`/45 % on the selected one. Radio 16 (stroke 1.2 `#55321f`;
  selected `#d28a4c` with dot) at x 19; title Bold 16 `#f5f1eb` ("Reserva",
  "Principal"); two lines Regular `#cfb28c` (ENS/address, "Rede Polygon" /
  "Rede principal Ethereum"); kebab at right.
- "Carteira e rede" Bold 16. Options 359 × 65, fill `#241612`, radius 15,
  shadow 0 0 20 `#0a0604`/45 %, gap 16: mark circle 40 (fill `#2f1d15`, stroke
  `#3f2319`) with letter Bold 14 `#e89b55` ("W", "M", Coinbase icon), label
  Regular 14 `#f5f1eb` at x 65, radio 16 at right 17.
  WalletConnect · MetaMask · Coinbase Wallet (selected).
- Total row right-aligned: "Total:" Bold 16 · "8.936 ETH" Bold 18 `#e89b55`
  (gap 28).
- Confirm button pinned at bottom: 358 × 60, fill `#d28a4c`, radius 40,
  "Confirmar compra" Bold 15 `#140d0a`.

The mobile frame draws neither the collector form nor the item list.
