# Native controls by harness

Where each harness keeps its safety settings, what its controls can do, and how to confirm they are active. These features change often and several are in preview: check the harness's current documentation before configuring anything, and trust its own status views over this file.

Across harnesses, watch for three things:

- **"Deny" doesn't always block.** In some harnesses a deny entry only requires approval.
- **A sandbox usually covers shell commands only.** Built-in file tools, MCP servers and web access may sit outside it.
- **Hooks are for the inventory.** Note existing hooks and what they do. Don't write new ones: this skill configures native settings only.

## Claude Code

**Settings:** managed settings (organisation), `~/.claude/settings.json` (user), `.claude/settings.json` (project, shared), `.claude/settings.local.json` (project, personal). MCP servers in `.mcp.json`. Rules from every level merge; managed settings can't be overridden.

- **Permission rules** — `permissions.deny`, `permissions.ask` and `permissions.allow`, evaluated deny → ask → allow. Commands: `Bash(git push *)`. Claude Code splits compound commands (`&&`, `||`, `;`, pipes) and also checks subshells, command substitutions and loop bodies, so `cd x && git push` still matches. Rules match command text, so a script that runs the command internally gets past them.
- **Files** — `Read(./.env)` and `Edit(./migrations/**)` deny or ask rules cover the built-in file tools. They don't stop a shell command from reading the file; the sandbox does that.
- **Sandbox** — `sandbox.enabled`. OS-enforced for shell commands and their child processes (Seatbelt on macOS; bubblewrap and socat needed on Linux and WSL2).
  - Filesystem: `sandbox.filesystem.denyRead`, `denyWrite`, `allowRead`, `allowWrite`.
  - Credentials: `sandbox.credentials.files` and `envVars` with `"mode": "deny"` or `"mask"` (mask keeps tools like `gh` working).
  - Network: `sandbox.network.allowedDomains` and `deniedDomains`. `strictAllowlist: true` (user, managed or CLI settings only) denies instead of prompting.
  - `allowUnsandboxedCommands: false` removes the escape hatch that lets a failing command retry outside the sandbox.
- **MCP** — deny or ask rules on `mcp__<server>__<tool>`, or `mcp__<server>__*` for a whole server.
- **Modes** — `permissions.disableBypassPermissionsMode: "disable"` and `disableAutoMode: "disable"` stop those modes being used.

**Verify:** `/permissions` lists every rule and the file it came from. `/sandbox` shows the sandbox state and missing dependencies. Then trigger a rule with a harmless matching command.

## OpenAI Codex (CLI and IDE extension)

**Settings:** `~/.codex/config.toml`, `.codex/config.toml` (loaded only for trusted projects), `/etc/codex/config.toml`. Command rules in `~/.codex/rules/` and `.codex/rules/`. Existing hooks in `hooks.json` at both levels.

- **Sandbox and approvals** — `sandbox_mode` (`read-only`, `workspace-write`, `danger-full-access`) and `approval_policy`. OS-enforced. Network is off in `workspace-write` unless `[sandbox_workspace_write] network_access = true`; restricting it to specific domains uses the network proxy feature.
- **Command rules** (experimental) — Starlark `.rules` files with `prefix_rule(pattern=[...], decision="allow" | "prompt" | "forbidden")`. Simple `&&` chains are split; scripts with substitutions or control flow are judged whole.
- **Files** (beta) — permission profiles can deny paths such as `**/*.env`. They can't be combined with `sandbox_mode`.
- **MCP** — `mcp_servers.<id>.disabled_tools`, and per-tool `approval_mode`.

**Verify:** `/status`, `/permissions` and `/debug-config` in a session; `codex execpolicy check --rules <file> -- <command>` for a rule.

## GitHub Copilot in VS Code

**Settings:** `.vscode/settings.json` (project) and user `settings.json`; MCP in `.vscode/mcp.json`. Existing hooks in `.github/hooks/`, `~/.copilot/hooks`, and `.claude/settings*.json`, which VS Code also loads. Red flags: `chat.tools.global.autoApprove` turned on.

