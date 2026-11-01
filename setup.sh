#!/usr/bin/env bash
# Rebuilds what git doesn't keep: Python environments and Node packages. Models download on first use.
# Safe to rerun, because it skips what exists. Run in Git Bash from this folder: bash setup.sh
# Needs uv, ffmpeg, Node.js and Microsoft Edge. Pocket TTS also needs its terms accepted on Hugging Face.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source voice-lab/env.sh

for tool in uv ffmpeg ffprobe node npm; do
  command -v "$tool" >/dev/null || { echo "Missing: $tool. With Scoop: scoop install ffmpeg-essentials uv nodejs" >&2; exit 1; }
done

CPU=https://download.pytorch.org/whl/cpu
env_from() { # folder, requirements file
  if [ -x "$1/Scripts/python.exe" ]; then echo "exists: $1"; return; fi
  uv venv -q --python 3.12 "$1"
  uv pip install -q --python "$1/Scripts/python.exe" -r "$2" --extra-index-url "$CPU" --index-strategy unsafe-best-match
  echo "built: $1"
}

env_from engine/.venv requirements/engine.txt
env_from voice-lab/venvs/supertonic requirements/supertonic.txt
env_from voice-lab/venvs/pocket requirements/pocket.txt
env_from voice-lab/venvs/qwen requirements/qwen.txt

[ -d engine/node_modules/playwright-core ] && echo "exists: engine/node_modules" || (cd engine && npm ci)
echo "Done. To install the skill and agents: bash claude/sync.sh install"
