"""script.json -> narration.wav + timing.js. Only lines whose words or voice changed are regenerated.

Each line gets several takes. Whisper listens to each, the take closest to the script wins, and its
word times become the anchors that the visuals hang on. A line no take says correctly stops the build.

Usage: voice.py <film_dir> [--allow-low] [--threshold 0.82]
script.json: {"voice": {"engine","voice","lang","speed","takes"}, "gap": 0.3,
              "lines": [{"id", "text", "say"?, "gap"?, "stop"?}]}
"""
import argparse
import difflib
import hashlib
import json
import pathlib
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from num2words import num2words

ROOT = pathlib.Path(__file__).resolve().parent
LAB = ROOT.parent / "voice-lab"
CACHE = ROOT / "cache" / "voice"
TARGET = "I=-16:TP=-1.5:LRA=11"
ADAPTERS = {
    "supertonic3": (LAB / "venvs" / "supertonic" / "Scripts" / "python.exe", ROOT / "tts" / "supertonic_jobs.py"),
    "pocket": (LAB / "venvs" / "pocket" / "Scripts" / "python.exe", ROOT / "tts" / "pocket_jobs.py"),
    "qwen": (LAB / "venvs" / "qwen" / "Scripts" / "python.exe", ROOT / "tts" / "qwen_jobs.py"),
}


def squash(s):
    return re.sub(r"[^\w]", "", s.lower().replace("ß", "ss"), flags=re.UNICODE)


def spoken(token, lang):
    """Whisper writes numbers as digits, the script spells them out. Compare like with like."""
    def word(m):
        return num2words(int(m.group()), lang=lang)
    return re.sub(r"\d+", word, token)


def timed_chars(words, lang):
    """Every character Whisper heard, with an interpolated time."""
    chars, times = [], []
    for w in words:
        text = squash(spoken(w["w"], lang))
        for i, c in enumerate(text):
            chars.append(c)
            times.append(w["start"] + (w["end"] - w["start"]) * i / max(len(text), 1))
    return "".join(chars), times


def align(say, heard, lang):
    """Script words with times from the recording, plus how closely the recording matched."""
    tokens = say.split()
    script = [squash(spoken(t, lang)) for t in tokens]
    joined = "".join(script)
    chars, times = timed_chars(heard, lang)
    matcher = difflib.SequenceMatcher(None, joined, chars, autojunk=False)
    mapping = {}
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            mapping[block.a + k] = times[block.b + k]
    out, pos = [], 0
    for token, s in zip(tokens, script):
        hits = [mapping[i] for i in range(pos, pos + len(s)) if i in mapping]
        out.append({"w": token, "start": hits[0] if hits else None, "end": hits[-1] if hits else None})
        pos += len(s)
    # Words the recognizer missed sit between their neighbours.
    known = [i for i, w in enumerate(out) if w["start"] is not None]
    for i, w in enumerate(out):
        if w["start"] is None:
            before = max((k for k in known if k < i), default=None)
            after = min((k for k in known if k > i), default=None)
            lo = out[before]["end"] if before is not None else 0.0
            hi = out[after]["start"] if after is not None else (heard[-1]["end"] if heard else lo)
            w["start"] = w["end"] = lo + (hi - lo) * .5
    return out, matcher.ratio()


def transcribe(model, wav, lang):
    side = wav.with_suffix(".asr.json")
    if side.exists():
        return json.loads(side.read_text(encoding="utf-8"))
    # Decoded here because faster-whisper's own decoder breaks on current PyAV releases.
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    segments, _ = model.transcribe(np.frombuffer(pcm, dtype=np.float32), language=lang, word_timestamps=True,
                                   vad_filter=False, beam_size=5)
    words = [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
             for seg in segments for w in seg.words]
    side.write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
    return words


