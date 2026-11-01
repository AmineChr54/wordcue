"""Normalises every clip for the current lines.json to -16 LUFS and writes out/audition/index.html.
This is the full blind audition. Safe to rerun as clips arrive."""
import hashlib
import json
import pathlib
import random
import re
import subprocess

LAB = pathlib.Path(__file__).resolve().parent
RAW = LAB / "out" / "raw"
AUD = LAB / "out" / "audition"
CLIPS = AUD / "clips"
TARGET = "I=-16:TP=-1.5:LRA=11"

ENGINES = {
    "qwen06": ("Qwen3-TTS 0.6B", "Apache 2.0"),
    "supertonic3": ("Supertonic 3", "OpenRAIL-M weights, use restrictions"),
    "kokoro": ("Kokoro-82M", "Apache 2.0"),
    "kokoro-de": ("Kokoro German fine-tune (Thorsten)", "Apache 2.0, CC0 dataset"),
    "chatterbox": ("Chatterbox Multilingual", "MIT"),
    "voxcpm2": ("VoxCPM2 designed voice", "Apache 2.0"),
    "pocket": ("Pocket TTS", "CC-BY-4.0, attribution required"),
}


def normalise(src, dst, pre=()):
    """Two-pass linear loudnorm, so the voice's own dynamics stay intact."""
    if dst.exists() and dst.stat().st_mtime > src.stat().st_mtime:
        return
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    m = json.loads(re.findall(r"\{[^{}]*\}", probe)[-1])
    af = (f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", "48000", "-ac", "1", str(dst)], check=True)


def metrics():
    path = LAB / "out" / "metrics.jsonl"
    seen = {}
    if path.exists():
        for row in path.read_text(encoding="utf-8").splitlines():
            r = json.loads(row)
            seen[r["file"]] = r
    return seen


def main():
    CLIPS.mkdir(parents=True, exist_ok=True)
    stats = metrics()
    lines = json.loads((LAB / "lines.json").read_text(encoding="utf-8"))["lines"]
    current = {(l["lang"], l["id"]): l["text"] for l in lines}
    clips = []
    for wav in sorted(RAW.glob("*.wav")):
        engine, voice, lang, line_id, key = wav.stem.split("__")
        text = current.get((lang, line_id), "")
        # Clips for older text stay on disk but don't appear.
        if key != hashlib.sha1(f"{engine}|{voice}|{text}".encode()).hexdigest()[:8]:
            continue
        dst = CLIPS / wav.name
        normalise(wav, dst)
        s = stats.get(wav.name, {})
        name, licence = ENGINES.get(engine, (engine, "?"))
        clips.append({
            "key": f"{engine}/{voice}", "engine": name, "voice": voice, "licence": licence,
            "lang": lang, "round": line_id, "file": f"clips/{wav.name}",
            "speed": s.get("slower_than_realtime"), "ram": s.get("peak_ram_gb"),
            "seconds": s.get("seconds"), "rate": s.get("sample_rate"),
        })

    # Labels renumber as voices are added. Ratings are stored per model and voice, so they survive.
    labels = {}
    for lang in ("de", "en"):
        keys = sorted({c["key"] for c in clips if c["lang"] == lang})
        random.Random(f"voice-lab-{lang}").shuffle(keys)
        for i, key in enumerate(keys):
            labels[f"{lang}:{key}"] = f"Voice {i + 1}"
    for c in clips:
        c["label"] = labels[f"{c['lang']}:{c['key']}"]

    data = {"clips": clips, "lines": lines}
    page = (LAB / "audition_template.html").read_text(encoding="utf-8")
    (AUD / "index.html").write_text(page.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False)), encoding="utf-8")
    print(f"{len(clips)} clips -> {AUD / 'index.html'}")


if __name__ == "__main__":
    main()
