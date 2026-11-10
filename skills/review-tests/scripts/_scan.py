"""Shared file walking and test extraction for the review-tests scripts.

Stdlib only. Python tests are parsed with `ast`; TypeScript and JavaScript
tests with regexes and brace matching, which is good enough to find test
blocks and their calls but not a parser. Everything here produces candidates,
never findings.
"""

from __future__ import annotations

import ast
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist",
             "build", ".next", ".mypy_cache", ".pytest_cache", "coverage",
             ".tox", "site", "vendor", "target", ".turbo", "out"}

PY_SUFFIXES = (".py",)
TS_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts")

TEST_DIR_NAMES = {"tests", "test", "__tests__", "spec", "specs", "e2e"}
TS_TEST_NAME = re.compile(r"\.(test|spec)\.[cm]?[jt]sx?$")
GENERATED_NAME = re.compile(r"\.d\.[cm]?ts$|\.min\.js$|\.generated\.")


def suffixes_for(lang: str) -> tuple[str, ...]:
    out: tuple[str, ...] = ()
    if lang in ("py", "both"):
        out += PY_SUFFIXES
    if lang in ("ts", "both"):
        out += TS_SUFFIXES
    return out


_CANDIDATES: dict[Path, list[Path]] = {}


def candidate_files(root: Path) -> list[Path]:
    """Every file under root worth scanning: git's view when root is in a work
    tree (tracked plus untracked, minus ignored), otherwise a filtered walk.
    Hidden directories (.git, .claude/worktrees, .venv, ...) are skipped
    either way, so agent worktrees don't count as a second copy of the code."""
    if root in _CANDIDATES:
        return _CANDIDATES[root]
    paths: list[Path] | None = None
    try:
        res = subprocess.run(["git", "-C", str(root), "ls-files", "-co", "--exclude-standard", "-z"],
                             capture_output=True, timeout=60)
        if res.returncode == 0:
            paths = [root / p for p in res.stdout.decode("utf-8", "replace").split("\0") if p]
    except (OSError, subprocess.SubprocessError):
        paths = None
    if paths is None:
        paths = [p for p in root.rglob("*") if p.is_file()]
    out = []
    for p in sorted(paths):
        parts = p.relative_to(root).parts
        if any(part in SKIP_DIRS or (part.startswith(".") and part != ".") for part in parts[:-1]):
            continue
        if p.is_file():
            out.append(p)
    _CANDIDATES[root] = out
    return out


def walk(root: Path, lang: str = "both") -> list[Path]:
    suffixes = suffixes_for(lang)
    if root.is_file():
        return [root] if root.suffix in suffixes else []
    return [p for p in candidate_files(root)
            if p.suffix in suffixes and not GENERATED_NAME.search(p.name)]


def is_test_file(path: Path, root: Path) -> bool:
    name = path.name
    rel_parts = path.relative_to(root).parts if root in path.parents else path.parts
    if path.suffix == ".py":
        if name.startswith("test_") or name.endswith("_test.py") or name == "conftest.py":
            return True
    elif TS_TEST_NAME.search(name):
        return True
    return any(part in TEST_DIR_NAMES for part in rel_parts[:-1])


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def line_of(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


# ---------------------------------------------------------------- test cases

@dataclass
class TestCase:
    file: str
    line: int
    name: str
    body: str
    calls: list[str] = field(default_factory=list)   # callee names, in order
    targets: set[str] = field(default_factory=set)   # calls that are imported production names
    asserts: int = 0
    arrange_lines: int = 0                            # lines before the first assertion
    params: int = 0                                   # fixtures / parametrised args (py)
    decorators: str = ""                              # decorator source (py), e.g. @patch(...)


PY_ASSERT_CALL = re.compile(r"^(assert\w*|assert_\w+)$")
NOT_TARGETS = set(getattr(sys, "stdlib_module_names", ())) | {
    "pytest", "mock", "hypothesis", "freezegun", "responses", "httpx", "requests_mock"}


def _py_imported_names(tree: ast.AST) -> set[str]:
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            if any(seg in TEST_DIR_NAMES or seg.startswith("test") for seg in mod.split(".")):
                continue
            if mod.split(".")[0] in NOT_TARGETS:
                continue
            for a in node.names:
                names.add(a.asname or a.name)
        elif isinstance(node, ast.Import):
            for a in node.names:
                root = a.name.split(".")[0]
                if root not in NOT_TARGETS:
                    names.add(a.asname or root)
    return names


def _callee(node: ast.Call) -> str | None:
    f = node.func
    if isinstance(f, ast.Name):
        return f.id
    if isinstance(f, ast.Attribute):
        return f.attr
    return None


def _root_name(node: ast.AST) -> str | None:
    while isinstance(node, ast.Attribute):
        node = node.value
    return node.id if isinstance(node, ast.Name) else None


def py_tests(path: Path, root: Path) -> list[TestCase]:
    text = read(path)
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    imported = _py_imported_names(tree)
    lines = text.splitlines()
    out = []

    def visit(fn: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        body_src = "\n".join(lines[fn.lineno - 1: (fn.end_lineno or fn.lineno)])
        calls, targets, asserts, first_assert = [], set(), 0, None
        for node in ast.walk(fn):
            line = getattr(node, "lineno", None)
            if isinstance(node, ast.Assert) or (
                isinstance(node, ast.Call) and (c := _callee(node)) and PY_ASSERT_CALL.match(c)
            ) or (isinstance(node, ast.With) and "raises" in ast.unparse(node.items[0].context_expr)):
                asserts += 1
                if line and (first_assert is None or line < first_assert):
                    first_assert = line
            if isinstance(node, ast.Call):
                name = _callee(node)
                if name:
                    calls.append(name)
                    base = node.func if isinstance(node.func, ast.Name) else node.func
                    rootname = _root_name(base)
                    if name in imported or (rootname in imported and rootname != name):
                        targets.add(name)
        arrange = (first_assert - fn.lineno - 1) if first_assert else len(fn.body)
        params = len([a for a in fn.args.args if a.arg not in ("self", "cls")])
        decos = "\n".join("@" + ast.unparse(d) for d in fn.decorator_list)
        patched = sum(1 for d in fn.decorator_list if "patch" in ast.unparse(d))
        out.append(TestCase(rel(path, root), fn.lineno, fn.name, body_src, calls,
                            targets, asserts, max(arrange, 0), params - patched, decos))

    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test"):
            visit(node)
        elif isinstance(node, ast.ClassDef):
            for sub in node.body:
                if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)) and sub.name.startswith("test"):
                    visit(sub)
    return out


