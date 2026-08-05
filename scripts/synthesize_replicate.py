#!/usr/bin/env python3
"""Génère l'audio des parties via Replicate, langue par langue.

Replicate héberge google/gemini-3.1-flash-tts en modèle officiel : mêmes
balises entre crochets et même plafond de 4 000 octets que l'API Google, donc
les parties produites par build-tts.py sont utilisables telles quelles.

La voix et le prompt sont identiques pour toutes les parties d'une langue :
c'est ce qui garde un timbre continu une fois les segments recollés.

Le jeton se lit dans l'environnement, jamais dans un fichier — ce dépôt est
public.

    export REPLICATE_API_TOKEN=...
    python3 scripts/synthesize_replicate.py fr
    python3 scripts/synthesize_replicate.py fr --only 7 12
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL = "google/gemini-3.1-flash-tts"
CREATE_URL = f"https://api.replicate.com/v1/models/{MODEL}/predictions"

VOICE = "Kore"
LANGUAGE_CODES = {"en": "en-GB", "fr": "fr-FR"}
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


def generate(part: Path, prompt: str, voice: str, language: str, tok: str, out_dir: Path) -> str | None:
    """Retourne un message d'erreur, ou None si la partie est produite.

    Une partie qui échoue ne doit pas arrêter les autres : le filtre de contenu
    du modèle produit des faux positifs, et il suffit alors de relancer."""
    payload = {
        "input": {
            "text": part.read_text().strip(),
            "prompt": prompt,
            "voice": voice,
            "language_code": language,
        }
    }
    try:
        prediction = call(CREATE_URL, tok, payload)
    except SystemExit as error:
        return f"{part.stem} : {error}"

    deadline = time.monotonic() + POLL_TIMEOUT
    while prediction["status"] not in ("succeeded", "failed", "canceled"):
        if time.monotonic() > deadline:
            return f"{part.stem} : délai dépassé, statut {prediction['status']}"
        time.sleep(POLL_SECONDS)
        prediction = call(prediction["urls"]["get"], tok)

    if prediction["status"] != "succeeded":
        return f"{part.stem} : {prediction.get('error')}"

    output = prediction["output"]
    if isinstance(output, list):
        output = output[0]

    target = out_dir / f"{part.stem}.wav"
    with urllib.request.urlopen(output) as remote:
        target.write_bytes(remote.read())
    print(f"{target.parent.name}/{part.stem} → {target.stat().st_size / 1_000_000:.1f} Mo", flush=True)
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("lang", choices=sorted(LANGUAGE_CODES))
    parser.add_argument("--voice", default=VOICE)
    parser.add_argument("--only", nargs="*", type=int)
    args = parser.parse_args()

    parts_dir = ROOT / "src/content/tts" / args.lang
    out_dir = ROOT / "audio" / args.lang
    out_dir.mkdir(parents=True, exist_ok=True)

    parts = sorted(parts_dir.glob("part-*.txt"))
    if not parts:
        sys.exit(f"aucune partie pour {args.lang} — lancez d'abord scripts/build-tts.py")

    prompt = (parts_dir / "prompt.txt").read_text().strip()
    tok = token()
    language = LANGUAGE_CODES[args.lang]

    pending = [
        part
        for index, part in enumerate(parts, start=1)
        if (args.only and index in args.only)
        or (not args.only and not (out_dir / f"{part.stem}.wav").exists())
    ]
    print(f"{args.lang} : {len(pending)} partie(s) à générer sur {len(parts)}")

    # Replicate encaisse les appels concurrents ; on reste modeste sur le
    # parallélisme pour ne pas se faire limiter en plein milieu.
    with ThreadPoolExecutor(max_workers=4) as pool:
        failures = [
            message
            for message in pool.map(
                lambda p: generate(p, prompt, args.voice, language, tok, out_dir), pending
            )
            if message
        ]

    produced = sorted(out_dir.glob("part-*.wav"))
    print(f"\n{len(produced)}/{len(parts)} parties présentes dans {out_dir.relative_to(ROOT)}")
    for message in failures:
        print(f"échec : {message}")
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
