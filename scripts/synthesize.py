#!/usr/bin/env python3
"""Synthétise les parties TTS puis les recolle en un seul WAV.

Gemini TTS plafonne à 4 000 octets par requête et ~655 s d'audio : un fichier
unique n'est pas générable en un appel. On appelle donc l'API une fois par
partie, et on concatène les WAV en sortie — le résultat final est bien un seul
fichier audio.

Prérequis :
    gcloud auth application-default login
    export GOOGLE_CLOUD_PROJECT=votre-projet

Usage :
    python3 scripts/synthesize.py                    # tout, voix par défaut
    python3 scripts/synthesize.py --voice Charon     # une autre voix
    python3 scripts/synthesize.py --only 3 4 5       # regénérer 3 parties
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTS_DIR = ROOT / "src/content/tts"
OUT_DIR = ROOT / "audio"
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"

DEFAULT_VOICE = "Charon"
DEFAULT_MODEL = "gemini-2.5-pro-tts"


def access_token() -> str:
    try:
        result = subprocess.run(
            ["gcloud", "auth", "application-default", "print-access-token"],
            capture_output=True,
            text=True,
            check=True,
        )
    except FileNotFoundError:
        sys.exit("gcloud est introuvable — installez le SDK ou fournissez un jeton.")
    except subprocess.CalledProcessError as error:
        sys.exit(f"gcloud n'a pas pu produire de jeton :\n{error.stderr.strip()}")
    return result.stdout.strip()


def synthesize(text: str, prompt: str, voice: str, model: str, token: str, project: str) -> bytes:
    payload = {
        "input": {"text": text, "prompt": prompt},
        "voice": {"languageCode": "en-us", "name": voice, "model_name": model},
        "audioConfig": {"audioEncoding": "LINEAR16"},
    }
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "x-goog-user-project": project,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        sys.exit(f"HTTP {error.code} : {error.read().decode()[:600]}")
    return base64.b64decode(body["audioContent"])


def concatenate(sources: list[Path], destination: Path) -> None:
    """Recolle des WAV de mêmes paramètres — pas besoin de ffmpeg."""
    with wave.open(str(sources[0]), "rb") as first:
        params = first.getparams()
    with wave.open(str(destination), "wb") as output:
        output.setparams(params)
        for source in sources:
            with wave.open(str(source), "rb") as chunk:
                if chunk.getparams()[:3] != params[:3]:
                    sys.exit(f"paramètres audio incohérents dans {source.name}")
                output.writeframes(chunk.readframes(chunk.getnframes()))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--only", nargs="*", type=int, help="numéros de parties à regénérer")
    args = parser.parse_args()

    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not project:
        sys.exit("GOOGLE_CLOUD_PROJECT n'est pas défini.")

    parts = sorted(PARTS_DIR.glob("part-*.txt"))
    if not parts:
        sys.exit("aucune partie — lancez d'abord scripts/build-tts.py")

    prompt = (PARTS_DIR / "prompt.txt").read_text().strip()
    token = access_token()
    OUT_DIR.mkdir(exist_ok=True)

    for index, part in enumerate(parts, start=1):
        target = OUT_DIR / f"{part.stem}.wav"
        if args.only and index not in args.only:
            continue
        if target.exists() and not args.only:
            print(f"{part.stem} déjà généré, ignoré")
            continue
        audio = synthesize(part.read_text().strip(), prompt, args.voice, args.model, token, project)
        target.write_bytes(audio)
        print(f"{part.stem} → {len(audio) / 1_000_000:.1f} Mo")

    generated = sorted(OUT_DIR.glob("part-*.wav"))
    if len(generated) == len(parts):
        full = OUT_DIR / "recitation-full.wav"
        concatenate(generated, full)
        with wave.open(str(full), "rb") as final:
            minutes = final.getnframes() / final.getframerate() / 60
        print(f"\n{full.relative_to(ROOT)} — {minutes:.0f} minutes en un seul fichier")
    else:
        print(f"\n{len(generated)}/{len(parts)} parties générées, pas de concaténation")


if __name__ == "__main__":
    main()
