---
description: Add or update a source in the knowledge base. Reviews the source, scans for contradictions with existing material, and writes the entry with caveats.
argument-hint: <url-or-path-or-paste> | update <slug>
---

You are managing the knowledge base for the agentic coding playbook. The user has invoked `/knowledge` with the input: $ARGUMENTS

## Files you operate on

- **`docs/internal/sources.md`** — material we've cited, with settled framing and caveats
- **`docs/internal/further-reading.md`** — flagged but unprocessed; the default destination for new material
- **`docs/research-summary.md`** — published, curated. NEVER write to this directly; promotion is a manual editorial step
- Affected playbook modules in `docs/` (00–14) and `docs/internal/issue-coverage-plan.md` — only edited to add contradiction-flag alert blocks

Read the entry templates and the existing entries in `sources.md` and `further-reading.md` before drafting anything new — match the tone and structure already established.

## Workflow

Run these stages in order. Be terse with the user. Ask only when genuinely ambiguous — every question you ask is a small tax on the contributor.

### 1. Intake

- If `$ARGUMENTS` starts with `update <slug>`, branch to **Update mode** below.
- If `$ARGUMENTS` is empty, ask the user to paste the URL, file path, or content. One question only.
- Otherwise, treat `$ARGUMENTS` as a URL, file path, or pasted text.
- Fetch URLs with WebFetch (or `gh` for GitHub URLs). Read files with Read. Use the content as-is for pastes.
- Extract: title, authors, type (academic study / vendor report / industry write-up / practitioner panel / standard / community resource), scope/year, key findings or quotes, and which playbook topics it touches.

**Duplicate check:** grep `sources.md` and `further-reading.md` for the URL, DOI, and title. If a match exists, switch to Update mode automatically and tell the user.

### 2. Triage — choose a destination

- **`sources.md`** if the user has already indicated intent to cite it (e.g. "we want this for #12", "let's use this in the verification chapter"). The entry needs the full template including caveats.
- **`further-reading.md`** is the default. Use this whenever you're unsure or the user just wants to bookmark it.
- Only ask the user to choose if the input is borderline. Phrase it as a default: "Defaulting to `further-reading.md` — say 'sources' if you want to cite it now."

### 3. Contradiction scan

Grep the new source's main claims against existing entries in:

- `docs/internal/sources.md`
- `docs/internal/further-reading.md`
- `docs/internal/issue-coverage-plan.md`
- `docs/*.md` (the 14 published modules)

**Surface only notable conflicts** — claims that are directionally opposed *and* on the same topic, not just topical overlap. Examples of notable: "MCP is dead" vs an entry that recommends MCP; "prototype over PRD" vs spec-first framing in an issue. Examples of NOT notable: both sources mention LLMs.

For each notable conflict, classify:

- **Supersedes** — newer/stronger evidence on the same point, the older claim is now stale.
- **Live tension** — practitioners disagree; both views are still in play.
- **Not actually a conflict** — false positive, drop it.

**Default to "live tension" when uncertain.** It is the least destructive and easy for a future contributor to revisit. Only ask the user to confirm if classification is non-obvious AND the conflict is consequential.

### 4. Draft

Write the new or updated entry using the template already in the destination file. **Caveats are mandatory** — if you can't articulate at least one caveat (vendor bias, methodological limit, recency, applicability), pause and ask the user; do not ship a caveat-free entry.

For each notable conflict from stage 3, edit the affected file to add an alert block adjacent to the challenged passage:

**Supersedes:**

```markdown
> [!note] Updated YYYY-MM-DD
> [<source title>](<relative-link-to-entry>) provides newer evidence on this point. The framing below may be stale; reconsider before citing in new modules.
```

**Live tension:**

```markdown
> [!info] Active tension
> Some practitioners (e.g. [<name> via <source>](<relative-link-to-entry>)) advocate <opposing position>. Frame as a fork readers choose per task, not a settled position.
```

Place the block *immediately above* the challenged paragraph. Use today's date for `Updated YYYY-MM-DD`. Use repo-relative links so they work in GitHub and locally.

Update `MEMORY.md` only if the new source materially changes how future Claude sessions should understand the project — usually it doesn't.

### 5. Confirm

Show the user a concise diff summary:

- Where the entry was written (file + section)
- What other files were touched and why (the conflict-flag blocks)
- Open questions, if any

End with: "Looks good? I'll commit." — wait for confirmation before committing. Do not auto-push.

## Update mode

Triggered by `/knowledge update <slug>` or by duplicate detection in stage 1.

- Locate the existing entry by slug or URL.
- Show the user what's already there and ask what's changing (new findings, revised framing, downgrading from `sources.md` to `further-reading.md`, etc.). One open question is fine here — updates are ambiguous by nature.
- Apply the change. Re-run the contradiction scan in case the revised framing now conflicts with something it didn't before.
- Confirm with the user before committing.

## Style guide for entries

- One short paragraph for "Where useful" — name the issue, module, or argument, not the abstract topic.
- Caveats are sharp, not hedged. "Vendor-published; cite as supporting, not primary" is better than "may have some bias."
- Used in: list issue numbers, PR numbers, module file paths. This is how future contributors trace the framing.
- Don't editorialize in the entry itself — keep judgments in the **Caveats** field where they belong.

## What you do NOT do

- Do not write to `docs/research-summary.md`. Promotion to that file is a manual editorial decision.
- Do not invent caveats. If the source genuinely has none worth flagging, that itself is the caveat ("none identified — re-evaluate if claims fail to replicate").
- Do not flag every overlap as a contradiction. Restraint here is what keeps the command usable.
- Do not commit without explicit user approval. Show the diff, wait, then commit.
