# Login e Cadastro — desktop (modais) e mobile (telas)

Nodes: Sign In Modal `70381:239`, Sign Up Modal `70383:239` (desktop, over the
marketplace page in frames `9:115` / `9:1022`), Mobile / Login `16:1022`,
Mobile / Cadastro `16:1228`. Raw: [`raw/70381-239.txt`](raw/70381-239.txt),
[`raw/70383-239.txt`](raw/70383-239.txt), [`raw/16-1022.txt`](raw/16-1022.txt),
[`raw/16-1228.txt`](raw/16-1228.txt).

## Desktop modal (500 wide)

- Card `surface-card` `#241612`, 500 × 600 (login) / 656 (sign-up). The sign-up
  modal has `rounded-[8px]` + `overflow-clip`; the sign-in modal has no radius.
- Positioned at x 470 (centred in 1440), y 160 / 158 from the frame top.
- Overlay layer `BG` 9:945 has **no fill**: the page behind is not dimmed.
- Bottom strip: `primary` bar, full width, **10 px** high, flush with the bottom.
- Close `X` 18 × 18 (`public/icons/close.svg`, fill `#D28A4C`), top 11/13 px,
  right 12/13 px.
- **Header**: `pt-48`; column `gap-40`, `px-48`:
  - Tabs row `gap-8`: "Entrar" | 1 px `text-coral #F0805F` divider (row height 20) |
    "Criar conta" — Title/20 Medium (20 / 500 / lh 16). Active tab `text-accent`,
    inactive `foreground`.
  - Subtitle Caption/13 Regular · lh 16, `foreground`, centred, 404 wide.
    - Login: "Entre para gerenciar sua carteira, coleção e perfil de criador."
    - Sign-up: "Crie seu perfil de colecionador e conecte uma carteira quando quiser."
- **Form**: `pt-24 px-80`, fields `gap-12`, each 340 × 40, `rounded-[5px]`,
  1 px `border #3F2319`, `px-16`; placeholder Body/14 Regular · lh 16 in
  `secondary #B39463`; typed value Body Large/16 Regular · lh 16 `foreground`.
  Focused/filled field border is `primary` (the password field in the login frame).
  - Login: "contato@email.com", password ("***********") with eye-slash icon.
  - Sign-up: "Nome de usuário", "Digite seu e-mail", "Senha" (with icon), "Confirmar senha" (no icon).
  - Eye-slash `Iconly/Curved/Hide`: 22.67 × 20 box at right 16 px, glyph
    18.98 × 14.65, stroke 1.5 `#B39463`.
  - Login only: "Esqueceu a senha?" right-aligned, Body/14 Regular · lh 16, `text-accent`.
- **CTA**: `pt-24 px-80`; button 340 × 45, `rounded-[5px]`, `primary`, label
  Body Large/16 Bold · lh 16 in `ink` ("Entrar" / "Criar conta").
- **Social**: `pt-24`, column gap 12 (login) / 16 (sign-up):
  - Divider full modal width: two 1 px `#3F2319` lines, `gap-12`, label
    "Ou continue com" Caption/13 Regular · lh 16 `foreground`.
  - Buttons `px-80`, gap 12 (login) / 16 (sign-up): 340 × 40, `rounded-[5px]`,
    1 px `border`, content `gap-12`: 20 px brand mark + Caption/13 Medium (13 / 500
    / lh 16) `text-secondary #CFB28C`: "Continuar com Google", "Continuar com Facebook".

## Mobile screen (414 × 896)

- Background `ink`, `pt-80 pb-24 px-28`, column `gap-40`, content width 358.
- Logo block 136 high, "KURIO" Display/32 Bold, tracking 3.2 px, `foreground`, centred.
- Title centred, `foreground`: "Entrar" Title/20 Bold · lh 16; "Criar perfil de
  colecionador" Body Large/18 Bold · lh 16.
- Form `gap-12`: fields 358 × 50, `rounded-[10px]`, 1 px `border`, `px-16`,
  placeholder Body/14 Regular `secondary`; focused field border `primary`.
  - Login: "contato@email.com", password with eye-slash; "Esqueceu a senha?" right.
  - Sign-up: "Nome de usuário" (placeholder **centred** in the frame), "Digite seu
    e-mail", "Senha" and "Confirmar senha" — both with the eye-slash.
  - Mobile eye-slash: 18 × 18, stroke `border-soft #55321F`.
- Primary button 358 × 60, `rounded-[10px]`, `primary`, Body Large/16 Bold `ink`
  ("Entrar" / "Criar perfil").
- Mobile Social Block `70504:2994`: divider (`gap-10`, lines `#3F2319`) +
  buttons (`gap-16`, same Social Button as desktop, full width), block `gap-12`.
- Footer link Body/15 Regular (lh auto) `text-secondary`, centred:
  "Novo na Kurio? Crie uma conta" / "Já tem uma conta? Entre".
- No tab bar and no header on these frames.

## Tokens added

`text-coral #F0805F` (tab divider), `Logo/Facebook #3B5999` (inside the SVG).
