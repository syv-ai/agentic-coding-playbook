#!/usr/bin/env python3
"""Find production code that only tests reach.

Three tells, all YAGNI: a symbol whose only references are in tests, a
parameter that only tests pass, and production code that switches on whether
it is running under a test. Each is a candidate: code reached by reflection,
a framework, a config file outside the scan or another repository will look
dead here, so every hit needs one check before it becomes a finding.

A dedicated tool is more precise; this script says which one the project
already has, and is the fallback when it has none.

Usage:
    python3 reach.py ROOT [--lang py|ts|both] [--focus PATH ... | --focus @list.txt]

--focus keeps only symbols defined in those files (the diff), while
references are still counted across the whole tree.

Exit code is always 0; hits are informational.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _scan import candidate_files, is_test_file, line_of, parse_focus, read, rel, walk  # noqa: E402

IDENT = re.compile(r"[A-Za-z_$][\w$]*")
CONFIG_SUFFIXES = {".toml", ".cfg", ".ini", ".yaml", ".yml", ".json", ".html", ".vue", ".svelte"}
CONFIG_SKIP = {"package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock", "uv.lock"}
PASSIVE_DECORATORS = {"staticmethod", "classmethod", "property", "cached_property", "lru_cache",
                      "cache", "wraps", "abstractmethod", "overload", "override", "dataclass",
                      "setter", "getter", "deleter", "total_ordering", "final"}

TS_EXPORT = re.compile(
    r"^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?"
    r"(?:function\s*\*?|const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)", re.M)
TS_METHOD = re.compile(
    r"^\s+(?:(?:public|protected|private|static|async|readonly|override|get|set)\s+)*"
    r"([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\([^;{]*\)\s*(?::\s*[^{;]+)?\{", re.M)
TS_NOT_METHOD = {"if", "for", "while", "switch", "catch", "function", "return", "constructor", "else"}

REEXPORT_FILES = {"__init__.py", "index.ts", "index.tsx", "index.js", "index.mjs", "mod.ts"}
ENTRY_FILES = {"main.py", "__main__.py", "cli.py", "main.ts", "main.tsx", "server.ts", "main.js"}

# Files a framework loads by convention: their exports have no importer.
FRAMEWORK_FILE = re.compile(
    r"(^|/)(app|pages|routes)/(.*/)?(page|layout|route|loading|error|not-found|template|default"
    r"|head|\+page|\+layout|\+server)\.[cm]?[jt]sx?$|(^|/)pages/.*\.[cm]?[jt]sx?$"
    r"|(^|/)(middleware|instrumentation|next\.config|vite\.config|vitest\.config|jest\.config"
    r"|playwright\.config|tailwind\.config|postcss\.config|eslint\.config)\.[cm]?[jt]s$"
    r"|(^|/)(conftest|manage|wsgi|asgi|settings|setup|noxfile|fabfile)\.py$|(^|/)migrations/")

TEST_SWITCH = re.compile(
    r"""NODE_ENV\s*[!=]==?\s*['"]test['"]|['"]test['"]\s*[!=]==?\s*process\.env\.NODE_ENV"""
    r"""|process\.env\.(?:JEST_WORKER_ID|VITEST\w*)|import\.meta\.vitest"""
    r"""|['"]pytest['"]\s+in\s+sys\.modules|PYTEST_CURRENT_TEST"""
    r"""|\b(?:IS_)?TESTING\b|\bTEST_MODE\b|_?[Ff]or_?[Tt]esting\b|ForTests?\b|visibleForTesting"""
    r"""|(?:#|//)\s*(?:only\s+)?(?:used\s+)?(?:for|in|by)\s+tests?\b""", re.I)


