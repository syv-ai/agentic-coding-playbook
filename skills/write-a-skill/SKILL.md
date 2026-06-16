---
name: write-a-skill
description: Create or edit agent skills with proper structure, a discoverable description, progressive disclosure, and bundled resources. Use when the user wants to write, create, build, or revise a skill, or asks how skills should be structured.
---

# Write a Skill

A skill is a reference guide for a proven technique, pattern, or workflow that a future agent can find and apply. Skills are **reusable** — they are *not* narratives about how you solved one problem once.

**Create a skill when:** the technique wasn't obvious, you'd reference it again across projects, it applies broadly, and a judgment call is involved.

**Don't create one for:** one-off solutions, things well-documented elsewhere, project-specific conventions (those go in CLAUDE.md / a `docs/` file), or mechanical constraints enforceable with a script or hook (automate those instead).

## Process

1. **Gather requirements** — what task/domain does it cover, what specific cases must it handle, does it need executable scripts or just instructions, any reference material to include?
2. **Draft** — write `SKILL.md`; split heavy or distinct content into separate files; add scripts for deterministic operations.
3. **Test it** (see *Testing* below) — the only way to know it teaches the right thing.
4. **Review with the user** — does it cover the cases, anything missing, any section too thin or too heavy?

## Structure

```
skill-name/
├── SKILL.md          # Main instructions (required)
├── REFERENCE.md      # Heavy reference, if needed (API docs, long syntax)
├── EXAMPLES.md       # Usage examples, if needed
└── scripts/          # Utility scripts for deterministic ops, if needed
```

**Flat namespace** — every skill lives at `skills/<skill-name>/` in one searchable namespace.

**Keep inline:** principles, concepts, code patterns under ~50 lines.
**Split into a separate file when:** `SKILL.md` exceeds ~100 lines, the content has distinct domains, or a section is advanced/rarely-needed. **Add a script when** an operation is deterministic (validation, formatting) — scripts save tokens and are more reliable than regenerated code.

## SKILL.md template

```markdown
---
name: skill-name
description: <one-line capability>. Use when <specific triggers / symptoms / contexts>.
---

# Skill Name

## Overview
What is this? Core principle in 1–2 sentences.

## When to Use
Bullet list of symptoms and situations · when NOT to use.

## Core pattern / Workflow
Steps, or a before/after comparison. Checklists for multi-step processes.

## Quick reference
A table or bullets for scanning common operations.

## Common mistakes
What goes wrong + the fix.
```

## The description is the most important line

The description is **the only thing the agent sees** when deciding whether to load your skill — it's surfaced in the system prompt alongside every other skill. Get it right:

- **Third person**, max 1024 chars (aim for under 500).
- A short **capability** clause, then **"Use when …"** with concrete triggers: symptoms, situations, keywords, file types, error strings.
- **Never summarize the step-by-step workflow in the description.** This is the subtle trap: when the description spells out the process, the agent follows the *description* and skips reading the skill body. Testing showed a description saying "code review between tasks" made the agent do *one* review even though the skill specified two; trimming the description to just triggering conditions fixed it.

```yaml
# ❌ Summarizes the workflow — the agent follows this and skips the skill
description: Use for TDD - write test first, watch it fail, write minimal code, refactor

# ❌ First person / too abstract
description: I can help with flaky async tests

# ✅ Capability + triggers, no workflow
description: Test-driven development with red-green-refactor. Use when implementing any feature or bugfix, before writing implementation code.
```

**Keyword coverage:** include words the agent would search for — error messages, symptoms ("flaky", "hanging"), synonyms, tool/library names. **Naming:** active, verb-first, by what you DO (`condition-based-waiting` > `async-test-helpers`); gerunds work well for processes.

## Conventions for this collection

- **Self-contained.** A skill may depend only on *other skills in this collection*, never on an external plugin. Reference another skill by its name in prose (e.g. "use the **tdd** skill") — **never** with `@path` syntax, which force-loads the file and burns context before it's needed.
- **English bodies.** Instructions are in English for model performance.
- **Progressive disclosure.** Keep `SKILL.md` tight; push depth into referenced files that load only when needed. Reference one level deep.
- **No time-sensitive info, no narrative storytelling, consistent terminology, concrete examples.**

## Testing — skill authoring is TDD for documentation

If you didn't watch an agent fail *without* the skill, you don't know the skill teaches the right thing.

```
RED      Run a realistic pressure scenario with a fresh subagent, WITHOUT the skill.
         Document the exact choices and rationalizations it makes (verbatim).
GREEN    Write the minimal skill that addresses those specific failures.
         Re-run the scenario WITH the skill — the agent should now comply.
REFACTOR Agent found a new loophole? Add an explicit counter. Re-test until solid.
```

For **discipline-enforcing skills** (rules), pile on pressure (time + sunk cost + exhaustion) and confirm the rule holds; capture every excuse in a rationalization table and a red-flags list, and state early that *violating the letter is violating the spirit* — it cuts off a whole class of rationalizations. For **technique/pattern/reference skills**, test that a fresh agent can *apply* the technique to a new scenario and find what it needs. See [testing-skills-with-subagents.md](testing-skills-with-subagents.md) and Anthropic's official guidance in [anthropic-best-practices.md](anthropic-best-practices.md).

## Review checklist

- [ ] `name` uses only letters, numbers, hyphens; matches the directory
- [ ] Description is third person, "Use when …", and does NOT summarize the workflow
- [ ] `SKILL.md` is tight (≈ under 100 lines); depth pushed to referenced files
- [ ] One excellent example, not five mediocre ones in five languages
- [ ] Cross-references name only in-collection skills; no `@path` links
- [ ] Tested against a baseline scenario, not just read
- [ ] No narrative, no time-sensitive info, consistent terminology
