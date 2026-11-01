"""Supertonic 3 on CPU via ONNX. Usage: supertonic_engine.py [ids] [voices]"""
import sys

from supertonic import TTS

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
voices = sys.argv[2].split(",") if len(sys.argv) > 2 else ["F1", "F2", "M1", "M2"]

tts = TTS(auto_download=True)
print("sample_rate", tts.sample_rate, flush=True)

for voice in voices:
    style = tts.get_voice_style(voice_name=voice)
    for line in labkit.lines(ids):
        def run(text):
            wav, _ = tts.synthesize(text, voice_style=style, lang=line["lang"])
            return wav, tts.sample_rate
        labkit.synth("supertonic3", voice, line, run)
print("DONE", flush=True)
