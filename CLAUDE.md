# NFT Marketplace — Frontend Challenge

A React + TypeScript NFT marketplace built as a hiring challenge. It is a
frontend-only deliverable: every API, the session, wallets, payments and
realtime events are **simulated with MSW**. There is no backend.

**`desafio.md` (repo root) is the spec.** It defines behaviours, required
scenarios, the scoring table and the eliminatory criteria. Read the relevant
section before implementing or reviewing anything; when this file and
`desafio.md` disagree, `desafio.md` wins. The Figma file defines the visuals —
reach it through the `figma-design` skill.

**Status:** fresh TanStack Router scaffold, no feature code yet. The
architecture below is the intended target; refine it as real features land.

## Repo layout

The app lives at the repo root, next to `desafio.md` and `docs/figma/` (cached
design specs, see the `figma-design` skill). Scripts are in `package.json`;
use `pnpm`, never `npm`/`yarn`.

## Stack

Mandatory (each must do real work in the solution — a mandatory tool that is
installed but unused is eliminatory): React 19, TypeScript, TanStack Router
(file-based), TanStack Query, Axios, Socket.IO (`socket.io-client`), Tailwind
CSS v4, shadcn/ui, MSW (+ `@mswjs/socket.io-binding`), Playwright, Lighthouse.

Complementary choices: Vite, pnpm, React Hook Form + Zod for forms.

## Eliminatory rules

Any of these fails the whole challenge. Treat a violation as a bug, not a
trade-off:

1. **Flows are functional, never visual-only.** Every screen in scope reads and
   writes through the simulated API.
2. **An order is confirmed only by the simulation's response** — the receipt
   renders from the order snapshot returned by the API, never from local state.
3. **User data is isolated.** Private queries are keyed by user; logout and
   user switch clear the private cache and the previous session's socket
   subscriptions.
4. **Realtime goes through `socket.io-client`.** Tests and mocks emit real
   Socket.IO events; nothing calls a setter, a callback or the query cache
   directly to fake one.
5. **Fake data lives only in the MSW layer.** Components, hooks and the Axios
   client hold no mock responses and no alternate business paths.
6. **E2E tests are runnable** from a clean checkout against the mocks.

## Architecture conventions

Code is organised by **feature** under `src/features/{feature}/`:

```
src/features/cart/
├── contracts/   # exact REST + socket event shapes — the single source of truth for types
├── schemas/     # Zod form schemas
├── services/    # Axios calls, one thin function per endpoint
├── hooks/       # TanStack Query hooks (queries, mutations, query keys)
├── rules/       # pure logic, no React/network (e.g. ETH decimal math)
├── components/
└── index.ts     # the feature's public API (barrel)
```

Outside `features/`: `src/components/ui/` (shadcn primitives, restyled to the
Figma), `src/lib/` (generic helpers and the shared Axios instance, socket
client, query client), `src/routes/` (file-based routes), `src/mocks/` (MSW
handlers, fixtures, scenarios, socket simulation).

- **Contracts are shared, never duplicated**: services, hooks, components and
  the MSW handlers all import the same `contracts/` types. No mappers unless
  the shape genuinely differs.
- **Dependency direction**: `rules/` only `import type`s from `contracts/`;
  `services/` never imports `rules/`; cross-feature imports go through the
  target's `index.ts`.
- **HTTP only through Axios**: components and hooks call the feature's
  `services/`, which use the shared Axios instance. Query functions forward the
  `signal` so stale requests are cancelled.
- **URL is state** for catalogue search, filters, sort and pagination:
  validated search params on the route, filter changes reset the page.
- **Routing groups**: `_authenticated` (guard redirects to login carrying the
  return location), `_unauthenticated` (login/sign-up), `_public`.
- **Forms**: `useForm` + `zodResolver`, fields through `<Controller>` into the
  shadcn primitives; API validation errors are mapped back onto the fields.
- **Money**: ETH values are decimal **strings** end to end. Do arithmetic with
  a decimal/bigint approach in `rules/` — never `Number`/`parseFloat`. The API
  quote is the reference for totals; the client displays, it does not decide.
- **Orders**: one idempotency key per purchase attempt, reused across retries,
  timeouts and refresh.
- **Realtime events** carry id, resource and version: drop duplicates and any
  version not newer than the one held; reconcile active resources over REST
  after reconnect; release listeners on cleanup. Confirmed/refused orders are
  terminal.
- **Every data-dependent view** renders loading (shimmer skeleton with the
  final dimensions, honouring `prefers-reduced-motion`), empty, error with
  retry, success and background-refresh states.

## Design fidelity

Visual fidelity and responsiveness are the largest scoring item (20 pts).
Build UI from the Figma, not from memory: invoke the `figma-design` skill
before creating or restyling any screen or component. Verify at 390, 768 and
1440 px. States the Figma does not draw follow the same visual language.
Record every deviation from the Figma, asset substitution and accessibility
adjustment in `ARCHITECTURE.md`.

## Testing

Playwright E2E against the MSW mocks is the test layer the spec scores
(`desafio.md` §9 lists the twelve required scenarios, the viewports and the
visual-regression pages). A flow is done when its E2E scenario exists and
passes. Each test starts from an isolated, reset mock state and controls
clock, latency and event emission; assertions observe the UI.

Pure `rules/` logic gets a co-located unit test written first.

## Development workflow

### Branch naming

`<type>/<issue-number>-<slug>` for a branch that addresses a GitHub issue —
e.g. `feature/12-cart-coupon`. `<type>` is a short verb (`feature`, `fix`,
`chore`, `refactor`, ...). A branch with no issue skips the number.

### Agents and skills

- `figma-design` (skill) — reads the Figma file (specs, tokens, assets,
  screenshots) and caches the result under `docs/figma/`.
- `creating-github-tasks` (skill) — opens GitHub issues for this repo.
- `review-orchestrator` (skill) — entry point for code review; routes to
  `frontend-code-quality-reviewer`, `react-reviewer`, `data-sync-reviewer`,
  `ui-fidelity-reviewer` and `issue-coverage-reviewer` as the diff warrants, or
  to the cheaper single-pass `code-reviewer` for a quick review.
- `pr-description` (skill) — drafts a PR description to
  `.code-reviews/<branch>.md` (git-ignored) from
  `.github/pull_request_template.md`; dispatches `pr-description-author` in
  parallel when bundled with a review.

## Documentation language

- **Portuguese (pt-BR)** — what a human reads: `README.md`, `ARCHITECTURE.md`,
  docs, commit messages, issues, PR descriptions, review reports.
- **English (en-US)** — what an agent reads first: this file,
  `.claude/agents/**`, `.claude/skills/**`.
- **Identifiers stay in English** either way.

UI copy follows the Figma's language verbatim.

## Code comments

Comment the **why**, never the **what**. A comment earns its place when the
reason isn't recoverable from the code: a library quirk, a deliberate
deviation, a non-obvious edge case. One line where one line does.

## Never reference this file

`CLAUDE.md` is private operating context. Keep it out of code, comments,
commit messages, issues, PR descriptions and committed docs. A rule humans
need goes in `README.md` or `ARCHITECTURE.md`, and that is what gets cited.
