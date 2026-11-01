"""Kokoro-82M on CPU: stock English voices. Usage: kokoro_engine.py [ids]"""
import sys

import numpy as np
from kokoro import KPipeline

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
EN_VOICES = ["af_heart", "af_bella", "am_michael", "bm_george"]


def speak(pipeline, voice, text):
    chunks = [audio for _, _, audio in pipeline(text, voice=voice, speed=1.0)]
    return np.concatenate(chunks), 24000


en = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
gb = KPipeline(lang_code="b", repo_id="hexgrad/Kokoro-82M", model=en.model)
for voice in EN_VOICES:
    pipeline = gb if voice.startswith("b") else en
    for line in labkit.lines(ids, langs=("en",)):
        labkit.synth("kokoro", voice, line, lambda text: speak(pipeline, voice, text))
print("DONE", flush=True)
