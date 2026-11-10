#!/usr/bin/env python3
"""Scan a test suite for the tells of tests that pin a design, and of
production code written once per variant.

    internal mocks         patching or mocking the project's own modules
    mock-heavy tests       three or more doubles in one test
    interaction-only       asserts calls on doubles and no outcome
    private access         reaching past the public interface
    heavy arrange          long setup before the first assertion
    variant families       sibling production functions that differ by one
                           name token and have similar bodies (exportCsv/exportPdf)

Each hit names the family it points at (see FAMILIES.md) and is a candidate,
not a finding.

Usage:
    python3 tells.py ROOT [--lang py|ts|both] [--arrange 20]
                          [--focus PATH ... | --focus @list.txt]

Exit code is always 0; hits are informational.
"""

from __future__ import annotations

import argparse
import ast
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _scan import (TestCase, is_test_file, line_of, match_brace, parse_focus, read, rel,  # noqa: E402
                   split_ident, tests_in, tokens, walk)

PY_PATCH = re.compile(r"""\b(?:mock\.|mocker\.)?patch(?:\.object|\.dict)?\(\s*['"]([\w.]+)['"]""")
TS_MODULE_MOCK = re.compile(r"""\b(?:jest|vi)\.(?:mock|doMock|unstable_mockModule)\(\s*['"]([^'"]+)['"]""")
DOUBLE = re.compile(r"\b(?:MagicMock|AsyncMock|Mock|create_autospec|patch(?:\.object)?|mocker\.patch"
                    r"|jest\.fn|vi\.fn|jest\.spyOn|vi\.spyOn|sinon\.(?:stub|spy|mock)|mock\.module)\b")
INTERACTION = re.compile(r"\b(?:assert_(?:not_)?called\w*|assert_any_call|assert_has_calls|call_args(?:_list)?"
                         r"|mock_calls|call_count|toHaveBeenCalled\w*|toBeCalled\w*|toHaveBeenNthCalledWith"
                         r"|toHaveBeenLastCalledWith|calledWith|calledOnce)\b")
OUTCOME_TS = re.compile(r"expect\((?![^)]*\b(?:spy|mock|fn|stub)\w*\))[^)]*\)\s*\.\s*(?:not\.)?(?!toHaveBeenCalled|toBeCalled)\w+")
PY_PRIVATE_ATTR = re.compile(r"(?<![\w.])(?!self\b|cls\b)([a-z_]\w*)\._(?!_)[a-z]\w*")
PY_PRIVATE_IMPORT = re.compile(r"^\s*from\s+[\w.]+\s+import\s+.*\b_[a-z]\w*", re.M)
TS_PRIVATE = re.compile(r"\bas\s+any\b|\bas\s+unknown\s+as\b|\[\s*['\"][_#]\w+['\"]\s*\]|@ts-(?:ignore|expect-error)")


def project_packages(root: Path) -> set[str]:
    """Top-level importable names that belong to this project."""
    out = set()
    for base in (root, root / "src", root / "lib", root / "app"):
        if not base.is_dir():
            continue
        for p in base.iterdir():
            if p.is_dir() and (p / "__init__.py").exists():
                out.add(p.name)
            elif p.suffix == ".py" and not p.name.startswith("test"):
                out.add(p.stem)
    return out


def is_internal_ts(spec: str) -> bool:
    return spec.startswith((".", "@/", "~/", "src/", "#"))


def report(title: str, why: str, hits: list[str]) -> None:
    if not hits:
        return
    print(f"\n## {title}  ({len(hits)})")
    print(f"   {why}")
    for h in hits[:40]:
        print(f"   {h}")
    if len(hits) > 40:
        print(f"   … {len(hits) - 40} more")


def prod_functions(path: Path, root: Path) -> list[tuple[str, int, str]]:
    """(name, line, body) for top-level functions and methods."""
    text = read(path)
    out = []
    if path.suffix == ".py":
        try:
            tree = ast.parse(text)
        except SyntaxError:
            return []
        lines = text.splitlines()
        nodes = []
        for n in tree.body:
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
                nodes.append(n)
            elif isinstance(n, ast.ClassDef):
                nodes += [s for s in n.body if isinstance(s, (ast.FunctionDef, ast.AsyncFunctionDef))]
        for n in nodes:
            if n.name.startswith("__"):
                continue
            body = "\n".join(lines[n.lineno: n.end_lineno or n.lineno])
            out.append((n.name, n.lineno, body))
        return out
    pat = re.compile(r"(?:^|\n)\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)"
                     r"|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>)")
    for m in pat.finditer(text):
        end = match_brace(text, m.end())
        if end < 0:
            continue
        name = m.group(1) or m.group(2)
        out.append((name, line_of(text, m.start()) + (1 if text[m.start()] == "\n" else 0),
                    text[m.end(): end]))
    return out


