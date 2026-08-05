#!/usr/bin/env python3
"""Annote les scripts parlés pour Gemini TTS, puis les découpe en requêtes.

Gemini TTS n'accepte pas de SSML : uniquement des balises entre crochets, et
4 000 octets par champ. On produit donc, par langue, un fichier annoté complet
(lisible, versionnable) et des parties prêtes à envoyer.

    python3 scripts/build-tts.py          # les deux langues
    python3 scripts/build-tts.py fr       # une seule
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src/content"

# Marge sous les 4 000 octets : de l'air pour les balises et pour un préfixe
# ajouté à la main lors d'un essai.
MAX_BYTES = 3800

# Frontières de phase : l'auditeur doit sentir qu'un bloc se termine.
LONG_PAUSE = {
    "en": [
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
    ],
    "fr": [
        "Bien. Laissez-moi commencer par la version la plus simple",
        "Construisons maintenant correctement.",
        "Passons aux données.",
        "Venons-en à la disponibilité.",
        "Parlons du contrat d'API,",
        "Ensuite, où vit l'état.",
        "Passons aux états de l'interface,",
        "Creusons maintenant le tunnel de réservation,",
        "Parlons correctement d'idempotence,",
        "Passons au temps réel.",
        "Si vous voulez un composant à creuser,",
        "Passons au durcissement,",
        "Sur la stratégie de rendu, je déciderais par surface.",
        "Sur la performance. Si vous me demandez",
        "Venons-en aux fuseaux horaires,",
        "Sur la sécurité. Le stockage des jetons d'abord.",
        "Sur l'observabilité et le débogage,",
        "Sur la preuve de concept face à la production,",
        "Si vous me poussez côté backend,",
        "Et pour résumer où nous en sommes arrivés.",
        "J'ai quelques questions pour vous,",
    ],
}

# Les phrases signature : celles qui doivent atterrir, donc respirer avant.
MEDIUM_PAUSE = {
    "en": [
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
    ],
    "fr": [
        "Voilà donc ce que je suppose.",
        "Ça fonctionne, et honnêtement, pour un pilote",
        "La logique de domaine, ce qu'est une réservation,",
        "L'utilisateur clique. Le composant n'appelle pas l'API.",
        "Je l'énoncerais comme un principe.",
        "Ces quatre-là correspondent à des contextes délimités,",
        "Je n'introduirais donc pas le verrou puis confirmation",
        "C'est une décision produit plus qu'une décision d'ingénierie.",
        "La disponibilité n'est pas un attribut stocké.",
        "Et voici le principe qui gouverne tout le reste.",
        "Ce qui veut dire que le chemin de refus n'est pas un cas limite",
        "Donc : j'optimise les allers-retours,",
        "En résumé : trois de ces codes sont des opportunités de vente",
        "L'erreur classique, c'est de mettre les données serveur dans Redux.",
        "Un temps de péremption par type de donnée,",
        "Si je fusionne ces deux cas en un seul état",
        "Donc : une union discriminée plutôt qu'une poignée de booléens.",
        "Et le point que je ne veux pas rater : l'optimisme ne supprime pas",
        "Et c'est exactement pour ça que c'est une responsabilité frontend.",
        "Le lien entre les deux sujets, je l'énoncerais",
        "Désactiver le bouton, c'est de l'expérience utilisateur,",
        "Pour la disponibilité en direct, le flux d'événements serveur.",
        "Donc : le flux d'événements fonctionne sur toutes les versions",
        "Deux ressources séparées avec deux durées de cache différentes.",
        "Le sélecteur de place est la chose la plus difficile",
        "Et voici le point que je défendrais vraiment.",
        "Si vous me challengez avec pourquoi pas du rendu serveur partout,",
        "En une phrase : générer les occurrences récurrentes",
        "Il y a là une nuance qui compte plus que la réponse elle-même.",
        "L'argument que j'utiliserais en réunion de planification",
        "Le point sur lequel je conclurais l'observabilité est celui-ci.",
        "Le critère derrière cette frontière est le suivant.",
        "La posture que j'énoncerais là-dessus :",
        "Mais voici comment je trace la frontière.",
    ],
}

# Énumérations orales : une courte respiration aide à compter les items.
SHORT_PAUSE = {
    "en": [
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
    ],
    "fr": [
        "Ensuite, quel parcours exactement ?",
        "Troisième question : un membre est rattaché",
        "Quatrième question : les plannings sont-ils publics",
        "Deuxièmement, l'éligibilité.",
        "Troisièmement, les erreurs typées,",
        "Quatrièmement, le temps dans le contrat.",
        "Étape deux, la mise à jour optimiste.",
        "Étape trois, la requête part",
        "Étape quatre, succès.",
        "Ou étape quatre, échec métier,",
        "Ou étape quatre, échec réseau.",
        "Et étape cinq, en parallèle,",
    ],
}


def annotate(text: str, lang: str) -> str:
    for anchor in LONG_PAUSE[lang]:
        text = replace_once(text, anchor, "[long pause] ")
    for anchor in MEDIUM_PAUSE[lang]:
        text = replace_once(text, anchor, "[medium pause] ")
    for anchor in SHORT_PAUSE[lang]:
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


def build(lang: str) -> None:
    source = CONTENT / f"recitation.{lang}.txt"
    out_dir = CONTENT / "tts" / lang
    out_dir.mkdir(parents=True, exist_ok=True)

    annotated = annotate(source.read_text(), lang)
    (out_dir / f"recitation.{lang}.tts.txt").write_text(annotated)

    for stale in out_dir.glob("part-*.txt"):
        stale.unlink()

    parts = split(annotated)
    for index, part in enumerate(parts, start=1):
        (out_dir / f"part-{index:02d}.txt").write_text(part + "\n")

    largest = max(len(p.encode()) for p in parts)
    print(f"{lang} : {len(parts)} parties, la plus grosse fait {largest} octets")


def main() -> None:
    langs = sys.argv[1:] or ["en", "fr"]
    for lang in langs:
        if lang not in LONG_PAUSE:
            raise SystemExit(f"langue inconnue : {lang}")
        build(lang)


if __name__ == "__main__":
    main()
