#!/usr/bin/env bash
# Regenerates every audition clip from lines.json, one engine at a time, so each speed measurement
# has the CPU to itself. Clips already made for the current text are skipped. Takes about 40 minutes.
# This runs all 7 models, so it needs a venv for each: see README.md for the 3 that setup.sh builds.
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"; cd "$LAB/engines"
step() { name=$1; shift; echo "== $name start $(date +%H:%M)"; "$@" > "../out/$name.log" 2>&1; echo "== $name exit=$? $(date +%H:%M)"; }

step supertonic_r1 ../venvs/supertonic/Scripts/python.exe supertonic_engine.py r1 F1,F2,F3,F4,F5,M1,M2,M3,M4,M5
step supertonic_r2 ../venvs/supertonic/Scripts/python.exe supertonic_engine.py r2 F1,F2,F4,M1,M4
step pocket ../venvs/pocket/Scripts/python.exe pocket_engine.py r1,r2
step kokoro ../venvs/kokoro/Scripts/python.exe kokoro_engine.py r1
step kokoro_de ../venvs/kokoro/Scripts/python.exe kokoro_de_onnx.py r1
step chatterbox ../venvs/chatterbox/Scripts/python.exe chatterbox_engine.py r1
step voxcpm ../venvs/voxcpm/Scripts/python.exe voxcpm_engine.py r1
step qwen_r1 ../venvs/qwen/Scripts/python.exe qwen.py r1 ryan,aiden,serena,vivian
step qwen_r2 ../venvs/qwen/Scripts/python.exe qwen.py r2 ryan,vivian,aiden
echo "== ALL DONE"
