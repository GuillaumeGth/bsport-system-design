#!/usr/bin/env python3
"""Génère l'audio des parties via Replicate, puis recolle le tout.

Replicate héberge google/gemini-3.1-flash-tts en modèle officiel : mêmes
balises entre crochets et même plafond de 4 000 octets que l'API Google, donc
les parties produites par build-tts.py sont utilisables telles quelles.

Le jeton se lit dans l'environnement, jamais dans un fichier — ce dépôt est
public.

    export REPLICATE_API_TOKEN=...
    python3 scripts/synthesize_replicate.py
    python3 scripts/synthesize_replicate.py --only 7 12   # regénérer 2 parties
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTS_DIR = ROOT / "src/content/tts"
OUT_DIR = ROOT / "audio"
MODEL = "google/gemini-3.1-flash-tts"
CREATE_URL = f"https://api.replicate.com/v1/models/{MODEL}/predictions"

DEFAULT_VOICE = "Kore"
DEFAULT_LANGUAGE = "en-GB"
POLL_SECONDS = 5
POLL_TIMEOUT = 900


def token() -> str:
    value = os.environ.get("REPLICATE_API_TOKEN")
    if not value:
        sys.exit("REPLICATE_API_TOKEN n'est pas défini.")
    return value


def call(url: str, tok: str, payload: dict | None = None) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        sys.exit(f"HTTP {error.code} sur {url} : {error.read().decode()[:500]}")


def generate(part: Path, prompt: str, voice: str, language: str, tok: str) -> Path:
    payload = {
        "input": {
            "text": part.read_text().strip(),
            "prompt": prompt,
            "voice": voice,
            "language_code": language,
        }
    }
    prediction = call(CREATE_URL, tok, payload)

    deadline = time.monotonic() + POLL_TIMEOUT
    while prediction["status"] not in ("succeeded", "failed", "canceled"):
        if time.monotonic() > deadline:
            sys.exit(f"{part.stem} : délai dépassé, statut {prediction['status']}")
        time.sleep(POLL_SECONDS)
        prediction = call(prediction["urls"]["get"], tok)

    if prediction["status"] != "succeeded":
        sys.exit(f"{part.stem} a échoué : {prediction.get('error')}")

    output = prediction["output"]
    if isinstance(output, list):
        output = output[0]

    target = OUT_DIR / f"{part.stem}.wav"
    with urllib.request.urlopen(output) as remote:
        target.write_bytes(remote.read())
    print(f"{part.stem} → {target.stat().st_size / 1_000_000:.1f} Mo")
    return target


def duration(path: Path) -> float:
    """Durée d'un fichier audio, sans dépendance externe."""
    probe = subprocess.run(
        ["afinfo", "-b", str(path)], capture_output=True, text=True, check=False
    )
    for line in probe.stdout.splitlines():
        if "estimated duration" in line:
            return float(line.split(":")[1].strip().split()[0])
    return 0.0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--language", default=DEFAULT_LANGUAGE)
    parser.add_argument("--only", nargs="*", type=int)
    args = parser.parse_args()

    tok = token()
    parts = sorted(PARTS_DIR.glob("part-*.txt"))
    if not parts:
        sys.exit("aucune partie — lancez d'abord scripts/build-tts.py")

    prompt = (PARTS_DIR / "prompt.txt").read_text().strip()
    OUT_DIR.mkdir(exist_ok=True)

    pending = [
        part
        for index, part in enumerate(parts, start=1)
        if (args.only and index in args.only)
        or (not args.only and not (OUT_DIR / f"{part.stem}.wav").exists())
    ]
    print(f"{len(pending)} partie(s) à générer sur {len(parts)}")

    # Replicate encaisse les appels concurrents ; on reste modeste sur le
    # parallélisme pour ne pas se faire limiter en plein milieu.
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda p: generate(p, prompt, args.voice, args.language, tok), pending))

    produced = sorted(OUT_DIR.glob("part-*.wav"))
    if len(produced) != len(parts):
        sys.exit(f"{len(produced)}/{len(parts)} parties présentes, pas de concaténation")

    total = sum(duration(p) for p in produced)
    print(f"\n{len(produced)} parties, {total / 60:.0f} minutes au total")


if __name__ == "__main__":
    main()
