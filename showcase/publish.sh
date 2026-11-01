#!/usr/bin/env bash
# Copies the rendered example films into the site. Run after rendering and packing each film.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
# Film folder, and the moment used for its poster image.
while read -r film poster; do
  to="../docs/films/$film"
  mkdir -p "$to"
  cp "$film/build/film.mp4" "$to/film.mp4"
  cp "$film/build/film-standalone.html" "$to/film.html"
  ffmpeg -v error -y -ss "$poster" -i "$film/build/film.mp4" -frames:v 1 -vf "scale=960:-1" -q:v 3 "$to/poster.jpg"
  echo "$film: $(du -sh "$to" | cut -f1)"
done <<'EOF'
sentence 2.6
lens-plate 12.5
lens-beam 8.5
lens-paper 16
bridge 7.5
EOF
