# Guardrails — block dangerous commands (PowerShell hook for native Windows).
#
# Registered as a PreToolUse hook on the Bash tool. Reads the tool call JSON on
# stdin; on a deny-list match it writes a reason to stderr and exits 2 — which
# BLOCKS the call and feeds the reason back to the agent. Otherwise exits 0.
# Native JSON parsing, no external dependencies (no jq).
#
# Tailor $DangerousPatterns to THIS project's risk surface (run /guardrails).
# Patterns are case-insensitive .NET regex.

$raw = [Console]::In.ReadToEnd()
try { $command = ($raw | ConvertFrom-Json).tool_input.command } catch { exit 0 }
if (-not $command) { exit 0 }

$DangerousPatterns = @(
  # --- Destructive git (always on) ---
  'git push'
  'git reset --hard'
  'git clean -fd'
  'git clean -f'
  'git branch -D'
  'git checkout \.'
  'git restore \.'
  'push --force'
  'reset --hard'

  # --- Project-specific: add per the /guardrails assessment ---
  # 'terraform (apply|destroy)'
  # 'kubectl delete'
  # 'drop (table|database)'
  # 'truncate '
  # 'psql .*(prod|production)'
  # 'aws .*(delete|terminate|rm)'
  # 'rm -rf'
  # '(cat|echo|print).*\.env'
)

foreach ($pattern in $DangerousPatterns) {
  if ($command -imatch $pattern) {
    [Console]::Error.WriteLine("BLOCKED by /guardrails: '$command' matches guarded pattern '$pattern'. You do not have authority to run this. Surface it to the user and get explicit approval; if approved, the user runs it or adjusts the guardrail.")
    exit 2
  }
}

exit 0
