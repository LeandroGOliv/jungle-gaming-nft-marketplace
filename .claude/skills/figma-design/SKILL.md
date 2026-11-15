---
name: figma-design
description: >-
  Reads this project's Figma file — frame specs, design tokens, assets and
  reference screenshots — and caches them under `docs/figma/`. Use BEFORE
  creating or restyling any screen or UI component, when extracting
  colours/typography/spacing into the Tailwind theme, when exporting images or
  icons, and when comparing an implementation against the design.
---

# Figma design access

The design is the source of truth for visuals, and fidelity to it is the
largest scoring item. Never style from memory or approximation: every size,
colour, radius, font and gap comes from the file.

- **Working copy** (use this key for every API/MCP call): `wBEN1yQVDsVH0Kr3cbYPlT`
  — the user's duplicate, needed because the MCP only reads files the user can
  edit.
- **Original** (view-only; the link to cite in issues, PRs and docs):
  https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1
- Node ids are identical in both. A URL's `node-id=12-345` is node id `12:345`.
- The account is on Figma's Starter plan, so MCP calls are scarce.

## Cache first

Each node is fetched **once** and persisted:

```
docs/figma/
├── INDEX.md           # frame map: screen → node id → viewport → cached files
├── page-structure.xml # full layer tree (ids, names, positions, sizes) — grep, don't read whole
├── tokens.md          # colours, typography, spacing, radii, shadows, breakpoints
├── <screen>-<viewport>.md  # per-frame spec: a readable summary of the raw response
├── raw/<node-id>.txt  # verbatim `get_design_context` code (`raw/<node-id>.json` for REST)
└── screenshots/<screen>-<viewport>.png
```

`raw/` is the measurement source of truth: every px, inset, gap, radius,
shadow and text style exactly as Figma returned it. The spec is a summary and
drops detail; when a value is not in the spec, read it from `raw/` instead of
re-fetching. Screenshots are a visual target only: `get_screenshot` downscales
to 1024 px by default, so a distance measured on the image is an estimate —
take measurements from `raw/` or `page-structure.xml`.

1. Read `docs/figma/INDEX.md`. If the frame you need is cached, work from the
   cache and stop here.
2. Otherwise fetch it (below), then write the raw response, the spec, the
   screenshot and the `INDEX.md` row **before** using the result, so the call
   is never repeated. Name the raw file after the node id with `:` → `-`
   (`raw/70492-696.txt` — `.txt` keeps it out of tsc, ESLint and Prettier),
   keep the code exactly as returned, and add a header
   comment mapping each temporary asset URL constant to the local file it was
   saved as — the URLs expire in 7 days.
3. Re-fetch a cached node only when the user says the design changed.

Fetch the narrowest node that answers the question — one frame or component,
never the whole page.

## Fetching — Figma MCP (preferred)

The `figma` plugin's MCP server (`mcp__plugin_figma_figma__*`). If only
`authenticate` is exposed, call it and hand the user the URL; the real tools
appear once they authorise.

Invoke the `figma:figma-design-to-code` skill before the first
`get_design_context` call of a session — it is that tool's mandatory
prerequisite. Then, per node:

- Call `create_session` with the working-copy key first and pass its
  `sessionId` to the calls below.
- `get_metadata` — structure/ids; already cached for the whole page in
  `page-structure.xml`, so it is rarely needed again.
- `get_design_context` — full spec of one frame/component.
- `get_screenshot` — the reference image.
- `get_variable_defs` — tokens bound to the node.

The MCP returns React + Tailwind as a _reference_. Treat it as a spec to
translate into this project's shadcn primitives and theme tokens, not as code
to paste.

## Fetching — REST fallback

When the MCP is unavailable or out of quota, use the REST API with the
personal access token in the repo-root `.env.local` (`FIGMA_TOKEN`,
git-ignored). If the variable is missing, ask the user to create one (Figma →
Settings → Security → Personal access tokens, scope `file_content:read`).

```bash
set -a; . ./.env.local; set +a
KEY=wBEN1yQVDsVH0Kr3cbYPlT

# structure of a page/frame (raise depth gradually)
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" "https://api.figma.com/v1/files/$KEY/nodes?ids=0:1&depth=2"

# full spec of one node
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" "https://api.figma.com/v1/files/$KEY/nodes?ids=<id>"

# render nodes (returns temporary URLs to download)
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" "https://api.figma.com/v1/images/$KEY?ids=<id>&format=png&scale=2"
```

Save the node JSON to `docs/figma/raw/<node-id>.json` and query it with
`jq`/a script instead of printing it.

## Fetching — browser Plugin API (last resort)

When REST answers 429 (its `Retry-After` can be days) and the MCP quota is
spent, open the working copy in Chrome (`claude-in-chrome`) and run the Plugin
API from the page console: `await figma.getNodeByIdAsync(id)` exposes fills,
strokes, radii, effects, auto layout and text styles, and
`node.exportAsync({ format: 'SVG_STRING' })` exports icons. Tool output is
truncated near 1000 characters, so build the dump into a `window` variable and
read it in slices. Summarise it into the spec as usual.

## Translating to code

- **Tokens** go into the Tailwind v4 `@theme` (and the shadcn CSS variables)
  once, named after the Figma variable/style. Components use the token
  utilities; an arbitrary value (`text-[13px]`, `bg-[#1a1a1a]`) is justified
  only when the design has a true one-off.
- **Assets**: `download_assets` on a section frame returns up to 20 original
  images and 20 SVGs per call — fetch by section, not by layer. Save them to
  `public/images/` with kebab-case names taken from the layer
  (`nft-artwork-03.png`), as provided: do not resize, convert or compress
  unless the user asks. No hotlinked Figma URLs — they expire. Fonts are
  self-hosted.
- **Responsive**: desktop and mobile frames are both specs. Tablet (768) and
  screens without a mobile frame (profile, wallets, confirmation) are derived
  from the same components and spacing scale.
- **Undrawn states** (loading, empty, error, disabled, focus) reuse the file's
  tokens and component language.
- Anything you cannot reproduce exactly — a missing asset, a contrast fix —
  is recorded as a deviation in `ARCHITECTURE.md`.

## Done when

The frame is cached in `docs/figma/` (raw response, spec and screenshot),
`INDEX.md` lists it, and every value used in the implementation traces to
`raw/`, the spec or `tokens.md`.
