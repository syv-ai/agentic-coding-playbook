---
name: knowledge
description: >
  Add or update a playbook knowledge-base source. Review the source, choose a
  destination, scan for contradictions, and draft caveated entries.
---

# Knowledge intake

You manage the knowledge base for the Agentic Coding Playbook. Take the user's
URL, file path, pasted source, or update request from the current context. If
there is no source or update request, ask the user for one question only.

## Files you operate on

- `docs/internal/sources.md` contains material already cited, with settled
  framing and caveats.
- `docs/internal/further-reading.md` contains flagged but unprocessed material
  and is the default destination for new sources.
- `docs/research-summary.md` is published and curated. Never write to it;
  promotion is a manual editorial decision.
- Published modules in `docs/` (00–14) and
  `docs/internal/issue-coverage-plan.md` are only edited for contradiction
  alert blocks during intake.

Read the destination templates and existing entries before drafting. Match their
tone and structure.

## Workflow

Run these stages in order. Be terse with the user and ask only when genuinely
ambiguous.

### 1. Intake

- If the context requests an update of an existing slug, use **Update mode**
  below.
- Otherwise, treat the supplied context as a URL, file path, or pasted text.
- Fetch URLs and read files with the available repository or web-reading tools.
  Use pasted content as-is.
- Extract the title, authors, type (academic study, vendor report, industry
  write-up, practitioner panel, standard, or community resource), scope/year,
  key findings or quotes, and the playbook topics it touches.

**Duplicate check:** search `sources.md` and `further-reading.md` for the URL,
DOI, and title. If a match exists, switch to Update mode automatically and tell
the user.

### 2. Triage — choose a destination

- Use `sources.md` when the user has indicated intent to cite the source, such
  as naming an issue or verification chapter. Include the full template and
  caveats.
- Use `further-reading.md` by default when the user only wants to bookmark a
  source or the destination is uncertain.
- Ask the user to choose only for borderline cases. Phrase the default as:
  "Defaulting to `further-reading.md` — say 'sources' if you want to cite it
  now."

### 3. Contradiction scan

Compare the source's main claims with existing entries in:

- `docs/internal/sources.md`
- `docs/internal/further-reading.md`
- `docs/internal/issue-coverage-plan.md`
- `docs/*.md` (the 14 published modules)

Surface only notable conflicts: claims that are directionally opposed and on the
same topic, not ordinary topical overlap. "MCP is dead" versus an entry that
recommends MCP is notable; two sources mentioning LLMs is not.

Classify each notable conflict as:

- **Supersedes** — newer or stronger evidence makes the older claim stale.
- **Live tension** — practitioners disagree and both views remain active.
- **Not actually a conflict** — a false positive; drop it.

Default to **Live tension** when uncertain. Ask for confirmation only when the
classification is non-obvious and consequential.

### 4. Draft

Write the new or updated entry using the destination's existing template.
**Caveats are mandatory.** If you cannot state at least one caveat (vendor bias,
methodological limit, recency, or applicability), pause and ask the user. If no
specific caveat exists, state: "none identified — re-evaluate if claims fail to
replicate."

For each notable conflict, add an alert block immediately above the challenged
passage:

**Supersedes:**

```markdown
> [!note] Updated YYYY-MM-DD
> [<source title>](<relative-link-to-entry>) provides newer evidence on this point.
> The framing below may be stale; reconsider before citing in new modules.
```

**Live tension:**

```markdown
> [!info] Active tension
> Some practitioners (e.g. [<name> via <source>](<relative-link-to-entry>))
> advocate <opposing position>. Frame this as a fork readers choose per task,
> not a settled position.
```

Use today's date for `Updated YYYY-MM-DD`. Use repository-relative links so they
work in GitHub and locally.

### 5. Confirm

Show the user a concise diff summary:

- where the entry was written (file and section);
- which other files were touched and why (the conflict-flag blocks); and
- any open questions.

End with: "Looks good? I'll commit." Wait for confirmation before committing and
do not auto-push.

## Update mode

Use this mode when the context requests `update <slug>` or duplicate detection
finds an existing entry.

- Locate the existing entry by slug or URL.
- Show the user what is already there and ask what is changing: new findings,
  revised framing, or a move between `sources.md` and `further-reading.md`.
  One open question is appropriate because updates are ambiguous.
- Apply the change and repeat the contradiction scan if the framing changed.
- Confirm with the user before committing.

## Style guide for entries

- Keep "Where useful" to one short paragraph naming the issue, module, or
  argument, not an abstract topic.
- Make caveats sharp, not hedged: "Vendor-published; cite as supporting, not
  primary" is better than "may have some bias."
- In "Used in", list issue numbers, PR numbers, and module paths so contributors
  can trace the framing.
- Do not editorialize in the entry itself; keep judgments in **Caveats**.

## What you do not do

- Do not write to `docs/research-summary.md`. Promotion is a manual editorial
  decision.
- Do not invent caveats. If none is worth flagging, use the explicit
  non-replication caveat above.
- Do not flag every overlap as a contradiction. Restraint keeps the workflow
  usable.
- Do not commit without explicit user approval. Show the diff and wait.
