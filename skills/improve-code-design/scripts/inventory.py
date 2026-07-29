#!/usr/bin/env python3
"""Enumerate reviewable units, partition them for delegation, verify coverage.

Exists because open-ended delegation loses recall. An agent told "find design
problems in this package" satisfices: it returns the first real things it sees
and nothing in the task can tell it that it missed the rest. This script makes
the unit list explicit up front, so delegation becomes "cover these 14 files"
instead of "find problems", and coverage becomes arithmetic instead of a claim.

    python3 inventory.py plan PATH [--batch 8] [--lang py|ts|both]
    python3 inventory.py check PATH --covered covered.txt

`plan` prints numbered batches to hand out, one per subagent.
`check` reads a newline-separated list of files that came back and reports
what is missing. Every unit must appear in some return or the review is
partial and must say so.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist",
             "build", ".next", ".mypy_cache", ".pytest_cache", "migrations",
             ".tox", "coverage", "__generated__"}
SKIP_SUFFIX_HINTS = ("_pb2.py", ".generated.ts", ".gen.go", ".d.ts")
TEST_HINTS = ("test_", "_test.", ".test.", ".spec.", "/tests/", "/__tests__/")


def units(root: Path, suffixes: tuple[str, ...], include_tests: bool) -> list[tuple[Path, int]]:
    out: list[tuple[Path, int]] = []
    for p in sorted(root.rglob("*")):
        if p.is_dir() or p.suffix not in suffixes:
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        rel = str(p.relative_to(root))
        if rel.endswith(SKIP_SUFFIX_HINTS):
            continue
        if not include_tests and any(h in "/" + rel for h in TEST_HINTS):
            continue
        try:
            lines = sum(1 for _ in p.open("rb"))
        except OSError:
            continue
        if lines < 15:
            continue
        out.append((p.relative_to(root), lines))
    return out


def plan(args: argparse.Namespace) -> int:
    root = args.path
    found = units(root, args.suffixes, args.include_tests)
    if not found:
        print("No reviewable units found. Widen --lang or check the path.")
        return 0

    # Batch by directory so each subagent gets a coherent area, then split
    # oversized directories. Coherence matters more than even batch sizes:
    # a subagent that holds one package can answer "what varies here".
    by_dir: dict[str, list[tuple[Path, int]]] = {}
    for rel, n in found:
        by_dir.setdefault(str(rel.parent), []).append((rel, n))

    batches: list[list[tuple[Path, int]]] = []
    for _d, items in sorted(by_dir.items()):
        for i in range(0, len(items), args.batch):
            batches.append(items[i: i + args.batch])

    total_lines = sum(n for _r, n in found)
    print(f"{len(found)} units, {total_lines} lines, {len(batches)} batches\n")
    for i, batch in enumerate(batches, 1):
        head = batch[0][0].parent
        print(f"--- batch {i}  ({head})")
        for rel, n in batch:
            print(f"    {rel}  ({n})")
    print("\nHand each batch to one subagent. Ask for an inventory table, not")
    print("findings. Every unit above must appear in some return.")
    print(f"\nSave the returned file list and run:")
    print(f"    python3 inventory.py check {root} --covered covered.txt")
    return 0


def check(args: argparse.Namespace) -> int:
    root = args.path
    expected = {str(r) for r, _n in units(root, args.suffixes, args.include_tests)}
    try:
        got = {ln.strip() for ln in args.covered.read_text().splitlines() if ln.strip()}
    except OSError as exc:
        sys.exit(f"cannot read --covered: {exc}")

    # Tolerate absolute paths and ./ prefixes in the returned list.
    norm = set()
    for g in got:
        g = g.removeprefix("./")
        try:
            g = str(Path(g).resolve().relative_to(root.resolve()))
        except (ValueError, OSError):
            pass
        norm.add(g)

    missing = sorted(expected - norm)
    extra = sorted(norm - expected)
    covered = len(expected) - len(missing)
    pct = covered / len(expected) * 100 if expected else 100.0

    print(f"coverage: {covered}/{len(expected)} ({pct:.0f}%)")
    if missing:
        print(f"\nNOT COVERED ({len(missing)}) — the review is partial and must say so:")
        for m in missing[:40]:
            print(f"    {m}")
        if len(missing) > 40:
            print(f"    … {len(missing) - 40} more")
    if extra:
        print(f"\nreturned but not in the unit list ({len(extra)}):")
        for e in extra[:10]:
            print(f"    {e}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("plan", "check"):
        p = sub.add_parser(name)
        p.add_argument("path", type=Path)
        p.add_argument("--lang", choices=["py", "ts", "both"], default="both")
        p.add_argument("--include-tests", action="store_true")
        if name == "plan":
            p.add_argument("--batch", type=int, default=8)
        else:
            p.add_argument("--covered", type=Path, required=True)
    args = ap.parse_args()

    if not args.path.exists():
        sys.exit(f"no such path: {args.path}")
    suffixes: tuple[str, ...] = ()
    if args.lang in ("py", "both"):
        suffixes += (".py",)
    if args.lang in ("ts", "both"):
        suffixes += (".ts", ".tsx", ".js", ".jsx")
    args.suffixes = suffixes

    return plan(args) if args.cmd == "plan" else check(args)


if __name__ == "__main__":
    raise SystemExit(main())
