#!/usr/bin/env python3
"""Annote le script parlé pour Gemini TTS, puis le découpe en requêtes valides.

Gemini TTS n'accepte pas de SSML : uniquement des balises entre crochets, et
4 000 octets par champ. On produit donc un fichier annoté complet (lisible,
versionnable) et des parties prêtes à coller, chacune sous la limite.

    python3 scripts/build-tts.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src/content/recitation.en.txt"
ANNOTATED = ROOT / "src/content/tts/recitation.en.tts.txt"
PARTS_DIR = ROOT / "src/content/tts"

# Marge sous les 4 000 octets : le champ prompt est facturé séparément, mais on
# garde de l'air pour les balises et pour un éventuel préfixe ajouté à la main.
MAX_BYTES = 3800

# Frontières de phase : l'auditeur doit sentir qu'un bloc se termine.
LONG_PAUSE_BEFORE = [
    "Right. Let me start with the simplest version",
    "Now let me build it up properly.",
    "Let me move to the data.",
    "Now, availability.",
    "Let me talk about the API contract",
    "Next, where state lives.",
    "Now the states of the interface",
    "Let me go deep on the booking flow now",
    "Let me talk about idempotency properly",
    "Let me move on to real time.",
    "If you want a component to go deep on",
    "Let me move to hardening, starting with offline.",
    "On rendering strategy, I'd decide per surface.",
    "On performance. If you ask me",
    "Now, time zones,",
    "On security. Token storage first.",
    "On observability and debugging",
    "On proof of concept versus production",
    "If you push me on the backend side",
    "And to summarize where we landed.",
    "I have a few questions for you",
]

# Les phrases signature : celles qui doivent atterrir, donc respirer avant.
MEDIUM_PAUSE_BEFORE = [
    "So here's what I'm assuming.",
    "This works, and honestly, for a pilot",
    "The domain logic, what a booking is,",
    "The user clicks. The component doesn't call the API.",
    "I'd state that as a principle.",
    "These map to bounded contexts,",
    "So I wouldn't introduce hold-and-confirm by default.",
    "That's a product call more than an engineering one.",
    "Availability is not a stored attribute.",
    "And here's the principle that governs everything downstream.",
    "Which means the rejection path isn't an edge case",
    "So: I optimize for round-trips, not payload size.",
    "Put together: three of these codes are revenue opportunities",
    "The classic mistake is putting server data in Redux.",
    "Stale time per data type, not one global value.",
    "If I collapse those two into one you-can't-book-this state,",
    "So: a discriminated union rather than a handful of booleans.",
    "And the point I don't want to miss: optimism doesn't remove",
    "And that's exactly why it's a frontend responsibility.",
    "The link between the two topics",
    "Disabling the button is user experience, not correctness.",
    "For live availability, server-sent events.",
    "So: server-sent events work on any HTTP version,",
    "Two separate resources with two different cache lifetimes.",
    "The seat selector is the hardest thing in this app",
    "And here's the point I'd actually defend.",
    "If you challenge me with why not server-render everything,",
    "To put it in one sentence: generating recurring occurrences",
    "There's a nuance there that I think matters more than the answer.",
    "The argument I'd use in a planning meeting",
    "The point I'd close observability on is this.",
    "The criterion behind that line is this.",
    "The posture I'd state on this:",
    "But here's how I'd draw the boundary.",
]

# Énumérations orales : une courte respiration aide à compter les items.
SHORT_PAUSE_BEFORE = [
    "Second, which journey exactly?",
    "Third, is a member attached to one studio",
    "Fourth, are the schedules public and indexable?",
    "Second, eligibility.",
    "Third, typed errors,",
    "Fourth, time in the contract.",
    "Step two, the optimistic update.",
    "Step three, the request goes out",
    "Step four, success.",
    "Or step four, business failure,",
    "Or step four, network failure.",
    "And step five, in parallel,",
]


def annotate(text: str) -> str:
    for anchor in LONG_PAUSE_BEFORE:
        text = replace_once(text, anchor, "[long pause] ")
    for anchor in MEDIUM_PAUSE_BEFORE:
        text = replace_once(text, anchor, "[medium pause] ")
    for anchor in SHORT_PAUSE_BEFORE:
        text = replace_once(text, anchor, "[short pause] ")
    return text


def replace_once(text: str, anchor: str, tag: str) -> str:
    if anchor not in text:
        raise SystemExit(f"ancre introuvable, le script a changé : {anchor!r}")
    return text.replace(anchor, tag + anchor, 1)


def split(text: str) -> list[str]:
    """Découpe aux frontières de paragraphe, jamais au milieu d'une phrase."""
    parts: list[str] = []
    current = ""
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if len(para.encode()) > MAX_BYTES:
            raise SystemExit(f"paragraphe trop long pour une requête : {para[:60]!r}")
        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate.encode()) > MAX_BYTES:
            parts.append(current)
            current = para
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts


def main() -> None:
    annotated = annotate(SOURCE.read_text())
    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    ANNOTATED.write_text(annotated)

    for stale in PARTS_DIR.glob("part-*.txt"):
        stale.unlink()

    parts = split(annotated)
    for index, part in enumerate(parts, start=1):
        (PARTS_DIR / f"part-{index:02d}.txt").write_text(part + "\n")

    largest = max(len(p.encode()) for p in parts)
    print(f"{len(parts)} parties, la plus grosse fait {largest} octets (limite 4000)")


if __name__ == "__main__":
    main()
