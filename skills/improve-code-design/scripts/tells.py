#!/usr/bin/env python3
"""Scan a tree for the mechanical tells, and name the family each points at.

These are the searches an agent would otherwise do by hand, slowly and
incompletely. Every hit is an *observation*, not a finding: it names a family
to test against, and it still has to survive the design-auditor gate. Several
map onto the fixed `observed` checklist the design-inventory subagent uses, so
the two vocabularies agree — see FAMILIES.md, "Reading inventory rows".

Usage:
    python3 tells.py PATH [--lang py|ts|both]

Exit code is always 0; hits are informational.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist",
             "build", ".next", ".mypy_cache", ".pytest_cache", "migrations"}

PY_PREDICATE = re.compile(r"^\s*def\s+((?:is|has|can|should)_\w+)\s*\(", re.M)
TS_PREDICATE = re.compile(
    r"^\s*(?:export\s+)?(?:async\s+)?(?:function\s+|(?:public|private)?\s*)"
    r"((?:is|has|can|should)[A-Z]\w*)\s*[(<]", re.M)

PY_DEFAULT_GETTER = re.compile(
    r"if\s+(\w+)\s+is\s+None\s*:\s*\n\s*return\s+\w+\(\s*\)", re.M)
TS_DEFAULT_GETTER = re.compile(
    r"(?:if\s*\([^)]*(?:==|===)\s*(?:null|undefined)\s*\)\s*\{?\s*return\s+(?:new\s+)?\w+\(\s*\)"
    r"|\?\?\s*(?:new\s+)?\w+\(\s*\))")

PY_CLEANUP = re.compile(r"^\s*def\s+(unregister|release|close|teardown|cleanup|reset|dispose)\w*\s*\(", re.M)
TS_CLEANUP = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?(?:function\s+)?(unregister|release|close|teardown|cleanup|dispose)\w*\s*[(<]", re.M)

PY_PUBLIC_DEF = re.compile(r"^(?:async\s+)?def\s+([a-zA-Z]\w*)\s*\(\s*(\w+)\s*:\s*([\w\.\[\]]+)", re.M)

FOREIGN_KEY_TABLE = re.compile(
    r"^\s*(_?[A-Z][A-Z0-9_]{3,})\s*(?::\s*[^=]+)?=\s*\{\s*$", re.M)

TS_ANY_BOUNDARY = re.compile(
    r"^\s*export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*:\s*(?:Promise<)?any\b", re.M)
TS_BARREL = re.compile(r"^\s*export\s+\*\s+from", re.M)


def walk(root: Path, suffixes: tuple[str, ...]) -> list[Path]:
    out = []
    for p in root.rglob("*"):
        if p.is_dir():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix in suffixes:
            out.append(p)
    return out


def report(title: str, why: str, hits: list[str]) -> None:
    if not hits:
        return
    print(f"\n## {title}  ({len(hits)})")
    print(f"   {why}")
    for h in hits[:40]:
        print(f"   {h}")
    if len(hits) > 40:
        print(f"   … {len(hits) - 40} more")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path", type=Path)
    ap.add_argument("--lang", choices=["py", "ts", "both"], default="both")
    args = ap.parse_args()

    root = args.path
    if not root.exists():
        sys.exit(f"no such path: {root}")

    suffixes: tuple[str, ...] = ()
    if args.lang in ("py", "both"):
        suffixes += (".py",)
    if args.lang in ("ts", "both"):
        suffixes += (".ts", ".tsx")

    files = walk(root, suffixes)
    print(f"Scanned {len(files)} files under {root}")

    # --- Split: same predicate defined in more than one module ---
    predicates: dict[str, set[str]] = defaultdict(set)
    default_getters: list[str] = []
    cleanup: list[str] = []
    tables: list[str] = []
    entry_points: dict[str, list[str]] = defaultdict(list)
    ts_any: list[str] = []
    barrels: list[str] = []

    for f in files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        rel = str(f.relative_to(root))
        is_py = f.suffix == ".py"

        for m in (PY_PREDICATE if is_py else TS_PREDICATE).finditer(text):
            predicates[m.group(1)].add(rel)

        gm = (PY_DEFAULT_GETTER if is_py else TS_DEFAULT_GETTER).search(text)
        if gm:
            line = text[: gm.start()].count("\n") + 1
            default_getters.append(f"{rel}:{line}")

        for m in (PY_CLEANUP if is_py else TS_CLEANUP).finditer(text):
            if "contextmanager" not in text and "Symbol.dispose" not in text:
                line = text[: m.start()].count("\n") + 1
                cleanup.append(f"{rel}:{line}  {m.group(1)}")

        for m in FOREIGN_KEY_TABLE.finditer(text):
            tail = text[m.end(): m.end() + 400]
            if re.search(r'"[a-z][\w\-]*(?:@\d+)?"\s*:', tail):
                line = text[: m.start()].count("\n") + 1
                tables.append(f"{rel}:{line}  {m.group(1)}")

        if is_py:
            for m in PY_PUBLIC_DEF.finditer(text):
                name, _arg, typ = m.groups()
                if not name.startswith("_"):
                    entry_points[typ].append(f"{rel}:{name}")
        else:
            for m in TS_ANY_BOUNDARY.finditer(text):
                ts_any.append(f"{rel}:{text[: m.start()].count(chr(10)) + 1}")
            if TS_BARREL.search(text) and f.name in ("index.ts", "index.tsx"):
                barrels.append(rel)

    split = {k: v for k, v in predicates.items() if len(v) > 1}
    report(
        "Same predicate defined in multiple modules",
        "Structure — one question answered in two places. Only a finding if "
        "both answer the same question; is_expired on a token and on a cache "
        "entry are two questions.",
        [f"{name}: " + ", ".join(sorted(mods)) for name, mods in sorted(split.items())],
    )

    report(
        "Getters that manufacture a default",
        "Make-it-work — `silent default`. Only a finding if the default is at "
        "the surfacing site rather than the production site.",
        default_getters,
    )

    report(
        "Cleanup methods with no context manager in the file",
        "Rigidity or Make-it-work — `cleanup obligation`. Only a finding if "
        "callers outside the defining file must remember it.",
        cleanup,
    )

    report(
        "Constant tables keyed by what look like foreign type ids",
        "Structure — another module's identifiers stored here. Only a finding "
        "at three entries or more; two is YAGNI.",
        tables,
    )

    siblings = {
        t: v for t, v in entry_points.items()
        if len(v) > 1 and t not in {"str", "int", "bool", "float", "Any", "bytes",
                                    "dict", "list", "Path", "UUID"}
    }
    report(
        "Public functions sharing one first-argument type",
        "Bloat or Structure — siblings that may offer different guarantees. "
        "Only a finding if one applies a timeout, retry or auth check the "
        "other does not, with nothing in either signature saying so.",
        [f"{t}: " + ", ".join(sorted(v)) for t, v in sorted(siblings.items())],
    )

    report(
        "Exported functions returning any",
        "Make-it-work — `untyped boundary`. Only a finding where the value "
        "arrives; an internal any is a different question.",
        ts_any,
    )
    report(
        "Barrel files",
        "Over-build — re-export walls flatten the package interface and hide "
        "what a caller actually depends on.",
        barrels,
    )

    print("\nEvery hit above is an observation, not a finding. Each names a "
          "family to test, and each still has to survive the design-auditor "
          "gate. Drop anything you cannot say how you would know was wrong.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
