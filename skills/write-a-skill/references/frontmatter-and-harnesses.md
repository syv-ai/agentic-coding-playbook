# Frontmatter and harnesses

Read this before adding a field beyond `name` and `description`, before making a skill manual-only, or when a skill loads in one harness but not another. Harness behaviour changes; when a detail matters, check the harness's current docs.

## The Agent Skills spec

From [agentskills.io/specification](https://agentskills.io/specification):

| Field | Required | Rules |
|---|---|---|
| `name` | Yes | 1–64 characters: lowercase letters, digits and hyphens. No leading, trailing or consecutive hyphens. Matches the parent folder name. |
| `description` | Yes | 1–1024 characters. What the skill does and when to use it. |
| `license` | No | A licence name or the name of a bundled licence file. |
| `compatibility` | No | 1–500 characters. Only for real environment requirements (a product, system packages, network access). |
| `metadata` | No | A map of string keys to string values. |
| `allowed-tools` | No | Experimental. A space-separated string of pre-approved tools; support varies. |

Folder layout: `SKILL.md` is required; `scripts/`, `references/` and `assets/` are recommended conventions, and any other files are allowed. The spec recommends keeping `SKILL.md` under 500 lines and under about 5,000 tokens, with file references one level deep and relative to the skill folder.

## What each harness reads

| Harness | Manual invocation | Fields beyond the spec | Notes |
|---|---|---|---|
| Claude Code | `/name` | See below | Ignores unrecognised fields without an error. |
| Codex | `$name`, or `/skills` | `agents/openai.yaml` beside `SKILL.md` | The file has `interface` (picker metadata such as `display_name`, `short_description`), `policy` and `dependencies`. `policy.allow_implicit_invocation: false` keeps the skill out of the model's reach. A stale `false` left after a skill becomes model-invoked hides it from the model, so only `$name` works: keep the file in step with the frontmatter. |
| VS Code (Copilot) | `/name`, with text after it | `argument-hint`, `user-invocable`, `disable-model-invocation`, `context: fork` (experimental) | A name with invalid characters makes the skill fail to load without an error. |
| Copilot CLI | `/name` inside the prompt; `/skills list` | `argument-hint`, `user-invocable`, `disable-model-invocation`, `license`, `allowed-tools` | `disable-model-invocation` is fully honoured from version 1.0.74. |
| Cursor | `/name` (attaches to one message) | `paths` (globs scoping the skill to matching files), `disable-model-invocation`, `metadata` | Also loads from `.claude/skills/` and `.codex/skills/`. |
| Gemini CLI | none per skill; `/skills list`, `/skills disable <name>` | None: it reads only `name` and `description` | The model activates a skill with `activate_skill`, and the user approves each activation. `disable-model-invocation` has no effect. |
| Pi | `/skill:name`, with arguments after it | `disable-model-invocation` | Most invalid fields produce warnings rather than blocking startup. A name that differs from the folder isn't flagged. |

### Claude Code fields

`when_to_use` (appended to the description in the listing), `argument-hint`, `arguments` (named positional arguments), `disable-model-invocation`, `user-invocable` (`false` hides it from the `/` menu), `allowed-tools` and `disallowed-tools` (for the turn that invokes the skill), `model`, `effort`, `context: fork` with `agent`, `hooks`, `paths`, and `shell` (for injected commands). It accepts `license`, `compatibility` and `metadata` but doesn't act on them.

- **Substitutions:** `$ARGUMENTS` (with `$ARGUMENTS[N]` and `$N`), named `$name` from `arguments`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_SESSION_ID}`, and for plugin skills `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`.
- **Command injection:** `` !`cmd` `` (at line start or after whitespace), or a fenced block opened with ` ```! `, runs before the skill reaches the model and is replaced by its output. If any injected command fails, the invocation aborts.
- **The listing:** names and descriptions sit in context every turn. Each entry's `description` plus `when_to_use` is cut at 1,536 characters. The whole listing is budgeted at 1% of the context window; when it overflows, descriptions are dropped starting with the least-used skills (names stay).
- **Manual-only skills** (`disable-model-invocation: true`) aren't in the listing at all, so their description is for people only. The field also stops the skill being preloaded into subagents.
- **Compaction:** after the conversation is summarised, the most recent invocation of each skill is re-attached, keeping its first 5,000 tokens, within a shared 25,000-token budget filled from the most recently invoked skill.
- **Outside Claude Code** (claude.ai uploads, the Skills API), only the six spec fields are allowed; other keys are a hard error.

## Making a skill manual-only

Set both of these, and keep them in step:

```yaml
# SKILL.md frontmatter — Claude Code, VS Code, Cursor, Pi
disable-model-invocation: true
```

```yaml
# agents/openai.yaml — Codex
policy:
  allow_implicit_invocation: false
```

Gemini CLI reads neither, so the model can still activate the skill there (with the user's approval). Write the description so it's accurate if a model reads it: a one-line summary of what the skill does, without "Use when …" triggers.

## Portable substitutes for Claude Code features

| Claude Code feature | Portable form |
|---|---|
| `${CLAUDE_SKILL_DIR}/scripts/x.sh` | `bash scripts/x.sh`: relative to the skill folder, which the spec says agents resolve. |
| `` !`git status` `` injection | A first step: "Run `git status --short` and read the output before continuing." |
| `$ARGUMENTS` | "Text after the command is the request; if there is none, ask what to work on." |
| `context: fork` | "Do this in a subagent if your harness has one; otherwise do it inline and keep the output short." |
| `allowed-tools` | Nothing: permissions belong to the user's harness settings. Say which tools the skill needs. |

## Validation

- `claude plugin validate <dir>` checks a plugin root, or a folder of skills such as `skills/` or `.claude/skills`, for frontmatter that doesn't parse and schema errors (Claude Code v2.1.233 or later). Point it at the parent folder; a single skill folder isn't accepted. It doesn't test behaviour.
- `skills-ref validate <dir>` from the Agent Skills project is a demonstration library, not a production tool. It rejects every field outside the spec, so it fails valid skills that use `disable-model-invocation` or `argument-hint`.
