#!/bin/bash
# Guardrails — block dangerous commands before the agent runs them.
#
# Registered as a PreToolUse hook on the Bash tool. It reads the tool call on
# stdin, extracts the command, and matches it against DANGEROUS_PATTERNS.
# On a match it prints a reason to stderr and exits 2 — which BLOCKS the call
# and feeds the reason back to the agent.
#
# Tailor DANGEROUS_PATTERNS to THIS project's risk surface (run /guardrails).
# Patterns are case-insensitive extended regex (grep -iE).

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

DANGEROUS_PATTERNS=(
  # --- Destructive git (always on) ---
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"

  # --- Project-specific: uncomment / add per the /guardrails assessment ---
  # "terraform (apply|destroy)"      # infra changes
  # "kubectl delete"                 # cluster mutations
  # "drop (table|database)"          # destructive SQL
  # "truncate "                      # destructive SQL
  # "psql .*(prod|production)"       # production DB access
  # "aws .*(delete|terminate|rm)"    # destructive cloud ops
  # "rm -rf"                         # destructive filesystem
  # "(cat|echo|print).*\.env"        # printing secrets
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qiE "$pattern"; then
    echo "BLOCKED by /guardrails: '$COMMAND' matches guarded pattern '$pattern'. You do not have authority to run this. Surface it to the user and get explicit approval; if approved, the user runs it or adjusts the guardrail." >&2
    exit 2
  fi
done

exit 0
