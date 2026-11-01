# Film engine

One page gives an interactive HTML player and an MP4, from the same steps. Narration timing drives the visuals, so changing a line moves everything after it.

## Commands

Run from this folder in Git Bash, after `source ../voice-lab/env.sh`.

| Goal | Command |
|---|---|
| Record narration, write `build/timing.js` | `.venv/Scripts/python.exe voice.py <dir>` |
| Stills for review | `node render.mjs <dir>/film.html --stills 3,12.5` |
| Same frame twice, compare | `node render.mjs <dir>/film.html --hash 12.5` |
| MP4 and contact sheet | `node render.mjs <dir>/film.html` |
| One-file HTML | `node pack.mjs <dir>/film.html` |

Start a new film by copying `examples/smoke` (landscape) or `examples/short` (vertical) for the wiring. Their look is only a placeholder, so replace all of it. Fix the relative script paths if the folder depth differs.

The engine has no style. Look, motion, eases, timing and stage size all belong to the film. `geometry.js` only measures, and `examples/geometry` shows it in use. Don't add reusable animations here, because they would make every film feel the same.

## script.json

```json
{ "voice": { "engine": "supertonic3", "voice": "F2", "lang": "de", "speed": 1.0, "takes": 3 },
  "gap": 0.35,
  "lines": [ { "id": "h1", "text": "Um 06:10.", "say": "Um sechs Uhr zehn.", "gap": 1.5, "stop": true } ] }
```

- `text` is what the presenter window shows. `say` is what gets spoken: write numbers as words and respell loanwords here.
- `gap` is the silence after a line. `stop` makes the live player wait for a keypress.
- `voice.py` blocks when no take matches the script (below 0.82). Listen, respell, or pass `--allow-low`.
- `supertonic3`, `qwen` and `pocket` have adapters. Qwen and Pocket have no speed control, and `juergen-24l` selects Pocket's larger German model. Add others in `tts/` and `ADAPTERS`, and mark them connected in `voice-lab/build_voices.py`.

## Steps

`Film.create({ stage, world, timing, steps, cursor, width, height })`. Every step has an `at`:

| Anchor | Means |
|---|---|
| `12.5` | absolute seconds |
| `n3`, `n3.end` | start or end of a line |
| `n3:Wort`, `n3:Wort#2`, `n3:Wort.end` | a spoken word in `say`, matched by prefix |
| `n3:Wort-0.1`, `n3.end+0.4` | any of those with an offset |
| `+0.4` | relative to the previous step |

An anchor whose word has left the line stops the render and names it.

| Step | Fields |
|---|---|
| Animation | `anim` selector, `kf`, `dur`, `ease`, `stagger` |
| State | `set` selector, then `cls` with optional `on: false`, or `text` |
| Typewriter | `type` selector, `text`, `dur` |
| Counter | `count` selector, `from`, `to`, `dur`, `fmt` |
| Camera | `camera: true`, then `focus` selector or `x`, `y`, plus `zoom`, `dur` |
| Cursor | `cursor` selector, `click`, `dur`. It arrives at `at`, so a click lands on the word. Hide it with `cursorOff: true` |
| Custom | `fn(progress, elapsed)`, `dur`. Must depend only on its arguments |

Eases: `move`, `out`, `in`, `linear`, or any CSS easing such as `steps(21,end)`.

## Technical rules learned the hard way

These are about what breaks, not how a film should look.

- **If you use one large canvas**, clamp the camera to each region with `Geometry.camera`, so a zoom never shows the next scene.
- **Animate inside the world.** Steps can't target the stage element itself, so put a full-size background on `#world`.
- **A full-film `fn` step** must use `dur: TIMING.duration`, because a longer `dur` stretches the film.
- **Author in time order.** The first animation of a property holds its start value, and later ones wait for their time.
- **No CSS transitions or CSS animations on the stage.** The renderer refuses them. Never use `will-change` on the camera layer: it served stale, blurry text after a zoom and made frames differ.
- **Text over lines:** anything readable goes in a layer above threads and rules, or it reads as crossed out.
- **Fonts:** `pack.mjs` embeds fonts loaded with `@font-face` from local `.woff2` files. Installed fonts aren't embedded, so the one-file HTML falls back on a machine without them. The MP4 is safe either way.
- **Speech speed varies.** One film ran at about 155 words per minute including gaps, not the planned 138, and short test lines ran near 190. Check `voice.py`'s last line before planning the edit.
