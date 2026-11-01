"""VoxCPM2 on CPU, with voices designed from a text description, no reference audio.
Usage: voxcpm_engine.py [ids] [voices]"""
import sys

import torch
from voxcpm import VoxCPM

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
DESIGNS = {
    "warm-f": {
        "de": "Eine warme, ruhige deutsche Erzählerin mit klarer Aussprache",
        "en": "A warm, calm female narrator with clear pronunciation",
    },
    "warm-m": {
        "de": "Ein warmer, ruhiger deutscher Erzähler mit tiefer Stimme und klarer Aussprache",
        "en": "A warm, calm male narrator with a deep voice and clear pronunciation",
    },
}
voices = sys.argv[2].split(",") if len(sys.argv) > 2 else list(DESIGNS)
model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False, device="cpu")
sr = model.tts_model.sample_rate

for voice in voices:
    for line in labkit.lines(ids):
        def run(text):
            prompt = f"({DESIGNS[voice][line['lang']]}){text}"
            torch.manual_seed(42)
            return model.generate(text=prompt, cfg_value=2.0, inference_timesteps=10), sr
        labkit.synth("voxcpm2", voice, line, run)
print("DONE", flush=True)
