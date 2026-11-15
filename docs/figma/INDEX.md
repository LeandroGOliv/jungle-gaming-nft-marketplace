# Figma — frame map

Page `0:1` "Marketplace de NFTs GreenMint". Node ids are the same in the
original file and in the working copy (see the `figma-design` skill for the
file keys). Full layer tree with ids, positions and sizes:
[`page-structure.xml`](page-structure.xml) — grep it for a frame id to find
the child nodes before fetching anything.

Desktop frames are 1440 wide with a 1200 content column (120 px gutters).
Mobile frames are 414 × 896.

| Screen                 | Viewport | Node      | Size        | Top-level sections                                                                                               | Spec | Screenshot |
| ---------------------- | -------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------- | ---- | ---------- |
| Início                 | desktop  | `2:2`     | 1440 × 3668 | Top `70353:242`, Products `70342:2831`, Promos `70353:241`, Blog `70343:253`, Footer `70492:696`                 | —    | —          |
| Detalhes do NFT        | desktop  | `10:244`  | 1440 × 2246 | Top `70342:2770`, Description `70342:2780`, Related Products `70364:239`, Footer                                 | —    | —          |
| Carrinho de NFTs       | desktop  | `11:1278` | 1440 × 1754 | Top `70371:250`, Related Products `70371:239`, Footer                                                            | —    | —          |
| Pagamento              | desktop  | `11:2862` | 1440 × 1657 | Checkout Page `70522:3321`, Footer                                                                               | —    | —          |
| Confirmação de Pedido  | desktop  | `11:4385` | 1440 × 1657 | Order Confirmation Modal `70376:239` (578 × 821) over the checkout page                                          | —    | —          |
| Login                  | desktop  | `9:115`   | 1440 × 1981 | Sign In Modal `70381:239` (500 × 600) over the marketplace page                                                  | —    | —          |
| Cadastro               | desktop  | `9:1022`  | 1440 × 1981 | Sign Up Modal `70383:239` (500 × 656) over the marketplace page                                                  | —    | —          |
| Perfil do Colecionador | desktop  | `9:1238`  | 1440 × 1080 | Top `70386:264`                                                                                                  | —    | —          |
| Carteiras              | desktop  | `9:1670`  | 1440 × 1080 | Top `70390:267`                                                                                                  | —    | —          |
| Início                 | mobile   | `14:5226` | 414 × 896   | Search Bar `70395:239`, Hero Banner `70395:240`, Tabs `70395:241`, Product Grid `70395:242`, Tab Bar `70395:245` | —    | —          |
| Detalhes do NFT        | mobile   | `15:5536` | 414 × 896   | Hero `70396:241`, Details Sheet `70396:242`, Buy Bar `70396:245`                                                 | —    | —          |
| Carrinho de NFTs       | mobile   | `16:360`  | 414 × 896   | Content `70397:239`, Payment Summary `70397:245`                                                                 | —    | —          |
| Pagamento              | mobile   | `16:748`  | 414 × 896   | Content `70398:239`                                                                                              | —    | —          |
| Login                  | mobile   | `16:1022` | 414 × 896   | Logo, Title, Form `70399:241`, Sign In Button, Mobile Social Block, Signup Link                                  | —    | —          |
| Cadastro               | mobile   | `16:1228` | 414 × 896   | Logo, Title, Form `70399:250`, Create Profile Button, Mobile Social Block, Login Link                            | —    | —          |

## Shared components

| Component                          | Node                    | Spec                               | Screenshots                                                                                              |
| ---------------------------------- | ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Header With Divider / Header Row   | `70522:3240`            | [layout-shell.md](layout-shell.md) | [header-desktop](screenshots/header-desktop.png)                                                         |
| Footer                             | `70492:696`             | [layout-shell.md](layout-shell.md) | [footer-desktop](screenshots/footer-desktop.png)                                                         |
| Mobile Search Bar · Mobile Tab Bar | `70395:239` `70395:245` | [layout-shell.md](layout-shell.md) | [search-bar-mobile](screenshots/search-bar-mobile.png), [tab-bar-mobile](screenshots/tab-bar-mobile.png) |

No mobile frame exists for Confirmação de Pedido, Perfil do Colecionador and
Carteiras — derive them from the desktop frames and the mobile component
language.

"—" in Spec/Screenshot means not fetched yet. When a frame is fetched, save
`<screen>-<viewport>.md` and `screenshots/<screen>-<viewport>.png` and link
them here.

## Assets

The file has only **4 unique NFT artworks**; every artwork layer (`NFT Artwork NN`,
`NFT Collection Artwork NN`, `NFT Cart Artwork N`, `Mobile NFT Artwork N`, promo
cards) reuses one of them. Fetched with `download_assets` on Products
`70342:2831`, Detalhes do NFT `10:244` and Promos `70353:241` — no need to
fetch other sections for artwork.

Source PNGs are 1254 × 1254 (~2 MB). With the user's approval they were
converted to WebP (quality 0.82) at 400 and 800 px:

| File (`public/images/`)              | Subject                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `nft-artwork-emerald-{400,800}.webp` | Green varsity jacket, round sunglasses (Emerald Ape) |
| `nft-artwork-violet-{400,800}.webp`  | Purple hoodie, bucket hat (Violet Nomad)             |
| `nft-artwork-ivory-{400,800}.webp`   | Cream blazer, green turtleneck (Ivory Baron)         |
| `nft-artwork-golden-{400,800}.webp`  | Golden fur, green headphones (Golden Beat)           |
