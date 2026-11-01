"""Renders voice jobs with Pocket TTS. Usage: pocket_jobs.py jobs.json
Each job: {"say", "voice", "lang", "take", "speed", "out"}. Pocket has no speed control, so speed is ignored.
A voice ending in -24l uses the larger, slower model, for example juergen-24l."""
import json
import pathlib
import sys

import soundfile as sf
import torch
from pocket_tts import TTSModel

LANGUAGES = {"de": "german", "en": "english"}
models, states = {}, {}
for job in json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")):
    voice, _, size = job["voice"].partition("-")
    language = LANGUAGES[job["lang"]] + (f"_{size}" if size else "")
    if language not in models:
        models[language] = TTSModel.load_model(language=language)
    model = models[language]
    if (language, voice) not in states:
        states[language, voice] = model.get_state_for_audio_prompt(voice)
    torch.manual_seed(job["take"])
    sf.write(job["out"], model.generate_audio(states[language, voice], job["say"]).numpy(), model.sample_rate)
    print(job["out"], flush=True)
