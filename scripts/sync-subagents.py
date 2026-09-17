#!/usr/bin/env python3
"""Generate the Claude Code plugin agents from the harness-neutral subagent prompts.

The prompts in skills/<skill>/subagents/*.md are the source of truth. Each one
becomes agents/<name>.md with Claude Code frontmatter (tools, model) added.

    python3 scripts/sync-subagents.py          # write the generated agents
    python3 scripts/sync-subagents.py --check  # exit 1 if any copy has drifted

Stdlib only.
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Claude Code-only fields per subagent. Everything else comes from the source.
CLAUDE_FIELDS = {
    "design-inventory": {"tools": "Read, Grep, Glob", "model": "sonnet"},
    "design-auditor": {"tools": "Read, Grep, Glob", "model": "inherit"},
}


def render(source: Path) -> tuple[Path, str]:
    text = source.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        sys.exit(f"{source}: missing frontmatter")
    end = text.index("\n---\n", 4)
    frontmatter, body = text[4:end], text[end + 5 :]
    name = source.stem
    if name not in CLAUDE_FIELDS:
        sys.exit(f"{source}: no Claude fields for '{name}' in {Path(__file__).name}")
    extra = "".join(f"{k}: {v}\n" for k, v in CLAUDE_FIELDS[name].items())
    rel = source.relative_to(ROOT).as_posix()
    header = (
        f"---\n# Generated from {rel} by scripts/sync-subagents.py. Edit the source, not this file.\n"
        f"{frontmatter}\n{extra}---\n"
    )
    return ROOT / "agents" / f"{name}.md", header + body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="fail on drift instead of writing")
    args = parser.parse_args()

    sources = sorted(ROOT.glob("skills/*/subagents/*.md"))
    if not sources:
        print("no subagent prompts found", file=sys.stderr)
        return 1

    drifted = []
    for source in sources:
        target, expected = render(source)
        current = target.read_text(encoding="utf-8") if target.exists() else None
        if current == expected:
            continue
        if args.check:
            drifted.append(target.relative_to(ROOT).as_posix())
        else:
            target.parent.mkdir(exist_ok=True)
            target.write_text(expected, encoding="utf-8")
            print(f"wrote {target.relative_to(ROOT).as_posix()}")

    if drifted:
        print("out of sync (run scripts/sync-subagents.py): " + ", ".join(drifted), file=sys.stderr)
        return 1
    if args.check:
        print(f"{len(sources)} subagent(s) in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())
