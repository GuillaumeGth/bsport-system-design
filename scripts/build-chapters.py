#!/usr/bin/env python3
"""Génère src/lib/chapters.ts depuis la durée réelle des parties audio.

Les offsets sont mesurés sur les WAV plutôt que calculés à la main : si on
regénère une partie, les repères du lecteur suivent automatiquement.

    python3 scripts/build-chapters.py
"""

from __future__ import annotations

import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
TARGET = ROOT / "src/lib/chapters.ts"
GAP_SECONDS = 0.7

# Titre et sections du document couvertes, dans l'ordre des parties.
TITLES: dict[str, list[tuple[str, list[str]]]] = {
    "en": [
        ("Framing and clarifying", ["3", "4"]),
        ("Volumetrics, assumptions, the V1", ["4", "5"]),
        ("Layers and the booking data flow", ["6", "7"]),
        ("Components, library, domain model", ["7", "8"]),
        ("Occurrences, exceptions, lifecycle", ["8"]),
        ("Hold, waitlist, availability", ["8", "9"]),
        ("Three states, round-trips, eligibility", ["9", "10"]),
        ("Typed errors and where state lives", ["10", "11"]),
        ("URL, fetching library, cache", ["11"]),
        ("Freshness, UI states, INELIGIBLE", ["11", "12"]),
        ("State machine and booking flow", ["12", "13"]),
        ("Optimistic or pessimistic, idempotency", ["13", "14"]),
        ("Retry, double-submit, transport", ["14", "15"]),
        ("SSE, HTTP versions, deltas", ["15"]),
        ("Reconciliation and the SeatSelector", ["15", "16"]),
        ("Offline: action queue, service worker", ["17"]),
        ("Rendering, theming, performance", ["18", "19"]),
        ("Bundle, time zones, i18n", ["19", "20"]),
        ("Security, accessibility, observability", ["20", "21"]),
        ("Business metrics, POC versus production", ["21", "22"]),
        ("Backend boundary, summary, questions", ["23", "24"]),
    ],
    "fr": [
        ("Cadrage et clarification", ["3", "4"]),
        ("Contraintes, volumétrie, hypothèses", ["4"]),
        ("La version simple et les couches", ["5", "6"]),
        ("Le flux d'une réservation, les composants", ["6", "7"]),
        ("Bibliothèque de composants, le domaine", ["7", "8"]),
        ("Catalogue, planification, cycle de vie", ["8"]),
        ("Verrou, liste d'attente, disponibilité", ["8", "9"]),
        ("Compteur, trois états, allers-retours", ["9", "10"]),
        ("Éligibilité, erreurs typées, le temps", ["10"]),
        ("Où vit l'état, l'URL, les librairies", ["11"]),
        ("Cache normalisé, fraîcheur, états", ["11", "12"]),
        ("États techniques et métier, INELIGIBLE", ["12"]),
        ("Machine à états, le tunnel, arbitrage", ["12", "13"]),
        ("Optimiste, invalidation, idempotence", ["13", "14"]),
        ("La clé, les retries, le double envoi", ["14"]),
        ("Les quatre couches, le transport", ["14", "15"]),
        ("Versions HTTP, delta, réconciliation", ["15"]),
        ("Le sélecteur de place", ["16"]),
        ("Hors ligne, service worker", ["17"]),
        ("Rendu serveur, theming, performance", ["18", "19"]),
        ("Métriques, bundle, fuseaux horaires", ["19", "20"]),
        ("Fuseaux, internationalisation, sécurité", ["20"]),
        ("Accessibilité, observabilité, POC", ["21", "22"]),
        ("Impact métier, la frontière backend", ["22", "23"]),
        ("Le résumé et les questions", ["24"]),
    ],
}


def offsets(lang: str) -> list[float]:
    parts = sorted((AUDIO / lang).glob("part-*.wav"))
    result, cursor = [], 0.0
    for part in parts:
        with wave.open(str(part)) as handle:
            result.append(round(cursor, 1))
            cursor += handle.getnframes() / handle.getframerate() + GAP_SECONDS
    return result


def main() -> None:
    data: dict[str, list[tuple[float, str, list[str]]]] = {}
    for lang, titles in TITLES.items():
        starts = offsets(lang)
        if len(starts) != len(titles):
            raise SystemExit(
                f"{lang} : {len(starts)} parties audio pour {len(titles)} titres — "
                "générez l'audio manquant ou ajustez TITLES."
            )
        data[lang] = [(start, title, sections) for start, (title, sections) in zip(starts, titles)]

    lines = [
        "// Généré par scripts/build-chapters.py — ne pas éditer à la main.",
        "// Les offsets sont mesurés sur les fichiers audio produits.",
        "",
        "import type { Locale } from '../i18n/strings'",
        "",
        "export interface Chapter {",
        "  index: number",
        "  /** Seconde de début dans le fichier complet. */",
        "  start: number",
        "  title: string",
        "  /** Sections du document couvertes, pour renvoyer vers le texte. */",
        "  sections: string[]",
        "}",
        "",
        "export const CHAPTERS: Record<Locale, Chapter[]> = {",
    ]
    for lang, rows in data.items():
        lines.append(f"  {lang}: [")
        for index, (start, title, sections) in enumerate(rows, start=1):
            joined = ", ".join(f"'{section}'" for section in sections)
            escaped = title.replace("\\", "\\\\").replace("'", "\\'")
            lines.append(
                f"    {{ index: {index}, start: {start}, title: '{escaped}', sections: [{joined}] }},"
            )
        lines.append("  ],")
    lines += ["}", ""]

    TARGET.write_text("\n".join(lines))
    for lang, rows in data.items():
        print(f"{lang} : {len(rows)} chapitres, dernier à {rows[-1][0] / 60:.0f} min")


if __name__ == "__main__":
    main()
