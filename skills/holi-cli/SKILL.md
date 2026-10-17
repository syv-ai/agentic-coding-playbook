---
name: holi-cli
description: Holi's local CLI for vault notes and app capabilities. Use when an agent needs to read, create, update, delete, or settle documents in an open Holi vault, or use Holi's other CLI commands.
---

# Holi CLI for notes

Use `holi` to work with ordinary Markdown notes through the Holi app. It is a
local CLI, not an MCP server. It works only while Holi has the vault open and
the command runs from inside that vault.

Holi puts `holi` on `PATH` for its own Claude Code sessions and provides the
absolute script path as `$HOLI_BIN`. For an external agent, put Holi's generated
`<Electron userData>/bin` directory on `PATH`. In an installed macOS build:

```sh
export PATH="$HOME/Library/Application Support/Holi/bin:$PATH"
command -v holi
```

The path differs for development builds and other systems; use the actual
Electron `userData` directory or a supplied `$HOLI_BIN` path. The app rewrites
the script at launch. Run from inside the managed vault clone, not the Holi
source repository. Holi must be running with that vault open.

Run bare `holi` to see the commands currently available to your vault. They
are grouped into namespaces such as `docs`, `vault`, `sync`, `skills`, `tasks`,
`apps`, `store`, `google`, and `pdf`; the
available set depends on Holi and enabled plugins. The namespace and verb must
come first. Use `--json` for structured output, and `--name value` as an
alternative to positional arguments. Commands that take a body can read it
from stdin.

## Read before writing

List ordinary notes, then inspect the exact note to get its current revision:

```sh
holi docs list --json
holi docs inspect "notes/example.md" --json
```

`docs list` returns vault-relative note paths. `docs inspect` returns the
note's body and SHA-256 revision from the same read. Use that revision for a
conditional update or delete. `docs read` returns note text without a revision;
do not use it to obtain a write token. Never infer a revision from a path or
from content you have not just inspected. These commands concern ordinary
Markdown notes, not task files, local files, or app bundles.

## Write with a conditional revision

Create only when the path does not already exist. Send the whole Markdown body
on stdin:

```sh
printf '%s\n' '# New note' '' 'Text.' | holi docs create "notes/new.md" --json
```

Set `REVISION` to the `.revision` field returned by `docs inspect` before
changing a note. Replace only at that revision:

```sh
cat /tmp/new-note.md | holi docs update "notes/example.md" "$REVISION" --json
```

Delete is also conditional:

```sh
holi docs delete "notes/example.md" "$REVISION" --json
```

A create refuses an existing path; update and delete refuse if the note no
longer has the supplied SHA-256 revision. On a stale-revision refusal, read the
note again, reconcile your intended change with the current text, and ask the
user if the change would overwrite their work. Do not blindly retry with a
newly fetched revision.

## Settle a write

A write returns a receipt containing `path`, `revision`, `commitSha`, `pushed`,
`phase`, and `reason`. `phase` describes whether it reached `commit`, `push`, or
`complete`. Exit 0 means the change was verified pushed to the remote. Exit 1
means it is pending or refused. A pending settlement receipt is printed as
JSON on stderr (with or without `--json`); a refusal before a receipt exists
reports its error
on stderr instead. Inspect the output and the current vault/sync state. Do not
repeat the write or blindly retry it: the first attempt may already have
changed or committed the file.

To retry settlement without repeating the write, set `RESULT_REVISION` to the
`.revision` in the pending receipt for a surviving file, or use `--absent` for
a deletion:

```sh
holi docs settle "notes/example.md" --revision "$RESULT_REVISION" --json
holi docs settle "notes/example.md" --absent --json
```

Settlement checks the current file state before trying commit and push. It
cannot make progress if the vault is closed, Holi is offline, sync is blocked,
or the file is held back as oversized. A failed receipt can include a commit
SHA even when the push did not complete; leave the file in place and resolve
the reported condition before deciding what to do next. Exit 2 means the CLI
syntax was invalid, not a pending write. A command can also refuse invalid
content with exit 1.

Holi's editor may also be changing the same note. If an editor buffer conflicts
with external changes, use Holi's editor merge workflow to reconcile it rather
than overwriting the buffer or treating a CLI refusal as permission to retry.