def detect_tools(root: Path) -> list[str]:
    found = []
    pkg = root / "package.json"
    if pkg.exists():
        try:
            data = json.loads(read(pkg))
        except json.JSONDecodeError:
            data = {}
        deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        for tool, cmd in (("knip", "npx knip --include exports,files,types"),
                          ("ts-prune", "npx ts-prune"),
                          ("ts-unused-exports", "npx ts-unused-exports tsconfig.json")):
            if tool in deps:
                found.append(f"{tool}: {cmd}")
    py_meta = " ".join(read(root / n) for n in ("pyproject.toml", "requirements-dev.txt",
                                                  "requirements.txt", "setup.cfg", "dev-requirements.txt"))
    if re.search(r"\bvulture\b", py_meta):
        found.append("vulture: vulture <src> --min-confidence 60  (run it without the tests "
                     "directory, then with it; names that disappear are test-only)")
    if re.search(r"\bdeadcode\b", py_meta):
        found.append("deadcode: deadcode <src>")
    if (root / "go.mod").exists():
        found.append("go: deadcode ./...  (golang.org/x/tools/cmd/deadcode; reports code "
                     "unreachable from main, so test-only code shows up)")
    return found


class Symbol:
    def __init__(self, name: str, file: str, line: int, kind: str, note: str = ""):
        self.name, self.file, self.line, self.kind, self.note = name, file, line, kind, note


def py_symbols(path: Path, root: Path) -> tuple[list[Symbol], list[tuple[str, list[str]]]]:
    text = read(path)
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return [], []
    r = rel(path, root)
    out, funcs = [], []

    def deco_note(node) -> str:
        names = []
        for d in node.decorator_list:
            target = d.func if isinstance(d, ast.Call) else d
            name = target.attr if isinstance(target, ast.Attribute) else getattr(target, "id", "")
            if name not in PASSIVE_DECORATORS:
                names.append(name or "?")
        return f"decorated @{', @'.join(names)}" if names else ""

    def add_func(node, kind):
        out.append(Symbol(node.name, r, node.lineno, kind, deco_note(node)))
        kw = [a.arg for a in node.args.args[len(node.args.args) - len(node.args.defaults):]]
        kw += [a.arg for a, d in zip(node.args.kwonlyargs, node.args.kw_defaults) if d is not None]
        kw = [k for k in kw if k not in ("self", "cls")]
        if kw:
            funcs.append((node.name, kw))

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            add_func(node, "function")
        elif isinstance(node, ast.ClassDef):
            out.append(Symbol(node.name, r, node.lineno, "class", deco_note(node)))
            for sub in node.body:
                if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)) and not (
                        sub.name.startswith("__") and sub.name.endswith("__")):
                    add_func(sub, f"method of {node.name}")
    return out, funcs


def ts_symbols(path: Path, root: Path) -> list[Symbol]:
    text = read(path)
    r = rel(path, root)
    out = [Symbol(m.group(1), r, line_of(text, m.start()), "export") for m in TS_EXPORT.finditer(text)]
    if re.search(r"\bclass\s+\w+", text):
        for m in TS_METHOD.finditer(text):
            if m.group(1) not in TS_NOT_METHOD:
                out.append(Symbol(m.group(1), r, line_of(text, m.start()), "method"))
    return out


def config_files(root: Path) -> list[Path]:
    return [p for p in candidate_files(root) if p.suffix in CONFIG_SUFFIXES and p.name not in CONFIG_SKIP]


