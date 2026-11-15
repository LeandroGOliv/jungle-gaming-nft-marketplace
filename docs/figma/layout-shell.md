# Layout shell — header, footer, mobile search bar and tab bar

Fetched with `get_design_context`. This is a summary; the verbatim responses,
with every measurement, are in `raw/` (`70522-3240`, `70492-696`, `70395-239`,
`70395-245`). Assets saved under `public/icons/` (SVGs as returned by Figma,
unmodified). Screenshots in `screenshots/`.

## Header (desktop) — `Header With Divider` `70522:3240` / `Header Row` `70486:560`

Screenshot: [`screenshots/header-desktop.png`](screenshots/header-desktop.png)

Figma component notes:

- **Header With Divider** (`70504:3017`): Header Row + 0.3 px hairline
  (stroke `primary`; drawn as a CSS border, SVG not kept) beneath. Used on Início, Perfil,
  Carteiras and the marketplace page behind Login/Cadastro. **Market screens
  (Detalhes, Carrinho, Pagamento, Confirmação) use the bare Header Row, no
  divider.**
- **Header Row**: 1200 wide. Active nav item = Início on Início / Entrar /
  Criar conta / Perfil / Carteiras; Mercado on the four market-flow screens.
  Badge count = cart item count.

Layout (`justify-between`, `items-start`, height 45 incl. divider):

| Part           | Spec                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logo           | 160 × 34.3 box, text `KURIO` at top 8.15 — Body/14 Bold (14/auto, tracking 1.4 px = 10%), `foreground`                                                                   |
| Nav            | `gap-40`, items: Início · Mercado · Criadores · Aprenda — 16 px, lh auto                                                                                                 |
| Nav — active   | Body Large/16 Bold, `text-accent`; column `gap-24` then underline 58 × 3 px (stroke `primary`; CSS, SVG not kept), width = item box (58)                                 |
| Nav — inactive | Body Large/16 Regular, `foreground`                                                                                                                                      |
| Actions        | `gap-28`, `items-center`: search 20 × 20 (`search.svg`), cart, login button                                                                                              |
| Cart           | icon 24 × 24 (`cart.svg`); badge 16 × 16 circle at left 15 / top 0 (fill `primary`, 2 px `ink` ring; CSS, SVG not kept); count Tiny/10 Medium `ink` at left 20 / top 1.5 |
| Login button   | 100 × 35, `primary` bg, radius 6; content `gap-4`: icon 20 × 20 (`login.svg`, stroke `ink`) + `Entrar` Body Large/16 Medium `ink`                                        |

## Footer (desktop) — `70492:696` (component `70491:1286`)

Screenshot: [`screenshots/footer-desktop.png`](screenshots/footer-desktop.png)

Identical on every screen. Last child of the screen, FILL width (1200).
Three stacked bands, then the copyright line:

1. **Features band** — `surface-card`, h 250, p 32; row `justify-between items-end`, width 1154.
   - 3 medallion columns (first `flex-1`, others 264.667 wide), each `px-16`, inner column `gap-12`:
     circle 74 × 74 `primary` (radius 37) with letter (W / C / D) Heading/24 Bold `ink`;
     title Body Large/17 Bold (17/16) `foreground`; text Body/14 Regular · lh 22 `text-secondary`, width 204.
     - W · Segurança da carteira · Proteja sua carteira e colecione arte digital verificada com confiança.
     - C · Criadores em destaque · Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
     - D · Alertas de lançamentos · Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
   - Vertical 1 px dividers `primary`, full height, between the columns.
   - Newsletter column 357 wide, `px-16`, `gap-12`: inner `gap-16` with title
     "Antecipe-se ao próximo lançamento" Body Large/18 Bold · lh 16 `foreground`;
     field h 40, `surface-dark`, radius 6, `pl-12`, drop-shadow `0 0 10px rgba(10,6,4,.45)`,
     placeholder "digite seu e-mail..." Body/14 Regular · lh 16 `secondary`;
     button 85 × 40 `primary`, radius right 6, `pl-16 pr-4`, "Enviar" Body Large/18 Bold · lh 16 `ink`;
     caption "Receba lançamentos selecionados, histórias de criadores e novidades do mercado." Caption/13 Regular · lh 22 `text-secondary`.
