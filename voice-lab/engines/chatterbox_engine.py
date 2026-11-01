"""Chatterbox Multilingual on CPU with its one built-in voice. Usage: chatterbox_engine.py [ids]"""
import sys

import torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

import labkit

# Its built-in voice file was saved on a GPU, and from_pretrained does not map it to the CPU.
_load = torch.load
torch.load = lambda *a, **k: _load(*a, **{**k, "map_location": "cpu"})

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
model = ChatterboxMultilingualTTS.from_pretrained(torch.device("cpu"))

for line in labkit.lines(ids):
    def run(text):
        torch.manual_seed(11)
        return model.generate(text, language_id=line["lang"]).cpu().numpy(), model.sr
    labkit.synth("chatterbox", "default", line, run)
print("DONE", flush=True)
