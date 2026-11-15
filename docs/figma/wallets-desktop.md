# Carteiras — desktop (`9:1670`)

Read with the Plugin API (MCP and REST were rate-limited). Frame 1440 × 1080,
fill `#140d0a`. `Top` `70390:267` at (120, 24): Header With Divider, then
`Body` `70390:266` 32 px below. Screenshot:
[wallets-desktop.jpg](screenshots/wallets-desktop.jpg) (editor capture, approx.).

## Body `70390:266` — 1200 × 639, row, gap 28

### Account Sidebar `70420:4594` — 310 × 407, fill `#241612` (surface-card), column, pad 8 0

- Title "Meu perfil": frame pad 10, Roboto Mono Bold 18 / lh 16, `#f5f1eb`.
- Items: 310 × 45 rows, pad 0 16, gap 12 (first item gap 16), icon + label
  Roboto Mono Regular 15 / lh 45, `#e89b55` (text-accent).
  1. Dados do perfil — `account-user.svg` 18 (`#cfb28c`)
  2. **Carteiras (active)** — `account-wallets.svg` 20 (`#e89b55`); active row
     has a 6 px left border `#d28a4c` (inside stroke).
  3. Atividade — `account-activity.svg` 18 (`#b39463`)
  4. Lista de interesse — `account-watchlist.svg` 16 (`#b39463`)
  5. Ofertas — `account-offers.svg` 18
  6. Arquivos baixados — `account-downloads.svg` 18
  7. Suporte — `account-support.svg` 18
- Divider at y 359: 1 px `#d28a4c` @ 30 %.
- "Sair": 310 × 40, pad 0 16, gap 8, `account-logout.svg` 20 (`#d28a4c`),
  Roboto Mono Bold 15 / lh 15 `#e89b55`.

### Wallets Form `70390:239` — 862 × 639, column, gap 32

- Section Heading (column, gap 8): title row space-between —
  "Carteira principal" Bold 17 / lh 16 `#f5f1eb`; "Adicionar" Medium 16 / lh 16
  `#e89b55`. Description Regular 14 / lh 15 `#cfb28c`: "Estas carteiras ficam
  disponíveis no pagamento e para receber NFTs comprados."
- Fields (column, gap 24): 5 rows of two 417 px columns (gap 28 → 445 offset).
  Each field: column with gap −4: label row (Regular 15 / lh 15 `#f5f1eb`,
  asterisk Regular 22 / lh 29 `#f0805f`, label row height 29) then 417 × 40
  input, stroke 1 `#3f2319` (border-strong), radius 3. Placeholder
  Regular 14 / lh 15 `#b39463`, inset 13 px. Select arrow
  `select-arrow-down.svg` 20 at right 8 px.
  - Row 1: Nome de exibição* · Apelido da carteira*
  - Row 2: Rede* (select, "Selecione uma rede") · Nome do perfil*
  - Row 3: Endereço da carteira* ("Endereço 0x da carteira") · (no label)
    "ENS ou carteira secundária (opcional)"
  - Row 4: Tipo de carteira* (select, "Selecione uma carteira") · Código de indicação*
  - Row 5: E-mail* · Nome ENS* — split: 78 × 40 suffix select ".eth"
    (Regular 15 `#f5f1eb`, arrow at x 53) + 10 gap + 329 × 40 input.
- Save Wallet Button: 131 × 40, fill `#d28a4c`, radius 3, "Salvar carteira"
  Bold 14 / lh 16 `#140d0a`.
- Secondary Wallet (column, gap 12): title row — "Carteira secundária"
  Bold 17 / lh 16; right group: 16 px circle stroke 1.5 `#d28a4c` + "Igual à
  carteira principal" Regular 14 / lh 16 `#f5f1eb` (gap 8) + "Adicionar"
  Medium 16 `#e89b55` (gap 8). Empty text Regular 14 / lh 15 `#cfb28c`:
  "Você ainda não adicionou uma carteira secundária."
