"""Renders voice jobs with Qwen3-TTS 0.6B. Usage: qwen_jobs.py jobs.json
Each job: {"say", "voice", "lang", "take", "speed", "out"}. Qwen has no speed control, so speed is ignored.
It takes 5-9 seconds of CPU time per second of speech, so use fewer takes for long scripts."""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

LANGUAGES = {"de": "german", "en": "english"}
model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice", device_map="cpu", dtype=torch.float32)
for job in json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")):
    torch.manual_seed(11 + job["take"])
    wavs, rate = model.generate_custom_voice(text=job["say"], speaker=job["voice"], language=LANGUAGES[job["lang"]])
    sf.write(job["out"], np.asarray(wavs[0], dtype=np.float32).squeeze(), rate)
    print(job["out"], flush=True)
