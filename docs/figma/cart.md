# Carrinho de NFTs — desktop `11:1278` · mobile `16:360`

Read on 2026-11-15 through the Figma **Plugin API in the browser editor**
(`figma.getNodeByIdAsync` in the page console of the working copy), because
REST was rate-limited and the MCP quota was exhausted. Values are exact node
properties (fills, strokes, radii, effects, text styles), only the first row of
each repeated list was dumped. Screenshots: [desktop top](screenshots/cart-desktop.png),
[related](screenshots/cart-related-desktop.png), [mobile](screenshots/cart-mobile.png).

Notation: `AL:` auto layout `gap` / padding `t,r,b,l` / `primary/counter` alignment;
`lh=16P` line height 16 px; font family is always Roboto Mono.

## Desktop — Top `70371:250` (header row + Cart `70369:239`)

```
Cart 1200x416 AL:VERTICAL gap12
  Breadcrumb "Início / Mercado / Carrinho"  #f5f1eb Bold 15 lh16
  Cart Body 1200x388 AL:HORIZONTAL SPACE_BETWEEN/MIN
    Cart Table 782x274 AL:VERTICAL gap12
      Table Header 782x16 pr24 SPACE_BETWEEN/CENTER — columns at x 0 (250w), 311.25 (77w), 449.5 (75w), 585.75 (87w), 734 (24w)
        "NFTs" Bold 16 lh16 · "Preço" Medium 16 · "Edições" Bold 16 · "Total" Medium 16 — all #f5f1eb
      Line 782 stroke #d28a4c w0.3
      Cart Items AL:VERTICAL gap12
        Cart Item 782x70 fill #241612, pr24 — inner row 758x70 SPACE_BETWEEN/CENTER
          artwork 70x70 r6 · gap16 · name #f5f1eb Bold 16 lh16 / gap6 / "ID do token: #0042" #b39463 Regular 14 lh16
          unit price "1.19 ETH" #cfb28c Bold 16 lh16
          stepper 75x30 AL:H gap12: button 20x30 fill #d28a4c stroke #140d0a w1 inside r20
                  shadow 0,4 b12 s-2 #140d0a@0.15, 16px icon (minus 9.33x1.33 / plus 9.33x9.33, #000)
                  value #f5f1eb Regular 17 lh24
          line total "2.38 ETH" #e89b55 Bold 16 lh16
          delete 24x24 icon "Iconly/Curved/Delete" stroke #b39463 1.5 → public/icons/cart-delete.svg
    Wallet Summary 332x388 AL:VERTICAL gap24
      Heading AL:V gap12: "Resumo da carteira" #f5f1eb Bold 18 lh16 + line #d28a4c w0.3
      Promo Code AL:V gap8: label "Código promocional" #f5f1eb Bold 14 lh16
        input 332x40 stroke #d28a4c w1 inside r3, pl8: placeholder #b39463 Regular 12 lh16
        button "Aplicar" 102x40 fill #d28a4c r 0,3,3,0, text #140d0a Bold 15 lh16
      Fees AL:V gap12 (rows SPACE_BETWEEN)
        label Regular 15 lh auto #f5f1eb; values Regular 18 lh16 #f5f1eb right ("26.83 ETH", "0.016 ETH")
        discount value "(-) 00.00" Regular 15 lh auto #f5f1eb
        "Taxa estimada" #e89b55 Regular 12 lh16, right, 12 below the fee row
      Total: "Total" #f5f1eb Bold 16 lh16 · "26.846 ETH" #e89b55 Bold 18 lh16 right
      Checkout CTA AL:V gap12 center
        button 332x40 fill #d28a4c r3 "Conectar e finalizar" #140d0a Bold 15 lh16
        link "Continuar explorando" #e89b55 Regular 15 lh auto
```

Vertical rhythm: Top frame starts 24 below the page top (header row 45, then 32 to the Cart).

## Desktop — Related Products `70371:239` (y 613, 96 below the Top)

Same card grid as the detail's "Mais desta coleção" (5 × 219 wide, 255 artwork
box, gap ~26). Heading `70371:240`: "Colecionadores também viram" #e89b55 Bold 17
lh16, line 1200 #d28a4c w0.3 12 below; cards 32 below the line.

## Mobile `16:360` (414 × 896, fill #140d0a)

```
Content AL:VERTICAL gap12 px28, starts y32
  Screen Header 358x44: back 35x35 ellipse fill #2f1d15 stroke #3f2319 w1 + Arrow-Left 2 (20x20);
    title "Carrinho de NFTs" #f5f1eb Bold 20 lh16 at x96 y9 (visually centred)
  Cart Items AL:VERTICAL gap20
    Item 358x100 fill #241612 r14 shadow 0,6 b20 #0a0604@0.45
      artwork 100x100 r 14,0,0,14 (left edge)
      name x109 y13 #f5f1eb Bold 15 lh16
      "Edição: 1/50" y35 #cfb28c Regular 14 lh16
      price y69 #e89b55 Bold 18 lh16  (line total: item 3 shows 3.58 = 2 × 1.79)
      stepper at x261 y38 81x29: buttons 24x24 fill #2f1d15 stroke #3f2319 w1 r29
        minus line 8.88 stroke #55321f w2 (disabled look at qty 1) / "+" #f5f1eb Regular 21
        value #f5f1eb Regular 16 lh22
      delete icon 24x24 drawn at x313 y282 in item 3 — overlaps the "+"; a layout slip in the frame
Payment Summary 414x342 fill #241612 r 40,40,0,0, AL:V p24,24,36,24 SPACE_BETWEEN
  block AL:V gap12
    Promo Input 366x50 fill #241612 stroke #3f2319 w1 r40 shadow 0,6 b20 #0a0604@0.45, pl16
      placeholder #b39463 Regular 13 lh22
      "Aplicar" 97x50 r40 fill linear #d28a4c@0.54 → #d28a4c@1, text #f5f1eb Bold 15 lh16
    Subtotal / Desconto / Taxa de rede rows: labels Regular 15 lh auto; values Regular 16 lh16 right
    "Taxa estimada" #e89b55 Regular 12 lh16 right, directly under the fee row
    Total: "Total" Bold 16 · value #e89b55 Bold 18
  Checkout Button 366x60 r40 fill linear #d28a4c@1 → #d28a4c@0.8, "Conectar e finalizar" #140d0a Bold 16 lh16
```
