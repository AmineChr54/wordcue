---
name: presentation-director
description: Directs a presentation, explainer, pitch, demo, YouTube video or Short from brief to finished output, using local voices and the film engine in {{KIT}}. Use when the user asks to make, remake or improve a presentation, pitch, demo video, explainer, narrated walkthrough, technical explorer or short.
---

# Presentation director

You own the vision and assemble everything yourself. Agents do bounded jobs: rival options and independent review. Don't split writing or building by slide, because that gives a patchwork.

**There's no house style. Every project gets fresh creative work.**

| New for every project | Carries over |
|---|---|
| Look, type and colour | The process in this skill |
| Motion and camera language | Facts traced to source, honest labels |
| Length, format and pacing | Narration timing that drives the visuals |
| Story structure | Self-check, independent review, render checks |

Earlier films are not templates. Don't open an earlier film's source while designing, because it will anchor you. Afterwards you may read one to see how a technical problem was solved. Numbers from earlier projects are starting points, not rules.

## 1. Brief

Write `brief.md` in the project folder: audience, purpose, the one takeaway, allowed facts, known inconsistencies, and the medium.

- Facts come from the user's material only. Note anything that is an estimate.
- Audience and purpose decide everything else, so state your assumption if it's missing and continue.
- Client work stays local: no publishing, and no client names, branding or figures in `engine/`, this skill or the agents.

## 2. Pick the recipe

Read one file from `recipes/`. It sets which stages run, the pacing and the output. Mix when the job needs it, such as a pitch with a live demo inside.

| Situation | Recipe |
|---|---|
| A person presents a product live, by keypress | `live-demo` |
| Someone explores an architecture or system alone | `tech-explorer` |
| Win a room in a few minutes (hackathon, investors) | `pitch` |
| Narrated film with no presenter | `video-explainer` |
| Vertical, under about 60 seconds | `short` |

## 3. Don't wear the user out

Deciding is part of the job, and long rounds of picking wear people out. So:

- Make the decision yourself and state it, with the reason in a line. They can overrule you.
- Combine choices into one question, at most once per project, and only when options really differ and you can't tell which fits.
- Show finished things, not option lists. Don't ask for ratings.
- Use what you know about their preferences first.

**A prompt from the prompt helper** can have an `## Ask me about` section. The person asked to be consulted on those topics, so this overrides the limits above. Before writing `brief.md`, ask about all those topics together in one step, with 2-3 recommendations each and your top pick marked. Describe the options in words, and offer that a one-word reply takes every top pick. If the look is on the list, this replaces art-director rivals unless the person asks to see drawn options. Decide everything under `## Decide yourself` without asking, then say what you chose and why. Treat look and motion named in `## Brief` as direction for something new, not a template to copy.

## 4. Rivals, when variety is worth it

Each rival costs about 100,000 tokens and 10 minutes, so use them only where a fresh start helps. Run them in parallel with no shared reasoning.

- **`story-architect`:** 2-3 rivals when the angle is unclear. Skip it if the user already has the story.
- **`art-director`:** 2-3 rivals by default, because every project needs a new look. Give each a different seed from this project's own world, not a generic mood. Skip rivals when a brand or an existing deck sets the look, or when one direction is clearly right. It must still be new.

Read `{{KIT}}\used-looks.md` first, creating it from `used-looks.example.md` if it's missing. Seeds, looks, motion and structure must differ clearly from what's listed there, and that list goes to each rival. A brand, or a series the user names, is the only reason to repeat one.

Pick one, unless section 3 says to ask. Take what's useful from the others.

## 5. Script and build, yourself

- Write spoken language. Keep `text` and `say` apart: numbers as words and respelled loanwords go in `say`.
- Follow `references/pacing.md`. Where its starting points or a recipe resemble an entry in `used-looks.md`, the list wins.
- Check the look and copy against `references/anti-tells.md`, especially when no art-director ran.
- A public film must disclose an AI voice. Put it on screen, and suggest wording for the video description.
- Build as `engine/README.md` describes, in `{{KIT}}\films\<name>\`. Copy `engine/examples/smoke` or `engine/examples/short` for the wiring only, and replace all of their styling.
- Invent the motion for this project. It shows what happens and comes from the chosen look's world. Use any stage size, region layout, ease or timing. Where narration and visuals meet, use word anchors.

**Voice:** when the user names a voice, such as "F2 in German" or "Vivian", find it in `{{KIT}}\docs\voices\voices.js` and copy its `engine`, `voice` and `lang` into `script.json`. A name can exist in both languages, so ask only if the language isn't clear from the project. With no voice named, use the entry marked `default` for the film's language. Choose another when the project suits it, and state why. Only entries with `connected: true` work in films. The user can hear all of them at `docs/voices/index.html`.

Licences differ. Each entry in `voices.js` has its own. Supertonic's requires disclosing machine-generated content and bans impersonation without consent, and its repo is reported archived, so tell the user to have this checked before client or monetised use. Qwen is Apache 2.0 and 5-9x slower than real time, so use fewer takes for long scripts. Pocket TTS is CC-BY-4.0, needs a credit, and its voices vary. **Never use Pocket's `jean` commercially, because it comes from a non-commercial dataset.** Neither Qwen nor Pocket has a speed control.

## 6. Review with `critic-and-factcheck`, then render

Do your own pass first: stills across the film, read as a contact sheet, against `references/self-check.md`.

1. Render, extract one frame per second to `build/review/`, and send the reviewer the brief, script, timing, frames and source material. Share none of your reasoning.
2. Fix everything verified, then send one more round for what's still wrong or newly broken. Stop after 2 rounds.
3. Facts the reviewer can't settle go to the user in the final message.

Before handing over, run the checks: `--hash` at a few moments, `ffprobe`, loudness around -16 LUFS, and the player's keyboard. Report what passed and what you didn't check. You can't hear the audio, so say so: Whisper only confirms the words, not how they sound.

## 7. Hand over

Give the paths to the MP4 and HTML, the decisions you made, and any open facts. Then keep what the project taught:

- **The look:** add a row to `{{KIT}}\used-looks.md`, and keep everything else about the look with the project.
- **Faults and fixes:** a mistake that could recur in any style goes in `references/self-check.md`. A technical trap goes in `engine/README.md`.
- **The recipe:** update its status line after real use, and fix any step in this skill that failed.
- **Client material:** none of it goes in the skill, the agents or `engine/`.
- **Saving:** if the skill or agents changed, run `bash claude/sync.sh` in the kit so the repo has a copy. Commit only when the user asks.
