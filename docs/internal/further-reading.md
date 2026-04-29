# Further reading backlog

Resources we want to keep an eye on but haven't fully processed into the playbook yet. Distinct from [`sources.md`](sources.md), which is for material we've actually cited and have a settled framing for.

## How this differs from `sources.md`

| | `sources.md` | this file |
| --- | --- | --- |
| **Stage** | actively cited | still on the to-read pile |
| **Required fields** | findings, where useful, caveats | enough to remember why we flagged it |
| **Goal** | reuse a settled framing | catch things we'd otherwise forget |
| **Promotion** | → `docs/research-summary.md` once a module ships | → `sources.md` once we've drawn from it |

A resource that's been read and adopted should move to `sources.md` (or directly to `research-summary.md` if it's already backing landed module content). A resource that's been read and rejected should stay here with a "skip — why" note so we don't re-discover it next quarter.

## Entry template

```
### [Title](URL)
**Type:** repo / blog post / paper / talk / podcast / tool / community resource
**Why flagged:** one sentence on why we noticed it
**Status:** to-read / skimmed / partially absorbed / superseded / skip
**Next action:** what we'd do if we picked it up next, or why we won't
**Related:** issues / modules / sources entries this connects to
```

---

## Community resources and curations

### [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
**Type:** community reference repository (~49k stars)
**Why flagged:** comprehensive Claude Code patterns reference — broader scope than our playbook, and a useful checklist of techniques we may have under-covered.
**Status:** skimmed; gap analysis below.
**Next action:** absorb the operational thresholds and session-management discipline tips into module 03 and 08 directly; treat the workflow taxonomy as a literature review for #5.
**Related:** modules 02, 03, 05, 08; issues #5, #9

**Gap analysis — what they cover that we've under-covered:**

- **Operational context-management thresholds.** Context rot kicks in ~300–400k tokens on the 1M model; "dumb zone" at ~40% context usage; experts target <30%, newcomers <40%. Our 03 mentions context engineering as a concept but doesn't give numbers like these. Worth absorbing as a callout — operational stats readers can apply tomorrow, similar to the Cisco LOC/hour numbers in #12.
- **Session-management discipline.** `/rewind` over leaving corrections in context; `/compact` with hints over auto-compact; named/resumable sessions; "summarize from here" before rewinding for handoff. Tool-specific to Claude Code but the underlying principles transfer. Belongs in 03 or 08.
- **Auto mode + sandbox + permissions hierarchy.** 2026 Claude Code introduced a background safety classifier that replaces manual permission prompts; `/sandbox` reportedly reduces prompts ~84% via file/network isolation. Module 02 (environment setup) likely needs a refresh.
- **CLAUDE.md operational tips.** 60-line ideal target per file; multiple CLAUDE.md in monorepos with ancestor/descendant loading; `.claude/rules/*.md` for lazy-loaded domain logic; `<important if="…">` tags to prevent ignoring as files grow. Module 03 should have these as concrete recipes, not abstract principles.
- **Skill architecture patterns.** `context: fork` to isolate skill execution in a subagent; "gotchas section is the highest-signal content"; `!command` in SKILL.md for dynamic shell output injection; descriptions written *as triggers for the model*, not summaries. Module 05 or 14.
- **Hook recipes.** PreToolUse to measure skill-usage frequency (find popular/undertriggering skills); PostToolUse for auto-formatting; Stop hook to nudge "keep going" or verify at turn end; on-demand hooks (`/careful`, `/freeze`) for destructive-action gating. Module 05.
- **Test-time compute as a named pattern.** "Multiple agents with separate contexts improve quality" — they call this test-time compute and treat it as first-class. Module 07.
- **Workflow taxonomy.** They catalogue 9 documented methodologies (Superpowers, Everything Claude Code, Spec Kit, gstack, BMAD-METHOD, OpenSpec, oh-my-claudecode, Compound Engineering, Get Shit Done). Useful prior art when writing #5 — at minimum a "see also" appendix; possibly a comparison table of which patterns each one emphasizes.
- **Skill collection libraries.** anthropics/skills, mattpocock/skills, wshobson/agents, scientific-agent-skills, awesome-agent-skills. Worth pointing readers at rather than reinventing.

**Gap analysis — direct counter-tensions to our framing:**

- **"Prototype over PRD" (Boris Cherny, Claude Code creator).** Their tip: build 20–30 versions instead of writing specs — the cost is low, so take many shots. This *directly contradicts* the spec-heavy framing planned for #5 and #9 (specs as the load-bearing senior leverage point). Not necessarily wrong — it's a real tension between "spec-first for high-stakes work" and "shotgun-prototype for exploratory work." Worth surfacing in #5 and #9 as an explicit fork in the road, not paving over.

**What we already cover that they also stress:** subagents (07), MCP/hooks (05), parallel execution via worktrees (07), full-lifecycle workflows (09), AGENTS.md/CLAUDE.md (03). Differences are in depth and operational specificity, not in topic selection.

---

## How to add a new entry

1. Drop it under the right category (or create one — categories are loose, not load-bearing).
2. Use the template. The "why flagged" line is mandatory; the rest can be terse if you haven't read the thing yet.
3. When you act on an entry — cite it, absorb it, or decide to skip — update the **Status** and **Next action** so the next contributor doesn't re-read it from scratch.
4. Promote to `sources.md` when a piece has been cited in an issue or module draft. Delete from this file when promoted, so this stays a backlog rather than a duplicate index.
