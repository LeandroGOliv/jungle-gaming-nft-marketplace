---
name: pr-description
description: >-
  Generate a pull request description for the current branch following this
  repository's PR template and writing conventions. Use whenever the user asks
  to generate/write a PR description or PR text — including when bundled with
  other work on the same diff ("revisa e gera a descrição do PR"), where it
  dispatches the `pr-description-author` sub-agent so the description is
  written in parallel.
---

# PR Description Generator

Drafts the PR description for the current branch into a local, git-ignored
file. It never runs `gh pr create`/`gh pr edit`; the user pastes the text (or
asks for that as a separate, explicit step).

## Step 1 — Resolve the scope

Base ref, in order: an explicit base branch the user named → `HEAD~N` for
"last N commits" → `main`.

```bash
git log $BASE..HEAD --oneline
git diff $BASE --stat
git diff $BASE          # only when writing inline (Step 2)
```

A branch named `<type>/<issue-number>-<slug>` carries the issue number; no
number means "no issue".

## Step 2 — Inline or dispatch

If you are a sub-agent, write it yourself (go to Step 3).

On the main thread:

| Situation                                                      | Mode                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| The description is the only thing asked                        | **Inline** — Step 3                                                   |
| Bundled with other work on the same diff (review, tests, docs) | **Dispatch** `pr-description-author` in the same message as that work |

The handoff prompt carries what you already read, so the sub-agent re-derives
nothing:

```
Base ref resolvido: <ref>
Branch: <branch>
Issue: <#número, ou "nenhuma">

Commits em escopo:
<git log output>

Diff stat:
<git diff --stat output>

Síntese da mudança:
- <problema que resolve>
- <como funciona, conceitualmente>
- <se parte relevante é refatoração mecânica>
- <o que o diff sozinho não revela: decisão de design, restrição, desvio do Figma>
```

Summarise the diff in the synthesis rather than pasting it. When the sub-agent
reports back, relay the file path and anything it flagged.

## Step 3 — Fill the template

`.github/pull_request_template.md` is the exact structure. Replace every
instruction text with real content:

1. **Name things, not paths** — the route, component, hook, endpoint, socket
   event, MSW scenario.
2. **How & why, not what** — intent and approach; the reviewer can read the
   diff.
3. **Cut what a teammate already knows** — established conventions, rationale
   already in a code comment, anything self-evident from the diff. Mention a
   convention only when the PR changes it. One screen, ideally.
4. **Refactor warning** — when a significant part of the diff is mechanical
   (renames, import reordering, barrels), add near the top of `## O que muda`:

   > ⚠️ **Parte deste PR contém refatorações mecânicas** em vários arquivos.
   > Lint e typecheck já cobrem essas mudanças — concentre a revisão nas
   > mudanças de lógica e comportamento.

   Entirely mechanical → callout at the very top, type `REFACTOR` only.

5. **pt-BR prose**, identifiers in their original form.
6. **`## Testes`** — the Playwright scenarios and unit tests added or changed,
   and what they prove. "N/A" only for a change with no code, said explicitly.
7. **`## Test plan`** — steps a reviewer can run: the mock scenario to select,
   the credentials, the viewport. Nothing manual → "N/A — mudança puramente
   estrutural; lint/typecheck cobrem."
8. **`## Fidelidade ao Figma`** — for UI changes: the frames implemented and
   every deviation with its reason. Remove the section for non-UI changes.
9. Keep the pre-review checkboxes, drop their instruction line.
10. No issue → remove `## Issue relacionada`. Otherwise `Closes #<n>` when
    fully resolved, `Relacionado a #<n>` when partial.

## Step 4 — Write it

```bash
BRANCH=$(git branch --show-current)
FILENAME="${BRANCH//\//-}.md"
```

Write to `.code-reviews/$FILENAME` at the repo root with the **Write** tool.
Tell the user the full path and that the folder is git-ignored. The file is
the deliverable — confirm in one line instead of printing the body.