2. **Brand band** — `surface-dark`, h 88, p 32; row `gap-92 items-center`, 4 cells (3 × `flex-1`, last 228):
   `KURIO` (Body/14 Bold, tracking 1.4) · "Feito para colecionadores,⏎criadores e cultura" (14/22) ·
   `contato@email.com` (mailto, 14/22) · `+55 11 4002 8922` (14/22). All `foreground`.
3. **Links band** — `surface-card`, h 236, p 32; row `gap-124 items-start`; 3 link columns (`flex-1`, `gap-8`)
   - a 228 column. Column title Body Large/18 Bold · lh 16; links Body/14 Regular · lh 30. All `foreground`.
   * Meu perfil: Meu perfil · Minha coleção · Atividade · Estúdio do criador · Lista de interesse
   * Central de ajuda: Central de ajuda · Como comprar NFTs · Carteira e segurança · Política do mercado · Denunciar item
   * Coleções: Arte digital · Fotografia · Música · Arte 3D · Utilidade
   * Last column (`gap-32`): "Redes sociais" (190 wide, `gap-20`) + 5 icons 30 × 30, `gap-10`
     (`social-{facebook,instagram,twitter,linkedin,youtube}.svg`: 1 px `primary` outline, radius 4.5);
     "Carteiras compatíveis" (`gap-12`) + chip h 26, `surface-dark`, 1 px `border-soft`, radius 6,
     text `METAMASK  •  WALLETCONNECT  •  COINBASE` Tiny/9 Bold (tracking 0.1) `text-accent`.
4. **Copyright** — 6 px gap above, "© 2026 Kurio. Propriedade digital para todos." Body/14 Regular · lh 30 `foreground`, centred, on the page bg.

## Mobile search bar — `70395:239` (Mobile / Início)

Screenshot: [`screenshots/search-bar-mobile.png`](screenshots/search-bar-mobile.png)

366 × 45 at x 24 / y 40 of the 414 frame.

- Field 313 × 45, `surface-card`, radius 10, `pl-12 py-12`; content `gap-8`: icon 22 × 22
  (`search-mobile.svg`) + "Explorar coleções" Body/14 Bold · lh 16 `secondary`.
- Filter button 45 × 45 at x 321 (gap 8), radius 14, `p-12`, background
  `linear-gradient(137.05deg, rgba(210,138,76,.45) 24.6%, #d28a4c 100%)`; icon 22 × 22 (`filter.svg`, stroke `ink`).

## Mobile tab bar — `70395:245` (Mobile / Início)

Screenshot: [`screenshots/tab-bar-mobile.png`](screenshots/tab-bar-mobile.png)

414 × 126 at y 770 (bottom of the 896 frame). Appears only on Mobile / Início:
Detalhes uses a Buy Bar (`70396:245`) and Carrinho a Payment Summary
(`70397:245`) in the same slot.

- Background: `tab-bar-bg.svg` — `surface-card` shape 414 × 95 at y 31 with a
  concave notch centred under the button; drop-shadow `0 -10px 30px rgba(10,6,4,.45)`
  (the SVG carries a 30 px filter margin: 474 × 154.95, offset −30/−40).
- Centre button: circle 65 × 65 at x 175 / y 0 (`tab-scan-circle.svg`, vertical
  gradient `primary` 40% → 100%); scan glyph 26.8 × 24 at x 194 / y 21, 5 vectors
  (`foreground` fill), offsets inside the group: `tab-scan-corner-tl` (1.33, 0),
  `tab-scan-corner-tr` (15.11, 0.08), `tab-scan-line` (0, 11.1),
  `tab-scan-corner-bl` (1.33, 13.69), `tab-scan-corner-br` (15.11, 13.7). The
  group export (`15:5529`) bakes the frame background in, so it is not usable.
- Icons 20 × 20 at y 71: Home x 36 (`tab-home.svg`, active, `text-accent`),
  Heart x 108 (`tab-heart.svg`), Shop x 292 (`tab-shop.svg`), User x 354
  (`tab-user.svg`) — inactive in `text-secondary`. No labels.
