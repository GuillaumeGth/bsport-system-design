#!/usr/bin/env python3
"""Recolle les parties WAV d'une langue, puis compresse pour le site.

Les parties sortent du même modèle avec la même voix et le même prompt, donc
elles partagent format et fréquence : on écrit les frames à la suite sans
ré-encoder, donc sans perte ni artefact de transition.

Un silence court est inséré entre deux parties, parce que la coupure tombe sur
une frontière de paragraphe et que le modèle ne laisse rien respirer en fin de
segment.

    python3 scripts/concat_audio.py          # les deux langues
    python3 scripts/concat_audio.py fr
"""

from __future__ import annotations

import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
PUBLIC = ROOT / "public/audio"
GAP_SECONDS = 0.7


def concat(lang: str) -> Path | None:
    parts = sorted((AUDIO / lang).glob("part-*.wav"))
    expected = len(list((ROOT / "src/content/tts" / lang).glob("part-*.txt")))
    if not parts:
        print(f"{lang} : aucune partie audio, ignoré")
        return None
    if len(parts) != expected:
        print(f"{lang} : {len(parts)}/{expected} parties seulement, pas de concaténation")
        return None

    with wave.open(str(parts[0]), "rb") as first:
        params = first.getparams()
    silence = b"\x00" * int(params.framerate * GAP_SECONDS) * params.sampwidth * params.nchannels

    full = AUDIO / f"recitation-{lang}.wav"
    with wave.open(str(full), "wb") as output:
        output.setparams(params)
        for index, part in enumerate(parts):
            with wave.open(str(part), "rb") as chunk:
                if chunk.getparams()[:3] != params[:3]:
                    sys.exit(f"format incohérent dans {part.name}")
                output.writeframes(chunk.readframes(chunk.getnframes()))
            if index < len(parts) - 1:
                output.writeframes(silence)

    PUBLIC.mkdir(parents=True, exist_ok=True)

    # Le site consomme un fichier par chapitre. Un fichier unique de 42 Mo
    # oblige le navigateur à en télécharger une large part avant de pouvoir
    # démarrer : dix à trente secondes d'attente avant le premier son. Chaque
    # chapitre pèse moins de deux mégaoctets et démarre tout de suite.
    chapter_dir = PUBLIC / lang
    chapter_dir.mkdir(exist_ok=True)
    for stale in chapter_dir.glob("*.m4a"):
        stale.unlink()
    for part in parts:
        subprocess.run(
            ["afconvert", "-f", "m4af", "-d", "aacl@44100", "-b", "64000",
             str(part), str(chapter_dir / f"{part.stem}.m4a")],
            check=True,
        )

    compressed = AUDIO / f"recitation.{lang}.m4a"
    # AAC-LC à 44,1 kHz explicitement : l'AAC générique à 24 kHz que produit
    # afconvert par défaut met des dizaines de secondes à démarrer dans un
    # navigateur, alors que ce profil-ci commence à jouer tout de suite.
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aacl@44100", "-b", "64000", str(full), str(compressed)],
        check=True,
    )

    with wave.open(str(full), "rb") as final:
        minutes = final.getnframes() / final.getframerate() / 60
    print(
        f"{lang} : {len(parts)} parties → {compressed.relative_to(ROOT)}, "
        f"{minutes:.0f} min, {compressed.stat().st_size / 1_000_000:.0f} Mo"
    )
    return compressed


def main() -> None:
    for lang in sys.argv[1:] or ["en", "fr"]:
        concat(lang)


if __name__ == "__main__":
    main()
