"""Qwen3-TTS 0.6B CustomVoice on CPU. Usage: qwen.py [ids] [speakers]"""
import sys
import time

import torch
from qwen_tts import Qwen3TTSModel

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
speakers = sys.argv[2].split(",") if len(sys.argv) > 2 else ["ryan", "aiden", "serena", "vivian"]
LANG = {"de": "german", "en": "english"}

t0 = time.perf_counter()
model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice", device_map="cpu", dtype=torch.float32)
print(f"loaded in {time.perf_counter() - t0:.1f}s; speakers={model.get_supported_speakers()}", flush=True)

for speaker in speakers:
    for line in labkit.lines(ids):
        def run(text):
            torch.manual_seed(11)
            wavs, sr = model.generate_custom_voice(text=text, speaker=speaker, language=LANG[line["lang"]])
            return wavs[0], sr
        labkit.synth("qwen06", speaker, line, run)
print("DONE", flush=True)
