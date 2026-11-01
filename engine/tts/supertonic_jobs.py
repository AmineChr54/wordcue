"""Renders voice jobs with Supertonic 3. Usage: supertonic_jobs.py jobs.json
Each job: {"say", "voice", "lang", "take", "speed", "out"}."""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from supertonic import TTS

tts = TTS(auto_download=True)
styles = {}
for job in json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")):
    style = styles.setdefault(job["voice"], tts.get_voice_style(voice_name=job["voice"]))
    np.random.seed(job["take"])
    wav, _ = tts.synthesize(job["say"], voice_style=style, lang=job["lang"], speed=job["speed"])
    sf.write(job["out"], np.asarray(wav, dtype=np.float32).squeeze(), tts.sample_rate)
    print(job["out"], flush=True)
