# Perfil do Colecionador — desktop (`9:1238`)

Same shell as Carteiras: header, then Body `70386:263` = Account Sidebar (310 wide,
see [wallets-desktop](wallets-desktop.md)) + 28 px gap + Profile Form `70386:239`
(862 wide). Measurements: [raw/70386-239.txt](raw/70386-239.txt) (Plugin API dump).

- Form: vertical stack, gap 32 — title, Fields, Change Password, Save button.
- Title "Perfil do colecionador": Roboto Mono Bold 16/16, `#f5f1eb`.
- Fields: three rows (gap 24), two 417 px columns 28 px apart. Field = label row
  (Regular 15/15 + red `#f0805f` "*" at 22/29) then 10 px, then 40 px input
  (1 px `#3f2319` border, radius 3).
  - Row 1: Nome de exibição*, Nome de usuário*
  - Row 2: E-mail*, Nome ENS* (78 px ".eth" select box + 10 px + 329 px input)
  - Row 3: Apelido da carteira*, Avatar (no asterisk)
- Avatar: 50 px circle (`#2f1d15` fill, `#3f2319` border) with the 24 px image icon
  (`public/icons/profile-avatar-image.svg`), 24 px gap, primary button "Alterar"
  (98×40, `#d28a4c`, Bold 14 `#140d0a`), 20 px gap, text button "Remover" (Regular 14).
- Change Password (gap 24): "Alterar senha" Medium 16, then three fields (label
  Regular 15, 12 px gap, Password Input 417×40 with the eye toggle, padding 16):
  Senha atual, Nova senha, Confirmar nova senha.
- One "Salvar" button at the bottom: 131×40, `#d28a4c`, Bold 14 `#140d0a`.

No screenshot cached (fetched via the browser fallback).
