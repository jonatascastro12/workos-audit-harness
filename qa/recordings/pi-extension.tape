Output qa/recordings/pi-extension.gif

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
Sleep 400ms
Type "clear"
Enter
Show

# 1. Load the pi-extension into pi-coding-agent (non-interactive print mode)
Type `pi --no-tools -e "$(pwd)/packages/pi-extension/index.ts" -p "say only OK" --provider anthropic --model haiku`
Enter
Sleep 15s

Type "clear"
Enter

# 2. Query audit log for the pi.session.started event the extension emitted
Type "sleep 14 && ./packages/audit-core/bin/workos-audit-harness-darwin-arm64 query --file /tmp/qa-pi-query.json --org $WORKOS_ORGANIZATION_ID"
Enter
Sleep 25s
