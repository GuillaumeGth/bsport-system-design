// Généré par scripts/build-chapters.py — ne pas éditer à la main.
// Les offsets sont mesurés sur les fichiers audio produits.

import type { Locale } from '../i18n/strings'

export interface Chapter {
  index: number
  /** Seconde de début dans le fichier complet. */
  start: number
  title: string
  /** Sections du document couvertes, pour renvoyer vers le texte. */
  sections: string[]
}

export const CHAPTERS: Record<Locale, Chapter[]> = {
  en: [
    { index: 1, start: 0.0, title: 'Framing and clarifying', sections: ['3', '4'] },
    { index: 2, start: 235.6, title: 'Volumetrics, assumptions, the V1', sections: ['4', '5'] },
    { index: 3, start: 496.3, title: 'Layers and the booking data flow', sections: ['6', '7'] },
    { index: 4, start: 765.9, title: 'Components, library, domain model', sections: ['7', '8'] },
    { index: 5, start: 994.8, title: 'Occurrences, exceptions, lifecycle', sections: ['8'] },
    { index: 6, start: 1233.5, title: 'Hold, waitlist, availability', sections: ['8', '9'] },
    { index: 7, start: 1446.5, title: 'Three states, round-trips, eligibility', sections: ['9', '10'] },
    { index: 8, start: 1690.8, title: 'Typed errors and where state lives', sections: ['10', '11'] },
    { index: 9, start: 1934.2, title: 'URL, fetching library, cache', sections: ['11'] },
    { index: 10, start: 2190.1, title: 'Freshness, UI states, INELIGIBLE', sections: ['11', '12'] },
    { index: 11, start: 2452.1, title: 'State machine and booking flow', sections: ['12', '13'] },
    { index: 12, start: 2699.0, title: 'Optimistic or pessimistic, idempotency', sections: ['13', '14'] },
    { index: 13, start: 2952.9, title: 'Retry, double-submit, transport', sections: ['14', '15'] },
    { index: 14, start: 3224.8, title: 'SSE, HTTP versions, deltas', sections: ['15'] },
    { index: 15, start: 3465.9, title: 'Reconciliation and the SeatSelector', sections: ['15', '16'] },
    { index: 16, start: 3701.6, title: 'Offline: action queue, service worker', sections: ['17'] },
    { index: 17, start: 3959.2, title: 'Rendering, theming, performance', sections: ['18', '19'] },
    { index: 18, start: 4220.9, title: 'Bundle, time zones, i18n', sections: ['19', '20'] },
    { index: 19, start: 4453.6, title: 'Security, accessibility, observability', sections: ['20', '21'] },
    { index: 20, start: 4687.5, title: 'Business metrics, POC versus production', sections: ['21', '22'] },
    { index: 21, start: 4923.8, title: 'Backend boundary, summary, questions', sections: ['23', '24'] },
  ],
  fr: [
    { index: 1, start: 0.0, title: 'Cadrage et clarification', sections: ['3', '4'] },
    { index: 2, start: 193.5, title: 'Contraintes, volumétrie, hypothèses', sections: ['4'] },
    { index: 3, start: 392.8, title: 'La version simple et les couches', sections: ['5', '6'] },
    { index: 4, start: 612.9, title: 'Le flux d\'une réservation, les composants', sections: ['6', '7'] },
    { index: 5, start: 780.4, title: 'Bibliothèque de composants, le domaine', sections: ['7', '8'] },
    { index: 6, start: 984.0, title: 'Catalogue, planification, cycle de vie', sections: ['8'] },
    { index: 7, start: 1208.3, title: 'Verrou, liste d\'attente, disponibilité', sections: ['8', '9'] },
    { index: 8, start: 1405.2, title: 'Compteur, trois états, allers-retours', sections: ['9', '10'] },
    { index: 9, start: 1610.7, title: 'Éligibilité, erreurs typées, le temps', sections: ['10'] },
    { index: 10, start: 1826.1, title: 'Où vit l\'état, l\'URL, les librairies', sections: ['11'] },
    { index: 11, start: 2045.3, title: 'Cache normalisé, fraîcheur, états', sections: ['11', '12'] },
    { index: 12, start: 2251.7, title: 'États techniques et métier, INELIGIBLE', sections: ['12'] },
    { index: 13, start: 2472.1, title: 'Machine à états, le tunnel, arbitrage', sections: ['12', '13'] },
    { index: 14, start: 2696.9, title: 'Optimiste, invalidation, idempotence', sections: ['13', '14'] },
    { index: 15, start: 2905.0, title: 'La clé, les retries, le double envoi', sections: ['14'] },
    { index: 16, start: 3115.7, title: 'Les quatre couches, le transport', sections: ['14', '15'] },
    { index: 17, start: 3330.7, title: 'Versions HTTP, delta, réconciliation', sections: ['15'] },
    { index: 18, start: 3529.7, title: 'Le sélecteur de place', sections: ['16'] },
    { index: 19, start: 3743.7, title: 'Hors ligne, service worker', sections: ['17'] },
    { index: 20, start: 3974.6, title: 'Rendu serveur, theming, performance', sections: ['18', '19'] },
    { index: 21, start: 4155.8, title: 'Métriques, bundle, fuseaux horaires', sections: ['19', '20'] },
    { index: 22, start: 4350.7, title: 'Fuseaux, internationalisation, sécurité', sections: ['20'] },
    { index: 23, start: 4550.9, title: 'Accessibilité, observabilité, POC', sections: ['21', '22'] },
    { index: 24, start: 4754.7, title: 'Impact métier, la frontière backend', sections: ['22', '23'] },
    { index: 25, start: 4929.0, title: 'Le résumé et les questions', sections: ['24'] },
  ],
}
