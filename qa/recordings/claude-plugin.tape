Output qa/recordings/claude-plugin.gif

Set Shell "bash"
Set FontSize 13
Set Width 1280
Set Height 760
Set Padding 16
Set TypingSpeed 18ms
Set Theme "Dracula"

Hide
Type "source qa/recordings/_setup.sh"
Enter
Sleep 800ms
Type "clear"
Enter
Show

# 1. MCP status — server boots, lists tools, reports config
Type "node qa/recordings/probe.mjs packages/claude-plugin/server/index.mjs status"
Enter
Sleep 5s

Type "clear"
Enter

# 2. Emit a session-started hook event (recording ON, default)
Type "qa/recordings/emit.sh claude session-started qa-claude-demo"
Enter
Sleep 4s

# 3. Recording-off short-circuit — same payload, no event sent
Type "CLAUDE_WORKOS_AUDIT_RECORDING=0 qa/recordings/emit.sh claude session-started qa-claude-demo-off"
Enter
Sleep 3s

Type "clear"
Enter

# 4. Wait for indexing then query the audit log via MCP
Type "sleep 14 && node qa/recordings/probe.mjs packages/claude-plugin/server/index.mjs query"
Enter
Sleep 20s