def generate(jobs, engine):
    python, script = ADAPTERS[engine]
    todo = CACHE / "_jobs.json"
    todo.write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
    subprocess.run([str(python), str(script), str(todo)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    todo.unlink()


def loudnorm(src, dst):
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    m = json.loads(re.findall(r"\{[^{}]*\}", probe)[-1])
    af = (f"loudnorm={TARGET}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", "48000", "-ac", "1", str(dst)], check=True)
    return float(m["input_i"])


def trim(audio, sr):
    """Cuts leading and trailing silence, so gaps between lines are exactly what the script asks for."""
    loud = np.flatnonzero(np.abs(audio) > .01)
    if not len(loud):
        return audio, 0.0
    a = max(loud[0] - int(.03 * sr), 0)
    b = min(loud[-1] + int(.08 * sr), len(audio))
    return audio[a:b], a / sr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film")
    ap.add_argument("--allow-low", action="store_true")
    ap.add_argument("--threshold", type=float, default=.82)
    args = ap.parse_args()

    film = pathlib.Path(args.film).resolve()
    build = film / "build"
    build.mkdir(exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    script = json.loads((film / "script.json").read_text(encoding="utf-8"))
    v = script["voice"]
    lang, takes, speed = v["lang"], v.get("takes", 3), v.get("speed", 1.05)

    jobs, plan = [], []
    for line in script["lines"]:
        say = line.get("say", line["text"])
        row = []
        for take in range(takes):
            key = hashlib.sha1(f"{v['engine']}|{v['voice']}|{lang}|{speed}|{take}|{say}".encode()).hexdigest()[:12]
            wav = CACHE / f"{key}.wav"
            row.append(wav)
            if not wav.exists():
                jobs.append({"say": say, "voice": v["voice"], "lang": lang, "take": take, "speed": speed, "out": str(wav)})
        plan.append((line, say, row))
    if jobs:
        generate(jobs, v["engine"])
    print(f"{len(jobs)} takes generated, {sum(takes for _ in plan) - len(jobs)} from cache")

    model = WhisperModel("small", device="cpu", compute_type="int8")
    timeline, parts, low, cursor, sr = [], [], [], 0.0, None
    for line, say, row in plan:
        best = None
        for wav in row:
            words, score = align(say, transcribe(model, wav, lang), lang)
            if best is None or score > best[2]:
                best = (wav, words, score)
        wav, words, score = best
        audio, rate = sf.read(wav, dtype="float32")
        sr = sr or rate
        audio, cut = trim(audio, rate)
        dur = len(audio) / rate
        for w in words:
            w["start"] = round(cursor + max(w["start"] - cut, 0), 3)
            w["end"] = round(cursor + max(w["end"] - cut, 0), 3)
        timeline.append({
            "id": line["id"], "text": line["text"], "say": say, "start": round(cursor, 3), "end": round(cursor + dur, 3),
            "match": round(score, 3), "take": row.index(wav), "stop": bool(line.get("stop")), "words": words,
        })
        gap = line.get("gap", script.get("gap", .3))
        parts += [audio, np.zeros(int(gap * rate), dtype=np.float32)]
        cursor += dur + gap
        mark = "" if score >= args.threshold else "  <-- LOW"
        print(f"{line['id']:>10}  match {score:.2f}  take {row.index(wav)}  {dur:5.2f}s{mark}")
        if score < args.threshold:
            low.append(line["id"])

    if low and not args.allow_low:
        sys.exit(f"Blocked: no take of {', '.join(low)} matches the script. Listen, respell the say text, or pass --allow-low.")

    raw = build / "_narration_raw.wav"
    sf.write(raw, np.concatenate(parts), sr)
    loudnorm(raw, build / "narration.wav")
    raw.unlink()
    timing = {"duration": round(cursor, 3), "lines": timeline}
    (build / "timing.js").write_text("window.TIMING = " + json.dumps(timing, ensure_ascii=False) + ";\n", encoding="utf-8")
    words = sum(len(l["words"]) for l in timeline)
    print(f"{cursor:.1f}s, {words} words, {words / cursor * 60:.0f} wpm -> {build}")


main()
