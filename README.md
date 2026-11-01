# Wordcue

Make narrated explainer videos on your own computer, with local AI voices. You describe what you want, and [Claude Code](https://claude.com/claude-code) directs the work and hands you finished files.

Visuals are cued by the spoken words, so when you change a sentence, the animation moves with it. One source produces both an MP4 and an interactive HTML player.

**There's no house style.** Every project gets a new look, length, motion and structure. What carries over is the method, the voices and the technical fixes.

**[See the site](https://aminechr54.github.io/wordcue/)** · **[Try the voices](https://aminechr54.github.io/wordcue/voices/)** · **[Build your prompt](https://aminechr54.github.io/wordcue/prompt/)**

Windows only for now.

## Make a video

A good prompt makes the biggest difference. The **[prompt helper](https://aminechr54.github.io/wordcue/prompt/)** walks you through story, look, motion and voice with examples you can see and hear, then writes the prompt. Press **Ask me about this** on anything you're unsure of, and the agent will ask you about it with recommendations.

Or start Claude Code and describe the video yourself, or type `/presentation-director` first. Include what you know and skip the rest:

> Make a 2-minute English explainer about our booking tool for new customers. Source: `notes.md`. Use the voice F1 in English.

| | Who | What happens |
|---|---|---|
| 1. Brief | You and Claude | You describe the video. Claude writes down the audience, the takeaway and the allowed facts, and states any assumptions |
| 2. Story | Claude | Writes the script. If the angle is unclear, rival outlines compete |
| 3. Look | Claude | Designs a new look, clearly different from your earlier projects, usually with rival directions |
| 4. Voice | Automatic | Records each line, picks the take closest to the script, and stops if none matches |
| 5. Build | Claude | Builds the animation, with its timing tied to the spoken words |
| 6. Review | Claude and an independent reviewer | Checks the facts and rendered frames, for up to 2 rounds, and fixes what they find |
| 7. Render | Automatic | Produces the MP4 and an interactive HTML from the same source, and checks them |
| 8. Your turn | You | Watch and listen. Claude can't hear audio, so only you can judge the sound |

The result lands in `films/<name>/build/`, as `film.mp4` and `film-standalone.html`.

**Changing it afterwards:** ask for the change, such as "shorten the second sentence". Only changed lines are re-recorded, and the visuals move with them.

**How long it takes:** a film of about a minute renders in a few minutes on a 12-core laptop with no NVIDIA GPU. Voice speed varies a lot, as the voice page shows. Rival stories and looks cost about 10 minutes and 100,000 tokens each.

Claude makes decisions rather than repeatedly asking you to choose. To overrule one, just say so.

## What it covers

| Type | Output | Tested so far |
|---|---|---|
| Narrated explainer, YouTube video, product film | MP4 and HTML | **Used for real**, up to about a minute and a half |
| Vertical Short | MP4 and HTML | One 19-second example, not yet in real use |
| Pitch for a hackathon or investors | HTML, with an MP4 backup | Not yet run |
| Live demo you present by keypress | HTML | Not yet run |
| Technical system explorer | Interactive page, not a video | Not yet run |

Expect to find problems the first time you use an untested type, or a video longer than about a minute and a half.

**Everything on screen is animation built in HTML.** Wordcue can't do these today:
- Real camera footage or screen recordings
- Background music or sound effects
- Talking heads, avatars or photo-real AI video

## Voices

**Hear them:** open [`docs/voices/index.html`](docs/voices/index.html), or the [online version](https://aminechr54.github.io/wordcue/voices/). It lists every voice tested, with the author's ratings, speed and licence.

**Use one:** press **Copy** on the page and paste the sentence into your request, or just say "use F2 in German". With no voice named, the film uses the one marked Default.

**Licences matter.** All samples are AI-generated, and these are summaries rather than legal advice:

| Model | Licence | Note |
|---|---|---|
| Supertonic 3 | OpenRAIL-M | You must disclose that the voice is AI, and impersonation is banned. The repo is reported archived |
| Qwen3-TTS | Apache 2.0 | 5-9x slower than real time on a laptop CPU |
| Pocket TTS | CC-BY-4.0 | Accept its terms on [Hugging Face](https://huggingface.co/kyutai/pocket-tts) first. Credit Kyutai. Don't use it for impersonation |
| Pocket voice Alba | CC BY 4.0 | Credit Alba McKenna and Kyutai |
| Pocket voice Jean | CC BY-NC 4.0 | **Non-commercial only** |
| Kokoro-82M, Thorsten | Apache 2.0 | Tested, not connected to films yet |
| Chatterbox | MIT | Tested, not connected to films yet |
| VoxCPM2 | Apache 2.0 | Tested, not connected to films yet |

Model weights aren't in this repo. They download from their owners on first use.

**Change the list:** edit `CATALOG` in `voice-lab/build_voices.py`, then run it.

## What's in here

| Path | What it is |
|---|---|
| `claude/` | The `presentation-director` skill and its 3 agents, for Claude Code |
| `engine/` | The film engine. Its [README](engine/README.md) has commands and the step format |
| `docs/` | The public site, voice library and samples |
| `voice-lab/` | Scripts behind the voice tests and library |
| `showcase/` | Source of the example films on the site |
| `requirements/` | Exact Python package versions |
| `films/` | Your own projects. Ignored by git, so they stay private |

## Set up

You need Windows, Git Bash, [uv](https://docs.astral.sh/uv/), ffmpeg, Node.js, Microsoft Edge and Claude Code.

```bash
bash setup.sh                # Python environments and Node packages
bash claude/sync.sh install  # skill and agents, into your Claude Code config
cp used-looks.example.md used-looks.md
```

- Set `CLAUDE_CONFIG_DIR` first if your Claude Code config folder isn't `~/.claude`.
- `setup.sh` builds the three connected voice engines. Downloads stay inside this folder.
- `voice-lab/generate_all.sh` regenerates every test clip, and also needs environments for the other models.

After changing the skill or agents in your config folder, run `bash claude/sync.sh` to copy them back here.

## Licence

The code is [MIT](LICENSE). Voice samples and models keep their own terms, listed above.
