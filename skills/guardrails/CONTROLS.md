# Native controls by harness

Last checked against each harness's documentation: 2026-10-16.

Where each harness keeps its safety settings, what its controls can do, and how to confirm they are active. These features change often and several are in preview: check the harness's current documentation before configuring anything, and trust its own status views over this file.

Across harnesses, watch for four things:

- **"Deny" doesn't always block.** In some harnesses a deny entry only requires approval.
- **A sandbox usually covers shell commands only.** Built-in file tools, MCP servers and web access may sit outside it.
- **A classifier is not a boundary.** Several harnesses now let a model approve actions (Claude Code's auto mode, Codex auto-review, VS Code Assisted permissions, Cursor Auto-review). Inventory it as a control that cuts prompts, not as protection; a hard guarantee needs a deny rule or a sandbox.
- **Hooks are for the inventory.** Note existing hooks and what they do. Don't write new ones: this skill configures native settings only.

## Claude Code

**Settings:** managed settings (organisation; `/Library/Application Support/ClaudeCode/managed-settings.json` on macOS, `/etc/claude-code/managed-settings.json` on Linux and WSL, `C:\Program Files\ClaudeCode\managed-settings.json` on Windows, or MDM), `~/.claude/settings.json` (user), `.claude/settings.json` (project, shared), `.claude/settings.local.json` (project, personal). MCP servers in `.mcp.json`, and user and local servers in `~/.claude.json`. A deny at any level beats an allow at any other.

- **Permission rules** — `permissions.deny`, `permissions.ask` and `permissions.allow`, evaluated deny → ask → allow. Commands: `Bash(git push *)`. Claude Code splits compound commands (`&&`, `||`, `;`, `|`, `&`, newlines), and deny and ask rules also match commands inside subshells, command substitutions and loop bodies, so `cd x && git push` still matches. Rules match command text, so `/bin/rm`, `bash -c '…'` or a script that runs the command internally gets past them.
- **Parameter rules** — deny and ask rules can match one top-level input of a built-in tool, e.g. `Agent(isolation:worktree)` or `Bash(run_in_background:true)`. They can't match a tool's main field (`command`, `file_path`, `url`).
- **Files** — `Read(./.env)` and `Edit(./migrations/**)` deny or ask rules cover the built-in file tools, file commands Claude Code recognises in Bash (`cat`, `head`, `sed`, `tee`) and redirection targets. They don't cover `grep -r`, or a Python or Node script that opens the file; the sandbox does. Use `Read` and `Edit` rules: `Write(...)` path rules are accepted but never checked. `permissions.blockReadsOutsideWorkingDirectories: true` denies file-tool reads outside the working directories in every mode; a repository can turn it on but not off.
- **Sandbox** — `sandbox.enabled`, off by default. OS-enforced for Bash, PowerShell and Monitor and their child processes (Seatbelt on macOS; bubblewrap and socat on Linux and WSL2). It doesn't limit the Read tool or WebFetch.
  - Filesystem: `sandbox.filesystem.denyRead`, `denyWrite`, `allowRead`, `allowWrite`. A deny holds inside a wider allow. `sandbox.filesystem.disabled: true` turns file isolation off but keeps network isolation; project settings can't set it.
  - Credentials: `sandbox.credentials.files` and `envVars` with `"mode": "deny"` or `"mask"` (mask keeps tools like `gh` working). There is no built-in deny list. Credential entries in project or local settings are not applied, so put them in user or managed settings.
  - Network: `sandbox.network.allowedDomains` and `deniedDomains`. `strictAllowlist: true` (user or managed settings only) denies instead of prompting.
  - `allowUnsandboxedCommands: false` removes the escape hatch that lets a failing command retry outside the sandbox. Set in user or managed settings, it holds even if the project sets `true`.
  - Project settings can't widen a managed sandbox once it is required (`allowUnsandboxedCommands: false` or `allowManagedDomainsOnly` in managed settings), but array keys merge, so without `allowManagedReadPathsOnly` or `allowManagedDomainsOnly` a developer's own settings can still add paths and domains.
- **MCP** — deny or ask rules on `mcp__<server>__<tool>`, or `mcp__<server>__*` for a whole server.
- **Modes** — auto mode is the default starting mode for interactive sessions in recent versions. Its classifier blocks actions that go beyond the request or look driven by hostile content, but the docs say it doesn't guarantee safety. Entering it drops broad allow rules such as `Bash(*)`. `defaultMode: "auto"` or `"bypassPermissions"` in project settings is ignored. `disableAutoMode: "disable"` and `permissions.disableBypassPermissionsMode: "disable"` stop those modes being used. `claude --restricted` removes the built-in tools that run commands or code, and WebFetch, keeps the file tools inside the working directories, refuses `bypassPermissions`, and ignores user, project and local settings files (managed settings and `--settings` still apply).
- **Published pages** — the `Artifact` tool uploads page content to claude.ai, where it stays private to the user until they share it, and new publishes don't prompt. If the repo holds code or data that must not leave the machine, inventory this as egress. Turn it off with `"enableArtifact": false` (any settings file can turn it off, none can turn it back on) or deny `Artifact` in `permissions.deny`. A bare `WebFetch` deny doesn't block it.

**Verify:** `/permissions` lists every rule and the file it came from, plus recent auto-mode denials. `/sandbox` shows the sandbox state and missing dependencies. `/status` lists which settings files loaded; `claude doctor` lists settings entries it rejected; `claude auto-mode config` prints the classifier rules. Then trigger a rule with a harmless matching command.

## OpenAI Codex (CLI, IDE extension and app)

**Settings:** `~/.codex/config.toml` (user), `.codex/config.toml` (project; loaded only for trusted projects, as are project hooks and rules), `/etc/codex/config.toml` (system). Admin constraints in `/etc/codex/requirements.toml`, cloud-managed settings or MDM. Command rules in `~/.codex/rules/` and `.codex/rules/`. Existing hooks in `hooks.json` at both levels or inline `[hooks]` in `config.toml`.

- **Approvals** — `approval_policy`: `on-request`, `never`, or `granular` with per-category switches. `untrusted` is retired and can stop Codex from starting, so report a config that still sets it as a finding; the replacement is `trust_level = "untrusted"` for the project in `~/.codex/config.toml`. `on-failure` is deprecated.
- **Auto-review** — `approvals_reviewer = "auto_review"` hands approval prompts to a reviewer agent, which denies critical-risk actions and fails closed. It changes who approves, not the sandbox.
- **Sandbox** — `sandbox_mode` (`read-only`, `workspace-write`, `danger-full-access`). OS-enforced. Network is off in `workspace-write` unless `[sandbox_workspace_write] network_access = true`.
- **Permission profiles** (beta) — `default_permissions = "<name>"` with `[permissions.<name>.filesystem]` globs set to `"read"`, `"write"` or `"deny"` (e.g. `"**/*.env" = "deny"`) and `[permissions.<name>.network.domains]` set to `"allow"` or `"deny"`. Domain rules need `features.network_proxy = true`. Profiles replace `sandbox_mode`: if `sandbox_mode` appears in any loaded config, Codex uses it and ignores the profile, so configure one or the other.
- **Command rules** (experimental) — Starlark `.rules` files with `prefix_rule(pattern=[...], decision="allow" | "prompt" | "forbidden")`. The most restrictive match wins.
- **Hooks** — stable and on by default. Non-managed hooks run only after the user reviews and trusts them with `/hooks`.
- **MCP** — `mcp_servers.<id>.enabled_tools` and `disabled_tools`, `default_tools_approval_mode` per server, and `approval_mode` per tool.

**Verify:** `/status`, `/permissions` and `/debug-config` in a session (`/debug-config` shows every config layer and requirement); `/hooks` for hook trust; `codex execpolicy check --rules <file> -- <command>` for a rule.

## GitHub Copilot in VS Code

**Settings:** `.vscode/settings.json` (project) and user `settings.json`; MCP in `.vscode/mcp.json`. Organisation policies can force many of these. Existing hooks in `.github/hooks/*.json` and `~/.copilot/hooks/`; Claude-format hooks in `.claude/settings*.json` load only when `chat.useClaudeHooks` is on (off by default). Red flags: `chat.tools.global.autoApprove` turned on, or the default permission level (`chat.permissions.default`) set to Allow all.

- **Permission level** — Manual (uses the approval settings below), Assisted (experimental: an LLM judge assesses each tool call), Allow all (no confirmations). Autopilot also auto-approves and answers the agent's questions itself. Managed settings can hide Assisted and Allow all.
- **Terminal approval** — `chat.tools.terminal.autoApprove`, e.g. `{ "rm": false }`, with `/regex/` keys allowed. `false` requires approval; it does not block. Every subcommand must match a `true` rule, and `false` wins.
- **Edit approval** — `chat.tools.edits.autoApprove`, e.g. `{ "**/.env": false }`.
- **Sandbox** (preview; off by default) — `chat.agent.sandbox.enabled: "on"`. Paths in `chat.agent.sandbox.fileSystem.userConfiguredPaths` with `readwritePaths`, `readonlyPaths` and `deniedPaths`. Network in `chat.agent.sandbox.network.allowNetwork` (default `true`), `allowedDomains` and `deniedDomains`. `chat.agent.sandbox.allowUnsandboxedCommands` defaults to `true`, which offers to run a failing command outside the sandbox. OS-enforced for terminal commands only; Linux and WSL2 need bubblewrap and socat, Windows is experimental.

**Verify:** the Permissions menu shows the level and the "Sandboxing for terminal" toggle; an auto-approved command shows a message linking to the setting that approved it.

## GitHub Copilot CLI

**Settings:** `~/.copilot/settings.json` (user), `mcp-config.json`, and `permissions-config.json` (saved approvals only; no deny rules). Repository settings in `.github/copilot/settings.json` and `settings.local.json` accept only a few keys, among them `deniedUrls`, `disabledMcpServers`, `disableAllHooks` and `hooks`; other keys are ignored. Existing hooks in `.github/hooks/`, `~/.copilot/hooks/` and `.claude/settings*.json`.

- **Tool rules** — `--deny-tool='shell(git push)'`, `--deny-tool=write`, `--deny-tool='MyServer(tool)'`. Deny beats allow, even with `--allow-all`. These are per-session flags, and the repository settings have no `permissions` key, so a team rule can't be shared through the repo. Tell the developer the flag they can pass when starting a session, and report the finding as unenforced for Copilot CLI otherwise. Managed settings have a `permissions` object (`deny`, `ask`, `allow`) for organisations.
- **Bypass** — `--allow-all`, `--yolo` and `/allow-all` approve everything. `permissions.disableBypassPermissionsMode: "disable"` (managed) suppresses them.
- **Sandbox** — `--sandbox` for one session, or `sandbox.enabled` in `~/.copilot/settings.json`. Filesystem and network rules are set through `/sandbox config`. Sandbox settings aren't read from repository settings.

**Verify:** `/sandbox status`, `/sandbox policy`, `copilot help permissions`, `copilot help sandbox`.

## Cursor

**Settings:** `.cursor/` and `~/.cursor/`: `permissions.json` (IDE), `cli.json` (project) or `cli-config.json` (user) for the CLI, `sandbox.json`, `mcp.json`. Team dashboard settings override `permissions.json`. Existing hooks in `hooks.json` at enterprise, team, project and user level; Cursor also loads Claude Code hooks from `.claude/settings*.json` unless "Include Third-Party Plugins, Skills, and Other Configs" is turned off.

- **Run mode** (IDE) — Auto-review, Allowlist or Run Everything. Auto-review sends calls that can't run in the sandbox to a classifier model; the docs say it is not a security boundary.
- **IDE allowlists** — `permissions.json`: `terminalAllowlist` (command prefixes) and `mcpAllowlist` (`server:tool`). `autoRun.allow_instructions` and `block_instructions` steer the classifier in plain language but don't enforce anything. There are no deny rules here.
- **CLI rules** — `permissions.allow` and `deny` in the CLI config, e.g. `Shell(rm)`, `Read(.env*)`, `Write(glob)`, `WebFetch(domain)`, `Mcp(server:tool)`. Deny beats allow. These apply to the CLI only.
- **Sandbox** — `sandbox.json` (the project file wins): `type` (`workspace_readwrite`, `workspace_readonly`, or `insecure_none`), `additionalReadwritePaths` and `additionalReadonlyPaths`, and `networkPolicy` with `default` (`"deny"` unless set), `allow` and `deny` lists. OS-enforced on macOS and on Linux 6.2+ with Landlock; elsewhere commands fall back to approval. `.cursor/**/*.json`, `.claude/**/*.json`, `.vscode/**` and `.git/hooks/**` stay write-protected.
- **Files** — `.cursorignore` hides files from Agent, Tab and @ mentions, but not from the terminal or MCP tools.

**Verify:** inside a command, `echo $CURSOR_SANDBOX`; the Hooks tab for existing hooks.

## Gemini CLI and Antigravity CLI

- **Gemini CLI** — policy files with `[[rule]]` blocks and `decision = "allow" | "deny" | "ask_user"`, e.g. `toolName = "run_shell_command"`, `commandPrefix = "git push"`. User policies in `~/.gemini/policies/*.toml`; admin policies in `/etc/gemini-cli/policies` (Linux) or `/Library/Application Support/GeminiCli/policies` (macOS). The workspace tier (`.gemini/policies/`) is currently non-functional, so a team rule can't be committed: report it as unenforced unless each developer adds a user policy. Sandbox is off unless enabled with `-s`, `GEMINI_SANDBOX` or `tools.sandbox`; on macOS the default Seatbelt profile, `permissive-open`, leaves network open. Verify with `/policies list`.
- **Antigravity CLI** — `~/.gemini/antigravity-cli/settings.json` (user level). `toolPermission` (`request-review` by default, `proceed-in-sandbox`, `strict`, `always-proceed`), permission rules such as `command(sudo *)` in a deny list, and `enableTerminalSandbox: true` (off by default; Linux and macOS).

## Pi

Pi has no approvals and no sandbox by default: it reads, changes and runs files with the permissions of the account that started it. Its docs name a container, VM or sandbox as the strongest option. The repo ships example extensions (`permission-gate`, `protected-paths`, and a `sandbox` extension configured in `.pi/sandbox.json`), but they are examples to install, not built-in controls. Report every finding as unenforced in Pi unless it runs inside a container or VM, and note that installing an extension is the developer's call. Settings live in `~/.pi/agent/settings.json` and `.pi/settings.json`; project settings load only after the project is trusted.

## Windsurf (Devin Desktop)

Terminal auto-execution levels: Disabled, Allowlist Only, Auto, Turbo. A deny-list entry means "always ask", not block, and Turbo runs everything else. The lists are managed from the terminal command cards and the team settings. No documented sandbox.

## Other harnesses

Look in the harness's documentation for: command or tool rules (and whether deny blocks or asks), a sandbox and what it covers, path-based file rules, MCP tool approval, any model that approves actions on the user's behalf, where project and user settings live, and a status command. If you can't find a native control for a decision, report the finding as unenforced in that harness rather than building one.
