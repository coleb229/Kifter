#!/bin/bash
# Claude Code UserPromptSubmit hook
# Appends a timestamped record of each user prompt to prompt-history.txt

PROMPT=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    text = d.get('prompt', '')
    # Single line: collapse newlines, truncate at 1000 chars
    print(text.replace('\n', ' ').replace('\r', '')[:1000])
except Exception:
    print('')
" 2>/dev/null)

if [ -n "$PROMPT" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $PROMPT" >> /Users/coleb/dev/kifted/prompt-history.txt
fi
