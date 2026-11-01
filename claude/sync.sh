#!/usr/bin/env bash
# Claude Code reads the skill and agents from its config folder. This repo keeps a copy with
# placeholders instead of machine paths: {{KIT}} is this folder, {{CONFIG}} is the config folder.
#   bash claude/sync.sh install   copies repo -> config folder, filling in the paths
#   bash claude/sync.sh           copies config folder -> repo, restoring the placeholders
# The config folder defaults to ~/.claude. Set CLAUDE_CONFIG_DIR to use another.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIVE="$(cygpath -u "${CLAUDE_CONFIG_DIR:-$HOME/.claude}")"
AGENTS="story-architect art-director critic-and-factcheck"
KIT_WIN="$(cygpath -w "$(dirname "$HERE")")"
CONFIG_WIN="$(cygpath -w "$LIVE")"
escape() { printf '%s' "$1" | sed 's/[\\&|]/\\&/g'; }

if [ "${1:-}" = "install" ]; then
  FROM="$HERE"; TO="$LIVE"
  EDIT="s|{{KIT}}|$(escape "$KIT_WIN")|g; s|{{CONFIG}}|$(escape "$CONFIG_WIN")|g"
else
  FROM="$LIVE"; TO="$HERE"
  EDIT="s|$(escape "$KIT_WIN")|{{KIT}}|g; s|$(escape "$CONFIG_WIN")|{{CONFIG}}|g"
fi

mkdir -p "$TO/skills" "$TO/agents"
rm -rf "$TO/skills/presentation-director"
cp -r "$FROM/skills/presentation-director" "$TO/skills/"
for agent in $AGENTS; do cp "$FROM/agents/$agent.md" "$TO/agents/"; done
find "$TO/skills/presentation-director" -name '*.md' -exec sed -i "$EDIT" {} +
for agent in $AGENTS; do sed -i "$EDIT" "$TO/agents/$agent.md"; done
echo "Copied skill and agents: $FROM -> $TO"