TS_TEST_START = re.compile(
    r"""\b(?:it|test)(?:\.(?:only|skip|concurrent|each\s*\([^)]*\)|each\s*`[^`]*`))?\s*\(\s*(['"`])(.*?)\1\s*,""",
    re.S)
TS_IMPORT = re.compile(
    r"""import\s+(?:type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\}|\*\s+as\s+(\w+))?\s*from\s*['"]([^'"]+)['"]""")
TS_CALL = re.compile(r"(?<![\w$.])(?:([A-Za-z_$][\w$]*)\.)?([A-Za-z_$][\w$]*)\s*(?:<[^<>()]*>)?\s*\(")
TS_ASSERT = re.compile(r"\b(?:expect|assert)\b")
TS_KEYWORDS = {"if", "for", "while", "switch", "return", "function", "catch", "typeof",
               "await", "new", "async", "expect", "it", "test", "describe", "import"}


def ts_imported_names(text: str) -> dict[str, str]:
    """Name -> module specifier, excluding test helpers and test frameworks."""
    out = {}
    for default, named, star, spec in TS_IMPORT.findall(text):
        if re.search(r"(^|/)(__tests__|tests?|fixtures?|mocks?|__mocks__)(/|$)|\.(test|spec)$", spec):
            continue
        if spec in {"vitest", "jest", "@jest/globals", "node:test", "node:assert", "assert",
                    "chai", "sinon", "@testing-library/react", "@testing-library/jest-dom"}:
            continue
        if default:
            out[default] = spec
        if star:
            out[star] = spec
        for part in named.split(","):
            part = part.strip().removeprefix("type ").strip()
            if not part:
                continue
            alias = part.split(" as ")[-1].strip()
            out[alias] = spec
    return out


def match_brace(text: str, start: int) -> int:
    """Index just past the brace block opening at or after `start`; -1 if none."""
    i = text.find("{", start)
    if i < 0:
        return -1
    depth, n, quote = 0, len(text), None
    while i < n:
        ch = text[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "'\"`":
            quote = ch
        elif text.startswith("//", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def ts_tests(path: Path, root: Path) -> list[TestCase]:
    text = read(path)
    imported = ts_imported_names(text)
    out = []
    for m in TS_TEST_START.finditer(text):
        end = match_brace(text, m.end())
        if end < 0:
            continue
        body = text[m.start(): end]
        calls, targets = [], set()
        for cm in TS_CALL.finditer(body):
            obj, name = cm.group(1), cm.group(2)
            if name in TS_KEYWORDS:
                continue
            calls.append(name)
            if name in imported or (obj and obj in imported):
                targets.add(name)
        blines = body.splitlines()
        first = next((i for i, ln in enumerate(blines) if TS_ASSERT.search(ln)), None)
        out.append(TestCase(rel(path, root), line_of(text, m.start()), m.group(2), body,
                            calls, targets, len(TS_ASSERT.findall(body)),
                            max((first if first is not None else len(blines)) - 1, 0), 0))
    return out


def tests_in(path: Path, root: Path) -> list[TestCase]:
    return py_tests(path, root) if path.suffix == ".py" else ts_tests(path, root)


# ------------------------------------------------------------------- tokens

TOKEN = re.compile(r"""'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\d[\d_.]*|[A-Za-z_$][\w$]*|==|!=|<=|>=|=>|\S""")


def tokens(src: str) -> list[str]:
    return TOKEN.findall(src)


def split_ident(name: str) -> list[str]:
    """export_csv_report / exportCsvReport -> ['export', 'csv', 'report']."""
    name = name.strip("_$")
    parts = re.split(r"_+", name)
    out = []
    for p in parts:
        out += [w.lower() for w in re.findall(r"[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+", p)]
    return [w for w in out if w]


def parse_focus(values: list[str] | None, root: Path) -> set[str] | None:
    """--focus takes paths or @file (one path per line). Returns rel paths."""
    if not values:
        return None
    paths: list[str] = []
    for v in values:
        if v.startswith("@"):
            paths += [ln.strip() for ln in Path(v[1:]).read_text().splitlines() if ln.strip()]
        else:
            paths.append(v)
    out = set()
    for p in paths:
        pp = Path(p)
        if not pp.is_absolute():
            pp = (Path.cwd() / pp)
        out.add(rel(pp.resolve(), root.resolve()))
    return out