- **Terminal approval** — `chat.tools.terminal.autoApprove`, e.g. `{ "rm": false }`. `false` requires approval; it does not block. Each subcommand is checked, but VS Code describes this as best-effort, not a security boundary.
- **Edit approval** — `chat.tools.edits.autoApprove`, e.g. `{ "**/.env": false }`.
- **Sandbox** (preview on macOS, Linux and WSL2; off by default) — `chat.agent.sandbox.enabled`, per-OS `chat.agent.sandbox.fileSystem.*` with `denyRead` and `denyWrite`, `chat.agent.sandbox.allowNetwork`, `chat.agent.allowedNetworkDomains`. OS-enforced, but terminal commands only. Check `allowUnsandboxedCommands`, which defaults to allowing a fallback.

**Verify:** the shield indicator in the permissions picker shows the sandbox state; auto-approved commands name the setting that approved them.

## GitHub Copilot CLI

**Settings:** `~/.copilot/` (settings, `mcp-config.json`, `permissions-config.json`), `.github/copilot/settings.json`, `.github/mcp.json`. Existing hooks in `.github/hooks/` and `~/.copilot/hooks/`.

- **Tool rules** — `--deny-tool 'shell(git push)'`, `--deny-tool 'read(.env)'`, `--deny-tool 'Server(tool)'`. These are per-session flags: there is no committed deny list, so a team rule can't be shared through the repo. Tell the developer the flag they can pass when starting a session, and report the finding as unenforced for Copilot CLI otherwise.
- **Sandbox** (preview, needs `--experimental`) — `sandbox.enabled`, `sandbox.userPolicy.network.allowedHosts` and `blockedHosts`, `sandbox.userPolicy.deniedPaths`. Outbound network is allowed by default.

**Verify:** `/sandbox status`, `/sandbox policy`, `copilot help permissions`.

## Cursor

**Settings:** `.cursor/` and `~/.cursor/` (`sandbox.json`, `cli.json` or `cli-config.json`, `mcp.json`). Run mode and the IDE command allowlist are set in the UI. Existing hooks in `hooks.json`; Cursor also loads Claude Code hooks.

- **Run mode** (IDE) — Auto-review, Allowlist or Run Everything.
- **Sandbox** — `sandbox.json`: `type` (`workspace_readwrite`, `workspace_readonly`), extra read or write paths, and `networkPolicy` with `default: "deny"` and allowed domains. OS-enforced on macOS and Linux.
- **CLI rules** — `permissions.allow` and `deny`, e.g. `Shell(rm)`, `Read(.env*)`, `Mcp(server:tool)`.
- **Files** — `.cursorignore` hides files from indexing and context, but not from the terminal or MCP tools.

**Verify:** inside a command, `echo $CURSOR_SANDBOX`; the Hooks tab for existing hooks.

## Gemini CLI and Antigravity CLI

- **Antigravity CLI** — `permissions.allow`, `ask` and `deny` in `~/.gemini/antigravity-cli/settings.json` (user level only), e.g. `command(git push)`, `read_file(.env)`, `mcp(server/tool)`. Sandbox via `enableTerminalSandbox: true`, with network off by default.
- **Gemini CLI** — policy files in `~/.gemini/policies/*.toml`. Project-level policies are currently not applied. Sandbox is opt-in (`-s` or `tools.sandbox`).

## Windsurf (Devin Desktop)

`windsurf.cascadeCommandsAllowList` and `cascadeCommandsDenyList`; a deny entry means "always ask", not block. Ignore files: `.codeiumignore`. No documented sandbox for Cascade. MCP tools are toggled per tool in the UI.

## Other harnesses

Look in the harness's documentation for: command or tool rules (and whether deny blocks or asks), a sandbox and what it covers, path-based file rules, MCP tool approval, where project and user settings live, and a status command. If you can't find a native control for a decision, report the finding as unenforced in that harness rather than building one.