def report(title: str, why: str, hits: list[str], limit: int = 60) -> None:
    if not hits:
        return
    print(f"\n## {title}  ({len(hits)})")
    print(f"   {why}")
    for h in hits[:limit]:
        print(f"   {h}")
    if len(hits) > limit:
        print(f"   … {len(hits) - limit} more")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--lang", choices=["py", "ts", "both"], default="both")
    ap.add_argument("--focus", nargs="*")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        sys.exit(f"not a directory: {root}")
    focus = parse_focus(args.focus, root)

    tools = detect_tools(root)
    if tools:
        print("The project has a dead-code tool. Prefer it; use the hits below as a cross-check:")
        for t in tools:
            print(f"   {t}")

    files = walk(root, args.lang)
    test_files = [f for f in files if is_test_file(f, root)]
    test_set = set(test_files)
    prod_files = [f for f in files if f not in test_set]
    print(f"Scanned {len(prod_files)} production and {len(test_files)} test files under {root}")

    symbols: list[Symbol] = []
    py_kwargs: list[tuple[str, str, list[str]]] = []
    for f in prod_files:
        if f.suffix == ".py":
            syms, funcs = py_symbols(f, root)
            symbols += syms
            py_kwargs += [(rel(f, root), n, kw) for n, kw in funcs]
        else:
            symbols += ts_symbols(f, root)
    if focus is not None:
        symbols = [s for s in symbols if s.file in focus]

    # Inverted index: symbol name -> {file: occurrences}, for the names we care about.
    wanted = {s.name for s in symbols}
    index: dict[str, dict[str, int]] = defaultdict(dict)
    for f in files + config_files(root):
        r = rel(f, root)
        for name, n in Counter(IDENT.findall(read(f))).items():
            if name in wanted:
                index[name][r] = n
    test_rel = {rel(f, root) for f in test_files}

    only_tests, public_api, registered, unused = [], [], [], []
    for s in symbols:
        prod_refs, reexport_refs, test_refs = 0, 0, 0
        for r, n in index.get(s.name, {}).items():
            if r == s.file:
                n -= 1
            if n <= 0:
                continue
            if r in test_rel:
                test_refs += 1
            elif Path(r).name in REEXPORT_FILES:
                reexport_refs += 1
            else:
                prod_refs += 1
        if prod_refs:
            continue
        where = f"{s.file}:{s.line}  {s.name}  ({s.kind})"
        if FRAMEWORK_FILE.search(s.file) or Path(s.file).name in ENTRY_FILES:
            s.note = s.note or "entry point or framework convention file"
        if s.note:
            if test_refs:
                registered.append(f"{where}  {s.note}")
        elif reexport_refs:
            if test_refs:
                public_api.append(f"{where}  referenced in {test_refs} test file(s)")
        elif test_refs:
            only_tests.append(f"{where}  referenced in {test_refs} test file(s)")
        elif s.name != "main":
            unused.append(where)

    report("Referenced only from tests",
           "Dead code kept alive by its tests (YAGNI). Before calling it a finding, check it "
           "isn't reached by reflection, a framework, or another repository.",
           only_tests)
    report("Only re-exported from a package entry point, otherwise test-only",
           "Possibly public API used outside this repo, possibly dead. Ask who consumes it.",
           public_api)
    report("Registered by a decorator or a framework convention, otherwise test-only",
           "Usually a framework hook (route, task, command, page). Skip unless the "
           "registration itself is unused.",
           registered)
    report("Referenced nowhere, not even by tests", "Plain dead code; out of scope for a "
           "test review, mention the count in one line.", unused, limit=5)

    # Parameters that only tests pass.
    seams = []
    texts = {f: read(f) for f in files if f.suffix == ".py"}
    for file, fn, kws in py_kwargs:
        if focus is not None and file not in focus:
            continue
        call = re.compile(rf"\b{re.escape(fn)}\s*\(")
        for kw in kws:
            arg = re.compile(rf"\b{re.escape(kw)}\s*=(?!=)")
            in_prod = in_test = 0
            for f, text in texts.items():
                if fn not in text:
                    continue
                r = rel(f, root)
                for m in call.finditer(text):
                    window = text[m.end(): m.end() + 400]
                    if arg.search(window.split(")\n", 1)[0]):
                        if r in test_rel:
                            in_test += 1
                        elif not (r == file and text[:m.start()].rstrip().endswith("def")):
                            in_prod += 1
            if in_test and not in_prod:
                seams.append(f"{file}  {fn}({kw}=…)  passed by {in_test} test call(s), no production call")
    report("Parameters only tests pass",
           "A seam added for the test. Fine when it injects a real boundary (clock, network, "
           "randomness); a finding when it switches behaviour production never uses.",
           seams)

    switches = []
    for f in prod_files:
        r = rel(f, root)
        if focus is not None and r not in focus:
            continue
        text = read(f)
        for m in TEST_SWITCH.finditer(text):
            line = text.splitlines()[line_of(text, m.start()) - 1].strip()
            switches.append(f"{r}:{line_of(text, m.start())}  {line[:100]}")
    report("Production code that knows about tests",
           "A branch or export that exists for tests: the test exercises a path production "
           "never takes. Usually the fix is a real seam or deleting the branch.",
           switches)

    print("\nEvery hit above is an observation, not a finding. Each still needs its "
          "references checked by hand and has to survive the test-auditor gate.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
