# Contributing to Celestium

This project is being built by **multiple AI agents** (Claude, Grok)
collaborating with a human owner (Devan). Without rules of engagement
the two AIs will trip over each other. These are those rules.

See also `AI-COLLABORATION.md` for the role split: human is the
decision-maker, Claude is head engineer, Grok is assistant engineer.

---

## Golden rule

**Always `git pull` before you start. Always commit + push when you stop.**

If your changes are not on `origin/main` they don't exist as far as the
other agent is concerned. The repo on GitHub is the single source of
truth.

---

## Before you touch code

1. `git pull` — get the latest. If you can't, ask the human.
2. Read `ROADMAP.md`. Find the phase that's open. Don't skip ahead.
3. Read the *most recent* commits (`git log -5`) — you may be picking
   up mid-task.
4. If the previous agent left a `WIP:` commit at the tip, **don't squash
   it**. Build on it. The human will rebase at the end of the phase.
5. If two agents could plausibly grab the same task, declare yours by
   creating an empty `WIP: <task>` commit before doing anything else.
   That stakes a claim. The other agent will see it on `git pull` and
   pick something else.

---

## While coding

1. **Don't redesign.** The visual language is finished. Extend tokens,
   don't replace them. New visual ideas go in `ROADMAP.md` as proposals
   first, with human sign-off, before any pixels move.
2. **Single source of truth.** Content goes in `src/data/`, types in
   `src/engine/types.ts`. If you're about to hardcode the same content
   in two places, stop.
3. **TypeScript strict mode is on.** Don't disable it. If `tsc
   --noEmit` is red, you can't push.
4. **Article science must be accurate.** Cite mentally as you write;
   don't invent figures or dates. If a number is approximate, mark it
   approximate (~, "roughly", "about").
5. **Restraint is the brand.** Add fewer things, better. Bias toward
   removing rather than adding.
6. **Accessibility is not optional.** New interactive elements get
   keyboard support, ARIA, and respect `prefers-reduced-motion`.

---

## Commit hygiene

- Atomic commits. One concept per commit.
- Imperative subject line, ≤72 chars. Explain *why* in the body if it
  isn't obvious from the diff.
- Co-author tag at the end of every commit body, so it's clear which
  agent did the work:

  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

  or

  ```
  Co-Authored-By: Grok <noreply@x.ai>
  ```

- Don't force-push to `main`. Ever.
- Branch off `main` for risky changes; open a PR; let the human merge.

---

## Before you push

```powershell
npm run typecheck   # must pass
npm run build       # must complete without errors
```

If either fails, fix it before pushing. A green tree on GitHub is the
contract.

---

## Tasks an AI may take on without asking

- Filling out an article that's already scaffolded in `discoveries.ts`
  (depths arrays).
- Adding a timeline entry for an existing article.
- A11y patches (focus rings, ARIA fills, contrast issues).
- Performance work (lazy-loading, image format).
- Writing tests against an existing surface.
- Documentation (READMEs, comments, JSDoc).

## Tasks an AI must ASK the human about

- Adding a JavaScript framework / build tool.
- Adding any new third-party runtime dependency.
- Changing the design tokens.
- Reorganising the project structure.
- Anything that changes a URL.
- Adding analytics or tracking.
- Adding a CMS or external service.
- Anything that costs money.

---

## What "best in the world" means here

It does not mean "biggest." It means: every detail is considered, every
pixel intentional, every sentence load-bearing, every interaction
purposeful. When in doubt, do less, but do it perfectly.
