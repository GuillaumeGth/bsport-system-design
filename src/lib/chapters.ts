// Généré par scripts/build-chapters.py — ne pas éditer à la main.
// Les offsets sont mesurés sur les fichiers audio produits.

import type { Locale } from '../i18n/strings'

export interface Chapter {
  index: number
  /** Seconde de début sur la frise complète. */
  start: number
  /** Durée du chapitre, en secondes. */
  duration: number
  title: string
  /** Sections du document couvertes, pour renvoyer vers le texte. */
  sections: string[]
}

export const CHAPTERS: Record<Locale, Chapter[]> = {
  en: [
    { index: 1, start: 0.0, duration: 234.9, title: 'Framing and clarifying', sections: ['3', '4'] },
    { index: 2, start: 235.6, duration: 260.0, title: 'Volumetrics, assumptions, the V1', sections: ['4', '5'] },
    { index: 3, start: 496.3, duration: 268.9, title: 'Layers and the booking data flow', sections: ['6', '7'] },
    { index: 4, start: 765.9, duration: 228.2, title: 'Components, library, domain model', sections: ['7', '8'] },
    { index: 5, start: 994.8, duration: 238.0, title: 'Occurrences, exceptions, lifecycle', sections: ['8'] },
    { index: 6, start: 1233.5, duration: 212.3, title: 'Hold, waitlist, availability', sections: ['8', '9'] },
    { index: 7, start: 1446.5, duration: 243.6, title: 'Three states, round-trips, eligibility', sections: ['9', '10'] },
    { index: 8, start: 1690.8, duration: 242.7, title: 'Typed errors and where state lives', sections: ['10', '11'] },
    { index: 9, start: 1934.2, duration: 255.2, title: 'URL, fetching library, cache', sections: ['11'] },
    { index: 10, start: 2190.1, duration: 261.3, title: 'Freshness, UI states, INELIGIBLE', sections: ['11', '12'] },
    { index: 11, start: 2452.1, duration: 246.2, title: 'State machine and booking flow', sections: ['12', '13'] },
    { index: 12, start: 2699.0, duration: 253.2, title: 'Optimistic or pessimistic, idempotency', sections: ['13', '14'] },
    { index: 13, start: 2952.9, duration: 271.2, title: 'Retry, double-submit, transport', sections: ['14', '15'] },
    { index: 14, start: 3224.8, duration: 240.4, title: 'SSE, HTTP versions, deltas', sections: ['15'] },
    { index: 15, start: 3465.9, duration: 235.0, title: 'Reconciliation and the SeatSelector', sections: ['15', '16'] },
    { index: 16, start: 3701.6, duration: 256.9, title: 'Offline: action queue, service worker', sections: ['17'] },
    { index: 17, start: 3959.2, duration: 261.0, title: 'Rendering, theming, performance', sections: ['18', '19'] },
    { index: 18, start: 4220.9, duration: 232.0, title: 'Bundle, time zones, i18n', sections: ['19', '20'] },
    { index: 19, start: 4453.6, duration: 233.2, title: 'Security, accessibility, observability', sections: ['20', '21'] },
    { index: 20, start: 4687.5, duration: 235.6, title: 'Business metrics, POC versus production', sections: ['21', '22'] },
    { index: 21, start: 4923.8, duration: 160.7, title: 'Backend boundary, summary, questions', sections: ['23', '24'] },
  ],
  fr: [
    { index: 1, start: 0.0, duration: 192.8, title: 'Cadrage et clarification', sections: ['3', '4'] },
    { index: 2, start: 193.5, duration: 198.5, title: 'Contraintes, volumétrie, hypothèses', sections: ['4'] },
    { index: 3, start: 392.8, duration: 219.4, title: 'La version simple et les couches', sections: ['5', '6'] },
    { index: 4, start: 612.9, duration: 166.8, title: 'Le flux d\'une réservation, les composants', sections: ['6', '7'] },
    { index: 5, start: 780.4, duration: 203.0, title: 'Bibliothèque de composants, le domaine', sections: ['7', '8'] },
    { index: 6, start: 984.0, duration: 223.6, title: 'Catalogue, planification, cycle de vie', sections: ['8'] },
    { index: 7, start: 1208.3, duration: 196.2, title: 'Verrou, liste d\'attente, disponibilité', sections: ['8', '9'] },
    { index: 8, start: 1405.2, duration: 204.8, title: 'Compteur, trois états, allers-retours', sections: ['9', '10'] },
    { index: 9, start: 1610.7, duration: 214.7, title: 'Éligibilité, erreurs typées, le temps', sections: ['10'] },
    { index: 10, start: 1826.1, duration: 218.4, title: 'Où vit l\'état, l\'URL, les librairies', sections: ['11'] },
    { index: 11, start: 2045.3, duration: 205.7, title: 'Cache normalisé, fraîcheur, états', sections: ['11', '12'] },
    { index: 12, start: 2251.7, duration: 219.8, title: 'États techniques et métier, INELIGIBLE', sections: ['12'] },
    { index: 13, start: 2472.1, duration: 224.1, title: 'Machine à états, le tunnel, arbitrage', sections: ['12', '13'] },
    { index: 14, start: 2696.9, duration: 207.3, title: 'Optimiste, invalidation, idempotence', sections: ['13', '14'] },
    { index: 15, start: 2905.0, duration: 210.1, title: 'La clé, les retries, le double envoi', sections: ['14'] },
    { index: 16, start: 3115.7, duration: 214.3, title: 'Les quatre couches, le transport', sections: ['14', '15'] },
    { index: 17, start: 3330.7, duration: 198.2, title: 'Versions HTTP, delta, réconciliation', sections: ['15'] },
    { index: 18, start: 3529.7, duration: 213.3, title: 'Le sélecteur de place', sections: ['16'] },
    { index: 19, start: 3743.7, duration: 230.2, title: 'Hors ligne, service worker', sections: ['17'] },
    { index: 20, start: 3974.6, duration: 180.5, title: 'Rendu serveur, theming, performance', sections: ['18', '19'] },
    { index: 21, start: 4155.8, duration: 194.1, title: 'Métriques, bundle, fuseaux horaires', sections: ['19', '20'] },
    { index: 22, start: 4350.7, duration: 199.6, title: 'Fuseaux, internationalisation, sécurité', sections: ['20'] },
    { index: 23, start: 4550.9, duration: 203.1, title: 'Accessibilité, observabilité, POC', sections: ['21', '22'] },
    { index: 24, start: 4754.7, duration: 173.5, title: 'Impact métier, la frontière backend', sections: ['22', '23'] },
    { index: 25, start: 4929.0, duration: 107.6, title: 'Le résumé et les questions', sections: ['24'] },
  ],
}
