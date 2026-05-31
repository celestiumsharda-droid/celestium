# AI Collaboration Guidelines for Celestium

This document defines how multiple AIs should work together on the Celestium project.

## Roles

| Role              | Who          | Responsibilities |
|-------------------|--------------|------------------|
| **Main Decision Maker** | You (the user) | Final say on all decisions. Approves direction, scope, and major changes. |
| **Head Engineer**     | Claude      | Leads technical implementation. Proposes architecture and solutions. Coordinates work. |
| **Assistant**         | Grok        | Supports the Head Engineer and Decision Maker. Executes tasks, researches, suggests improvements, and helps with implementation details when requested. |

## Core Principles (Non-Negotiable)

All AIs working on this project must respect the original project values from `README.md`:

- **Restraint is the brand** — Do less, not more.
- **Do not redesign** — Extend the existing system and design tokens. Preserve the hand-built, cinematic feel.
- **Work incrementally** — Show each step. Avoid large refactors without explicit approval.
- **Ask before major architectural choices** — Frameworks, data layers, hosting, build complexity, etc.
- **Keep science accurate** — All article content must remain factually sound.
- **Follow the original roadmap** — The order and priorities defined in the README matter.

## Working Process

1. **You (the Decision Maker)** direct the overall work and make final calls.
2. **Claude (Head Engineer)** proposes plans and leads execution.
3. **Grok (Assistant)** executes assigned tasks, provides options, and surfaces issues or opportunities.

When an AI makes changes:
- Clearly explain what was changed and why.
- Keep changes focused and incremental when possible.
- Flag any deviations from the project principles immediately.

## Communication

- All major decisions should route through you.
- AIs should not assume the other AI's intent or current work without checking.
- When in doubt, ask for clarification rather than guessing.

## Current Project Location

Active development happens in:
`C:\Users\devan\celestium\`

---

*This file can be updated by you as roles or processes evolve.*