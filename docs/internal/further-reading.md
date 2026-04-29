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

**Gap analysis — platform-agnostic lens.** The playbook's stance is tool-neutral, so each item below is split into the principle that transfers vs. the Claude-Code-specific dressing we should not port verbatim.

**Worth absorbing — principles transfer cleanly:**

- **Context-rot / "dumb zone" framing.** *Principle:* every model has a sweet spot well below its advertised max context where reasoning quality is preserved; intelligence-sensitive work should stay inside it. *Claude-Code dressing:* the specific 300–400k / 30% / 40% numbers are tied to current Claude Sonnet behavior. *Port:* the framing as a recurring operational pattern in 03; cite the numbers as model-specific examples, not as universal thresholds. Mirrors how we use Cisco's LOC/hour numbers in #12 — illustrative, not prescriptive.
- **"Rewind over correct" session discipline.** *Principle:* don't fix mistakes by writing more turns into a polluted context — restart from a clean point or split off a new session. *Claude-Code dressing:* `/rewind`, `/compact`, `/clear` are specific commands. *Port:* the discipline ("treat polluted context as a debt to clear, not a substrate to keep building on"), expressed in terms any harness user can apply. Note in passing that named harnesses provide the equivalent.
- **Test-time compute as a named pattern.** *Principle:* run the same task across multiple isolated contexts and ensemble the results — fully platform-agnostic, this is research-grade vocabulary that happens to apply to coding agents. *Port:* introduce by name in 07 (subagents and parallelism); call out that fan-out/fan-in is one instance of it. No tool-specific dressing involved.
- **Instruction-file operational tips.** *Principle:* target file size (~60 lines per file before splitting); monorepo splits with ancestor/descendant loading; lazy-load domain rules from a subdirectory; conditional inclusion to keep large files coherent. *Claude-Code dressing:* CLAUDE.md, `.claude/rules/`, `<important if="…">` tags. *Port:* express in terms of AGENTS.md (the cross-tool standard) and note that the same patterns render identically into CLAUDE.md, `.cursorrules`, etc. Module 03 already covers the concept; this is operational depth.
- **Skill / instruction-module architecture.** *Principle:* progressive disclosure (most readers should hit the high-signal content first); gotchas section is the highest-signal part because it captures non-obvious failure modes; descriptions should be written as *triggers for the model*, not human-facing summaries. *Claude-Code dressing:* SKILL.md format, `context: fork`, `!command` injection. *Port:* the principles into 05 / 14 as guidance applicable to any prompt-template or instruction-module system, with the SKILL.md format as one concrete example.

**Worth absorbing as principles, but the implementation is tool-specific:**

- **Permissions hierarchy and sandboxing.** *Principle:* configure agent permissions declaratively rather than relying on interactive prompts; use sandboxing for risky surfaces; hierarchical config (project / user / system) for layering policies. *Claude-Code dressing:* Auto mode, `/sandbox`, `.claude/settings.json`. *Port:* module 02 (environment setup) gets a "configure permissions declaratively where your harness supports it" section. The 84%-prompt-reduction stat is Claude-Code-specific; cite it as an existence proof that declarative permissioning has measurable ergonomic upside, not as a general claim.
- **Hooks / interceptors.** *Principle:* deterministic interceptors around stochastic agent actions — measure usage, auto-format outputs, gate destructive actions, nudge at turn boundaries. *Claude-Code dressing:* PreToolUse / PostToolUse / Stop hooks, on-demand `/careful`, `/freeze`. *Port:* discuss the pattern in 05 and tie it to #8 (deterministic infrastructure as the counterweight to a probabilistic collaborator). Implementations vary across tools; the playbook should describe the pattern and link to per-tool reference.

**Worth referencing rather than absorbing:**

- **Workflow taxonomy.** Most of the 9 methodologies they catalogue (Spec Kit, BMAD-METHOD, OpenSpec, Compound Engineering, etc.) are *methodology-level* and work across harnesses with adaptation. *Port:* a "see also" appendix in #5 with one-line summaries and explicit notes on which are tool-agnostic vs. Claude-Code-specific. Don't re-import nine workflows; do anchor our worked examples against the existing landscape so readers can locate us in it.
- **Skill collection libraries.** anthropics/skills, mattpocock/skills, wshobson/agents, scientific-agent-skills, awesome-agent-skills. These are Claude-Code-format-specific. *Port:* note them in `further-reading.md` (this file) as cross-tool reading for readers who use Claude Code, but don't pull them into the playbook itself. Tool-agnostic equivalents (e.g. cross-tool prompt libraries) belong in the same callout when they exist.

**Skip — too tool-specific to generalize:**

- Specific Claude Code commands as recipes (`/rewind`, `/compact`, `/sandbox`, `/loop`, `/schedule`).
- Auto mode as a named feature, ultraplan, ultrareview, Ralph Wiggum loop, Compound Engineering plugin.
- Voice dictation, Chrome extension, remote control, routines.
- The specific skill registries — listed above as further reading, not pulled into modules.

**Counter-tension worth surfacing in the playbook:**

- **"Prototype over PRD" (Boris Cherny, Claude Code creator).** Their tip: build 20–30 versions instead of writing specs — the cost is low, so take many shots. This *directly contradicts* the spec-heavy framing planned for #5 and #9 (specs as the load-bearing senior leverage point). Fully platform-agnostic philosophical tension — has nothing to do with which harness you use. Not necessarily wrong: there's a real fork between "spec-first for high-stakes / brownfield work" and "shotgun-prototype for exploratory / greenfield work." Worth surfacing in #5 and #9 as an explicit choice readers make per task, not paving over.

**What we already cover that they also stress:** subagents (07), MCP/hooks (05), parallel execution via worktrees (07), full-lifecycle workflows (09), AGENTS.md/CLAUDE.md (03). Differences are in operational depth, not topic selection.

---

## How to add a new entry

1. Drop it under the right category (or create one — categories are loose, not load-bearing).
2. Use the template. The "why flagged" line is mandatory; the rest can be terse if you haven't read the thing yet.
3. When you act on an entry — cite it, absorb it, or decide to skip — update the **Status** and **Next action** so the next contributor doesn't re-read it from scratch.
4. Promote to `sources.md` when a piece has been cited in an issue or module draft. Delete from this file when promoted, so this stays a backlog rather than a duplicate index.
