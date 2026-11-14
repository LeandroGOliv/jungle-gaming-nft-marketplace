---
name: creating-github-tasks
description: Use when the user wants to create/file a GitHub issue or task for this repo — a screen, flow, infrastructure piece (mocks, realtime, tests, audit), bug or chore — or asks to break the challenge into tasks.
---

# Creating GitHub Tasks

Opens issues on `LeandroGOliv/jungle-gaming-nft-marketplace` via `gh`. An issue
here is a slice of `desafio.md`: its acceptance criteria are the spec's
requirements for that slice, restated so they can be checked one by one.

## Prerequisites

`gh auth status` must pass. If `gh` is missing or unauthenticated, stop and
tell the user to install it (`winget install --id GitHub.cli`) and run
`gh auth login`.

## Workflow

1. Gather what's missing: title, goal, and which screen/flow or infrastructure
   area it covers. Ask only for what you cannot derive from `desafio.md`.
2. Read the sections of `desafio.md` the task touches — the screen's row in §3
   and its flow subsection, plus every cross-cutting section that applies
   (§4 state, §5 contracts, §6 mocks, §7 realtime, §8 UI/a11y, §9 tests).
3. For a screen task, resolve its Figma frames from `docs/figma/INDEX.md` (use
   the `figma-design` skill if the frame is not mapped yet) and build the
   links: `https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=<id with - instead of :>`.
4. Labels: `gh label list`; create a missing one with `gh label create` before
   passing it to `--label`. Suggested set: `screen`, `infra`, `mocks`,
   `realtime`, `tests`, `a11y`, `performance`, `docs`.
5. Write the body in **pt-BR** with these sections:
   - `## Descrição` — the goal.
   - `## Design` — Figma links per viewport (desktop/mobile), or "sem frame —
     derivar do padrão visual" when the spec says the screen has none. Omit for
     non-UI tasks.
   - `## Critérios de aceite` — a checklist. Every requirement `desafio.md`
     places on this slice becomes one checkable item, including the states
     (loading/empty/error), responsive widths (390/768/1440) and accessibility
     items that apply. Complete when no sentence of the relevant sections is
     left unrepresented or explicitly assigned to another issue.
   - `## Contratos e mocks` — endpoints, socket events and MSW scenarios the
     task needs or introduces. Omit when none.
   - `## Testes` — the Playwright scenarios from §9 this task must deliver
     (by number), and unit tests for any pure logic. Write "N/A" explicitly
     for a task with no code.
   - `## Fora de escopo` — what is deliberately left to another issue.
   - `## Documentação` — what to record in `README.md` / `ARCHITECTURE.md`
     (contracts, cache policy, Figma deviations), when applicable.
6. Create it:
   `gh issue create --repo LeandroGOliv/jungle-gaming-nft-marketplace --title "..." --body-file <file> [--label ...]`
   (write the body to a scratchpad file — multi-line `--body` breaks on
   Windows shells).
7. Report the issue URL.

When creating several issues at once, show the user the list of titles and
their scope split first and create them after they confirm; state
dependencies between issues in `## Descrição` ("Depende de #N").

## Rules

- The issue body names the spec as "o enunciado do desafio", and never
  mentions this skill or any agent configuration file.
- Describe behaviour and criteria, not the implementation.