def similarity(a: str, b: str) -> float:
    def sh(s: str) -> set:
        t = [("<L>" if re.match(r"^['\"`\d]", x) else x) for x in tokens(s)]
        return {tuple(t[i:i + 3]) for i in range(max(len(t) - 2, 1))}
    sa, sb = sh(a), sh(b)
    return len(sa & sb) / len(sa | sb) if sa and sb else 0.0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--lang", choices=["py", "ts", "both"], default="both")
    ap.add_argument("--arrange", type=int, default=20, help="arrange lines that count as heavy")
    ap.add_argument("--focus", nargs="*")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.exists():
        sys.exit(f"no such path: {root}")
    focus = parse_focus(args.focus, root)
    packages = project_packages(root)

    files = walk(root, args.lang)
    tests = [f for f in files if is_test_file(f, root)]
    test_set = set(tests)
    prods = [f for f in files if f not in test_set]
    print(f"Scanned {len(tests)} test files and {len(prods)} production files under {root}")

    internal_mocks, private, mock_heavy, interaction_only, heavy = [], [], [], [], []
    tested_names: dict[str, int] = defaultdict(int)

    for f in tests:
        r = rel(f, root)
        text = read(f)
        cases: list[TestCase] = tests_in(f, root)
        for c in cases:
            for t in c.targets:
                tested_names[t] += 1
        if focus is not None and r not in focus:
            continue

        if f.suffix == ".py":
            for m in PY_PATCH.finditer(text):
                if m.group(1).split(".")[0] in packages:
                    internal_mocks.append(f"{r}:{line_of(text, m.start())}  patch('{m.group(1)}')")
            for m in PY_PRIVATE_ATTR.finditer(text):
                private.append(f"{r}:{line_of(text, m.start())}  {m.group(0)}")
            for m in PY_PRIVATE_IMPORT.finditer(text):
                private.append(f"{r}:{line_of(text, m.start())}  {m.group(0).strip()[:90]}")
        else:
            for m in TS_MODULE_MOCK.finditer(text):
                if is_internal_ts(m.group(1)):
                    internal_mocks.append(f"{r}:{line_of(text, m.start())}  mock('{m.group(1)}')")
            for m in TS_PRIVATE.finditer(text):
                private.append(f"{r}:{line_of(text, m.start())}  {m.group(0)}")

        for c in cases:
            doubles = len(DOUBLE.findall(c.decorators + "\n" + c.body))
            if doubles >= 3:
                mock_heavy.append(f"{c.file}:{c.line}  {c.name}  ({doubles} doubles)")
            inter = len(INTERACTION.findall(c.body))
            if inter:
                if f.suffix == ".py":
                    outcome = len(re.findall(r"^\s*assert\s", c.body, re.M)) + len(
                        re.findall(r"\b(?:assertEqual|assertTrue|assertFalse|assertIn|assertRaises|raises)\b", c.body))
                else:
                    outcome = len(OUTCOME_TS.findall(c.body)) - inter
                if outcome <= 0:
                    interaction_only.append(f"{c.file}:{c.line}  {c.name}  ({inter} call assertion(s), no outcome)")
            if c.arrange_lines >= args.arrange or c.params >= 6:
                extra = f", {c.params} fixtures" if c.params >= 6 else ""
                heavy.append(f"{c.file}:{c.line}  {c.name}  ({c.arrange_lines} lines before the first assertion{extra})")

    report("Mocks of the project's own modules",
           "Pinning design — the test fixes which collaborator is called, so a refactor "
           "with no behaviour change breaks it. Only a finding when the mocked thing is not "
           "a system boundary (network, clock, filesystem, third-party service).",
           internal_mocks)
    report("Tests with three or more doubles",
           "Pinning design — the unit creates or reaches too many collaborators. Often the "
           "remedy is in production: pass dependencies in, or move logic into a pure core.",
           mock_heavy)
    report("Tests that only assert calls on doubles",
           "Pinning design — they prove the code is wired the way it is today, not that it "
           "does anything. A finding unless the call itself is the contract (an emitted event, "
           "an outbound request).",
           interaction_only)
    report("Reaching past the public interface",
           "Pinning design — private attributes, private imports, `as any` and ts-ignore in "
           "tests. Either the behaviour is observable through the interface (test it there) or "
           "the module hides something callers need (a design lead).",
           private)
    report("Heavy arrange",
           "Pinning design — setup this long means the interface asks too much of callers. "
           "Not a finding when the setup is a realistic fixture of the domain.",
           heavy)

    # Variant families: functions in one file whose names differ by exactly one
    # token at the same position and whose bodies are mostly the same.
    by_file: dict[str, list] = defaultdict(list)
    for f in prods:
        r = rel(f, root)
        for n, ln, b in prod_functions(f, root):
            if len(tokens(b)) >= 25 and len(split_ident(n)) >= 2:
                by_file[r].append((n, ln, b, split_ident(n)))
    families = []
    for r, fns in by_file.items():
        if focus is not None and r not in focus:
            continue
        parent = list(range(len(fns)))

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        best: dict[int, float] = defaultdict(float)
        for i, a in enumerate(fns):
            for j in range(i + 1, len(fns)):
                b = fns[j]
                if len(a[3]) != len(b[3]) or sum(x != y for x, y in zip(a[3], b[3])) != 1:
                    continue
                sim = similarity(a[2], b[2])
                if sim >= 0.7:
                    parent[find(i)] = find(j)
                    best[i] = max(best[i], sim)
                    best[j] = max(best[j], sim)
        groups: dict[int, list[int]] = defaultdict(list)
        for i in range(len(fns)):
            groups[find(i)].append(i)
        for g in groups.values():
            if len(g) < 2:
                continue
            listed = ", ".join(f"{fns[i][0]} (:{fns[i][1]}, {tested_names.get(fns[i][0], 0)} tests)" for i in g)
            families.append(f"{r} [{len(g)}, body similarity up to {max(best[i] for i in g):.2f}]: {listed}")
    families.sort(key=lambda h: -int(re.search(r"\[(\d+)", h).group(1)))
    report("Variant families in production",
           "Over-specialised — one behaviour written once per variant, each with its own tests. "
           "Two siblings make a seam worth naming, three make it a finding. Check the tests: "
           "near-identical tests across the family (dupes.py) confirm it.",
           families)

    print("\nEvery hit above is an observation, not a finding. Each names a family to "
          "test against in FAMILIES.md, and each still has to survive the test-auditor gate.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
