"""Pocket TTS on CPU with its stock voices. Usage: pocket_engine.py [ids]"""
import sys

from pocket_tts import TTSModel

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
for language, lang, voices in (("german", "de", ["juergen"]), ("german_24l", "de", ["juergen"]), ("english", "en", ["alba", "jean"])):
    model = TTSModel.load_model(language=language)
    for voice in voices:
        state = model.get_state_for_audio_prompt(voice)
        name = f"{voice}-24l" if "24l" in language else voice
        for line in labkit.lines(ids, langs=(lang,)):
            labkit.synth("pocket", name, line, lambda text: (model.generate_audio(state, text).numpy(), model.sample_rate))
print("DONE", flush=True)
