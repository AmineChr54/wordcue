"""Builds the voice library in docs/voices/: small audio samples and voices.js, which the page reads.

Only clips made from the current lines.json are used, so changing the text can't leave old audio behind.
To change the list, edit CATALOG and rerun. Usage: python build_voices.py
"""
import hashlib
import json
import pathlib
import shutil
import subprocess

from build_audition import RAW, normalise

LAB = pathlib.Path(__file__).resolve().parent
OUT = LAB.parent / "docs" / "voices"
SAMPLES = OUT / "samples"

SUPERTONIC = "OpenRAIL-M. Disclose that the voice is AI. Impersonation is banned."
POCKET = "CC-BY-4.0. Credit Kyutai."
# Clip folder name, display name, licence, and whether engine/voice.py can use it in a film.
ENGINES = {
    "supertonic3": ("supertonic3", "Supertonic 3", SUPERTONIC, True),
    "qwen": ("qwen06", "Qwen3-TTS", "Apache 2.0", True),
    "pocket": ("pocket", "Pocket TTS", POCKET, True),
    "kokoro": ("kokoro", "Kokoro-82M", "Apache 2.0", False),
    "kokoro-de": ("kokoro-de", "Kokoro German (Thorsten)", "Apache 2.0, CC0 dataset", False),
    "chatterbox": ("chatterbox", "Chatterbox", "MIT", False),
    "voxcpm2": ("voxcpm2", "VoxCPM2", "Apache 2.0", False),
}
# (languages, engine, voice, name shown, licence override)
CATALOG = [
    *[("de en", "supertonic3", v, v, None) for v in ("F1", "F2", "F3", "F4", "F5", "M1", "M2", "M3", "M4", "M5")],
    *[("de en", "qwen", v, v.title(), None) for v in ("vivian", "ryan", "aiden", "serena")],
    ("de", "pocket", "juergen", "Juergen", None),
    ("de", "pocket", "juergen-24l", "Juergen (larger model)", None),
    ("en", "pocket", "alba", "Alba", "CC BY 4.0. Credit Alba McKenna and Kyutai."),
    ("en", "pocket", "jean", "Jean", "Non-commercial only (EARS dataset, CC BY-NC 4.0)."),
    *[("en", "kokoro", v, n, None) for v, n in (("af_heart", "Heart"), ("af_bella", "Bella"), ("am_michael", "Michael"), ("bm_george", "George"))],
    ("de", "kokoro-de", "thorsten", "Thorsten", None),
    ("de en", "chatterbox", "default", "Chatterbox default", None),
    ("de en", "voxcpm2", "warm-f", "Warm female (designed)", None),
    ("de en", "voxcpm2", "warm-m", "Warm male (designed)", None),
]
DEFAULTS = {("de", "F2"), ("en", "F2")}


def load_text():
    lines = json.loads((LAB / "lines.json").read_text(encoding="utf-8"))["lines"]
    return {(l["lang"], l["id"]): l["text"] for l in lines}


def load_ratings():
    stars = {}
    for row in json.loads((LAB / "ratings.json").read_text(encoding="utf-8")):
        stars[row["lang"], row["round"], row["key"]] = row["stars"]
    return stars


def load_speeds():
    seen = {}
    for row in (LAB / "out" / "metrics.jsonl").read_text(encoding="utf-8").splitlines():
        r = json.loads(row)
        seen[r["file"]] = r["slower_than_realtime"]
    return seen


def clip_for(clip_engine, voice, lang, line_id, text):
    """The clip for this exact text, using the same hash as engines/labkit.py, or None."""
    key = hashlib.sha1(f"{clip_engine}|{voice}|{text}".encode()).hexdigest()[:8]
    path = RAW / f"{clip_engine}__{voice}__{lang}__{line_id}__{key}.wav"
    return path if path.exists() else None


def encode(clip, name):
    """Same loudness as the others, and small enough to keep in git."""
    flat = SAMPLES / f"_{name}.wav"
    normalise(clip, flat)
    target = SAMPLES / f"{name}.m4a"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(flat), "-map_metadata", "-1", "-c:a", "aac", "-b:a", "64k", str(target)], check=True)
    flat.unlink()
    return f"samples/{target.name}"


def main():
    shutil.rmtree(SAMPLES, ignore_errors=True)
    SAMPLES.mkdir(parents=True)
    text, stars, speeds = load_text(), load_ratings(), load_speeds()
    voices, missing = [], []
    for langs, engine, voice, name, licence in CATALOG:
        clip_engine, engine_name, engine_licence, connected = ENGINES[engine]
        key = f"{clip_engine}/{voice}"
        for lang in langs.split():
            short = clip_for(clip_engine, voice, lang, "r1", text[lang, "r1"])
            if not short:
                missing.append(f"{key} {lang}")
                continue
            long = clip_for(clip_engine, voice, lang, "r2", text[lang, "r2"])
            base = f"{lang}-{engine}-{voice}"
            voices.append({
                "lang": lang, "name": name, "engine": engine, "voice": voice, "engineName": engine_name,
                "licence": licence or engine_licence, "connected": connected, "default": connected and (lang, voice) in DEFAULTS,
                "starsShort": stars.get((lang, "r1", key), 0), "starsLong": stars.get((lang, "r2", key), 0),
                "slowerThanRealtime": speeds.get(short.name),
                "short": encode(short, f"{base}-short"),
                "long": encode(long, f"{base}-long") if long else None,
            })
    # Connected voices first, then the author's favourites.
    voices.sort(key=lambda v: (v["lang"], not v["connected"], not v["default"], -v["starsLong"], -v["starsShort"]))
    data = {"voices": voices, "text": {f"{lang}:{i}": t for (lang, i), t in text.items()}}
    (OUT / "voices.js").write_text("window.VOICES = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    size = sum(p.stat().st_size for p in SAMPLES.glob("*.m4a")) / 1e6
    print(f"{len(voices)} voice entries, {size:.1f} MB of samples -> {OUT / 'index.html'}")
    if missing:
        raise SystemExit("No clip for the current text: " + ", ".join(missing))


if __name__ == "__main__":
    main()
