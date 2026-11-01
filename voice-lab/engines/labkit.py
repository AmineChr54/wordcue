"""Shared helpers for the engine scripts: line loading, caching, timing, metrics."""
import hashlib
import json
import pathlib
import time

import numpy as np
import psutil
import soundfile as sf

LAB = pathlib.Path(__file__).resolve().parent.parent
OUT = LAB / "out" / "raw"
METRICS = LAB / "out" / "metrics.jsonl"


def lines(ids=("r1",), langs=("de", "en")):
    data = json.loads((LAB / "lines.json").read_text(encoding="utf-8"))["lines"]
    return [l for l in data if l["id"] in ids and l["lang"] in langs]


def peak_ram_gb():
    return psutil.Process().memory_info().peak_wset / 1024**3


def synth(engine, voice, line, fn, **extra):
    """Run fn(text) -> (samples, sample_rate) unless this exact clip already exists."""
    OUT.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(f"{engine}|{voice}|{line['text']}".encode()).hexdigest()[:8]
    path = OUT / f"{engine}__{voice}__{line['lang']}__{line['id']}__{key}.wav"
    if path.exists():
        print(f"cached {path.name}", flush=True)
        return path
    t0 = time.perf_counter()
    audio, sr = fn(line["text"])
    took = time.perf_counter() - t0
    audio = np.asarray(audio, dtype=np.float32).squeeze()
    sf.write(path, audio, sr)
    dur = len(audio) / sr
    rec = {
        "engine": engine, "voice": voice, "lang": line["lang"], "id": line["id"],
        "file": path.name, "seconds": round(dur, 2), "took": round(took, 2),
        "slower_than_realtime": round(took / dur, 2), "peak_ram_gb": round(peak_ram_gb(), 2),
        "sample_rate": sr, **extra,
    }
    with METRICS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")
    print(json.dumps(rec), flush=True)
    return path
