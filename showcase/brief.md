# Brief: Wordcue showcase films

Examples for the public site.

## Audience and purpose
- **Audience:** people who make explainers or pitches and are curious about making films locally with Claude Code.
- **Purpose:** show what Wordcue does and that it has no house style.
- **Takeaway:** narration timing drives the picture, and each project can look completely different.

## Films
| Folder | Language, voice | Length | Look |
|---|---|---|---|
| `sentence` | English, Supertonic F2 | about 35 s | Heavy black type on yellow, hard cuts on words |
| `lens-plate` | English, Supertonic M1 | about 20 s | 19th-century engineering plate, lines drawn slowly |
| `lens-beam` | English, Supertonic M1 | about 20 s | Black, with type revealed only where a searchlight passes |
| `lens-paper` | English, Supertonic M1 | about 20 s | Bright cut paper with bouncy pops |
| `bridge` | German, Supertonic M1 | about 20 s | Vertical, magenta and black poster |

## Allowed facts

**`sentence`, from this repo:**
- Voices run on the user's own computer. Each line gets several takes.
- Speech recognition checks each take, and the closest match to the script wins. Below the match threshold, the build stops.
- Word times drive the visuals. Changing a line regenerates only that line, and later visuals move with it.
- One page renders frame by frame to an MP4, and the same source gives an interactive player.
- Every project gets a new look.

**`lens-*`, from [Wikipedia: Fresnel lens](https://en.wikipedia.org/wiki/Fresnel_lens):**
- Lit on 25 July 1823 at Cordouan Lighthouse, "the world's first lighthouse Fresnel lens".
- "The light was visible to the horizon, more than 32 kilometres (20 mi) out."
- The lens is divided into concentric annular sections, each thinner than an equivalent simple lens.
- Its outer elements in 1823 were mirrors, and prisms came around 1825. So the film says "rings of glass", not "prisms".
- A flame shining in every direction wasting most of its light is common physics. "Most" is not a measured figure.

**`bridge`, from [Wikipedia: Thermal expansion](https://en.wikipedia.org/wiki/Thermal_expansion) and [Expansion joint](https://en.wikipedia.org/wiki/Expansion_joint):**
- Steel's linear coefficient is 11 to 13 × 10⁻⁶ per kelvin, and ΔL = L × α × ΔT.
- At 12 × 10⁻⁶: 100 m × 30 K × 12 × 10⁻⁶ = 36 mm. This is my calculation, so it's said as "rund dreieinhalb Zentimeter" and labelled on screen.
- Joints absorb thermal expansion and stop a bridge "bending out of place".
- The growth shown on screen is exaggerated, and must be labelled.
- "Klack-Klack" is ordinary experience of driving over a joint, not sourced.

## Honesty rule
Supertonic's licence bars publishing machine-generated content without disclosing it. Every film says on screen that the voice is AI, and `sentence` also says it aloud.
