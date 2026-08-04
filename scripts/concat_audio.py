#!/usr/bin/env python3
"""Recolle les parties WAV en un seul fichier, sans ffmpeg.

Les parties sortent toutes du même modèle avec les mêmes paramètres, donc
elles partagent format et fréquence : on peut écrire les frames à la suite
sans ré-encoder, donc sans perte ni artefact de transition.

Un silence court est inséré entre deux parties, parce que la coupure tombe sur
une frontière de paragraphe et que le modèle ne laisse rien respirer en fin de
segment.

    python3 scripts/concat_audio.py
"""

from __future__ import annotations

import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "audio"
DESTINATION = AUDIO_DIR / "recitation-full.wav"
GAP_SECONDS = 0.7


def main() -> None:
    parts = sorted(p for p in AUDIO_DIR.glob("part-*.wav"))
    if not parts:
        sys.exit("aucune partie audio dans audio/")

    with wave.open(str(parts[0]), "rb") as first:
        params = first.getparams()
    silence = b"\x00" * int(params.framerate * GAP_SECONDS) * params.sampwidth * params.nchannels

    with wave.open(str(DESTINATION), "wb") as output:
        output.setparams(params)
        for index, part in enumerate(parts):
            with wave.open(str(part), "rb") as chunk:
                if chunk.getparams()[:3] != params[:3]:
                    sys.exit(f"format incohérent dans {part.name}")
                output.writeframes(chunk.readframes(chunk.getnframes()))
            if index < len(parts) - 1:
                output.writeframes(silence)

    with wave.open(str(DESTINATION), "rb") as final:
        minutes = final.getnframes() / final.getframerate() / 60
    size = DESTINATION.stat().st_size / 1_000_000
    print(f"{len(parts)} parties → {DESTINATION.relative_to(ROOT)}")
    print(f"{minutes:.0f} minutes, {size:.0f} Mo")


if __name__ == "__main__":
    main()
