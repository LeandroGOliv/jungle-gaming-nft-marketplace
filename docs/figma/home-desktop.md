# Início — desktop · Products `70342:2831`

Source: `get_design_context` on `70342:2831` (2026-11-15). The verbatim
response could not be persisted in full before the Starter-plan MCP quota ran
out; every value from it is transcribed below. Screenshot:
[home-products-desktop](screenshots/home-products-desktop.png).

Assets (from the response, saved as provided):

| Figma constant  | Local file                       |
| --------------- | -------------------------------- |
| imgNftArtwork18 | `(not kept — see below)`         |
| imgNftArtwork03 | `(not kept — see below)`         |
| imgNftArtwork05 | `(not kept — see below)`         |
| imgNftArtwork09 | `(not kept — see below)`         |
| imgEllipse5     | not kept (CSS thumb)             |
| imgLine6        | not kept (CSS range)             |
| imgLine5        | not kept (CSS track)             |
| imgArrowDown2   | `public/icons/arrow-down-2.svg`  |
| imgLine3        | not kept (CSS underline)         |
| imgArrowRight2  | `public/icons/arrow-right-2.svg` |

## Layout

`Products` 1200 wide: row, `gap 48`, `items-start`.

- **Sidebar** `70410:3725`: column, `gap 24`, 310 wide.
- **Product Grid** `70342:2830`: flex-1, column, `gap 88`, `items-end`
  (pagination right-aligned). Inner `70342:2829`: column `gap 32`
  (toolbar → grid).

## Filters `70485:381` (310 wide)

Figma description: "collection checkboxes with counts, price range with
Apply, and network checkboxes … content identical on every screen".

- `bg surface-card #241612`, `p 20`, `overflow-clip`; groups column `gap 40`.
- Group: column `gap 12`. Title: 18 Bold, lh 16, `foreground #F5F1EB`.
- **Coleções** list: `px 12`; rows `justify-between`; label 15 Regular lh 40,
  count `(33)` 15 Bold lh 40 right-aligned. Active row (Arte digital) both in
  `text-accent #E89B55`; others `text-secondary #CFB28C`. Figma lists 9:
  Arte digital (33), Fotografia (12), Música (65), Arte 3D (39),
  Colecionáveis (23), Generativa (17), Jogos (19), Assinaturas (13),
  Utilidade (18).
- **Faixa de preço** controls: `pl 12`, column `gap 12`.
  - Slider row: thumb 15×15 (svg inset −20%), range line 161 wide (svg
    inset-top −4), thumb, track flex-1.
  - "Preço: 0,02 - 12,30 ETH": 15 Regular, lh normal, foreground.
  - Apply button "Aplicar": `bg primary #D28A4C`, `px 12 py 8`, radius 6,
    16 Bold lh 20, `ink #140D0A`.
- **Rede** list: `pl 12`, 15 Regular lh 40 `text-secondary`; counts Regular
  (not bold): Ethereum (119), Polygon (78), Solana (86).

## Featured NFT Banner `70410:3791`

- 310 × 470, `bg linear-gradient(to bottom, rgba(210,138,76,.1), rgba(210,138,76,.03))`,
  `pt 24 pb 4`, overflow-clip.
- Inner column `gap 16`: heading block column `gap 16` centred:
  - "NFT EM DESTAQUE": 24 Bold lh 32 `text-accent`, `px 20`, left.
  - "OFERTA LIMITADA": 22 Bold lh 16 `foreground`, centred, `px 20`.
  - Artwork 310 × 368, radius 22, object-cover (`nft-artwork-18.png`).
- Decorations (absolute): 22×22 square `border-2 #46a358` opacity .2 radius 7
  at (16, 299); 45×45 radius 29 at (248, 343) and 15×15 at (38, 105), both
  `linear-gradient(145.46deg, rgba(210,138,76,.3) 46.085%, rgba(210,138,76,0) 103.28%)`.

## Toolbar `70351:239`

- Row `justify-between items-center`, height 18.
- Tabs: 15 Medium lh 16, `gap 20`: active "Todos os NFTs" `text-accent`,
  others `foreground`. Underline under active tab: line at top 23, width =
  tab (101), 2 px (`tab-underline.svg`, inset-top −2).
- Sort (300 wide): "Ordenar por:" 15 Regular, value "Listados recentemente"
  15 Regular at x 110, arrow-down 16×16 at x 278 (`arrow-down-2.svg`).

## Grid Rows `70342:2828`

- Column `gap 72`; rows of 3 cards `justify-between` (cards 258 wide → gap
  34 inside 842).
- Card: column `gap 12`, 258 wide.
  - Media: 258 × 300 `bg surface-card`, artwork 250 × 250 radius 15 centred
    horizontally (x 4), ~25 from the top.
  - Name: 16 Regular lh 16 `foreground`.
  - Price: 18 Bold lh 16 `text-accent` ("1.19 ETH").
  - Discounted card: price row `gap 12`: current 18 Bold accent, previous
    18 Regular `secondary #B39463` (strike-through not drawn).
  - Rows 2–3 put name/price in a column `gap 6`.

## Pagination `70342:2825`

- Row `gap 8`. Each 35 × 35, radius 4.
- Active: `bg primary`, 18 Bold lh 16 `ink`.
- Others: `border 1 border #3F2319`, 18 Regular lh 16 `foreground`.
- Next: same bordered box, `p 8`, arrow-right 18×18 (`arrow-right-2.svg`).

## Other sections (REST)

Top `70353:242`, Promos `70353:241` and Blog `70343:253` were fetched later through the REST API: raw node JSON in [raw/70353-242.json](raw/70353-242.json), [raw/70353-241.json](raw/70353-241.json) and [raw/70343-253.json](raw/70343-253.json). Full-frame render: [home-desktop](screenshots/home-desktop.png).

The four artworks are the image fills `84592047` (emerald), `9df2ff42` (ivory), `2986a7cb` (violet) and `87580f2d` (golden) — identical to the WebP sources already in `public/images/`, so the PNGs were not kept. Promo and mobile-hero arrows: `public/icons/arrow-right.svg` (`5:99`) and `arrow-right-accent.svg` (`15:5295`).
