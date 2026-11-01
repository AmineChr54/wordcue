"""Kokoro German fine-tune (Thorsten voice) as plain ONNX weights, phonemized with eSpeak NG.
Usage: kokoro_de_onnx.py [ids]"""
import json
import pathlib
import re
import sys

import numpy as np
import onnxruntime as ort
from huggingface_hub import snapshot_download
from misaki.espeak import EspeakG2P

import labkit

ids = sys.argv[1].split(",") if len(sys.argv) > 1 else ["r1"]
root = pathlib.Path(snapshot_download("DocXAssist/voices", allow_patterns=["de/*"])) / "de"
session = ort.InferenceSession(str(root / "model.onnx"), providers=["CPUExecutionProvider"])
raw = json.loads((root / "vocab.json").read_text(encoding="utf-8"))
vocab = raw.get("vocab", raw)
voice = np.fromfile(root / "thorsten.bin", dtype=np.float32).reshape(510, 1, 256)
g2p = EspeakG2P(language="de")
PAUSE = np.zeros(int(24000 * 0.18), dtype=np.float32)


def sentence(text):
    phonemes, _ = g2p(text)
    # The model card notes the short ü is missing from Kokoro's vocabulary.
    tokens = [vocab[p] for p in phonemes.replace("ʏ", "y") if p in vocab][:508]
    wave = session.run(None, {
        "input_ids": np.array([[0, *tokens, 0]], dtype=np.int64),
        "style": voice[len(tokens) - 1],
        "speed": np.array([1.0], dtype=np.float32),
    })[0]
    return np.asarray(wave, dtype=np.float32).squeeze()


def run(text):
    parts = []
    for s in re.split(r"(?<=[.!?])\s+", text):
        parts += [sentence(s), PAUSE]
    return np.concatenate(parts[:-1]), 24000


for line in labkit.lines(ids, langs=("de",)):
    labkit.synth("kokoro-de", "thorsten", line, run)
print("DONE", flush=True)
