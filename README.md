# bsport system design

Une app de lecture pour le déroulé d'entretien **Frontend System Design @ bsport** : le document de 1 300 lignes découpé en 25 sections navigables, repérées sur les 90 minutes de l'entretien. Disponible en français et en anglais.

## Démarrer

```bash
npm install
npm run dev
```

> Vite 7 est épinglé parce que Node 22.9 est installé ici. Vite 8 exige Node ≥ 22.12 et son binaire natif `rolldown` ne s'installe pas en dessous. Après un passage à Node 22.12+, `npm i -D vite@latest @vitejs/plugin-react@latest` fonctionne.

## Ce que fait l'app

- **Déroulé** — les 25 sections une par une, avec le numéro de section, la partie, la phase de l'entretien, la plage de minutes et le temps de lecture. Le premier paragraphe sert de chapô.
- **Le rail des 90 minutes** — l'axe vertical à gauche (horizontal sur mobile). La taille de chaque segment est proportionnelle à sa durée réelle : le budget temps se lit directement. Il indique la phase de la section lue, et sert de navigation.
- **Chrono de répétition** — bouton « Répéter » : il compte les 90 minutes et affiche la phase où tu devrais être, avec un curseur qui descend le rail.
- **Phrases** — les 58 formulations à dire à voix haute, extraites automatiquement du document, filtrables par phase, avec copie. Une seule langue à la fois, celle du sélecteur : en anglais la formulation exacte à prononcer, en français sa traduction.
- **10 essentiels** — la checklist de clôture, cochable, l'état est conservé localement.
- **Recherche ⌘K** — sur tout le corps du document et sur les phrases, insensible aux accents.
- **FR / EN** — bascule complète : interface et document. Thème clair/sombre.

## Structure

```
src/
  content/deroule.fr.md     source française (copie de bsport-deroule-complet.md)
  content/deroule.en.md     traduction anglaise, même structure
  lib/markdown.ts           parseur : parties, sections, sous-titres, phrases, essentiels
  lib/phases.ts             les 8 phases des 90 minutes (§25.1 du document)
  lib/doc.ts                chargement et mémoïsation par langue
  i18n/strings.ts           chaînes d'interface FR/EN
  i18n/lineTranslations.ts  traduction française des 59 phrases à prononcer
  components/               une vue = un composant + son CSS
  styles/                   tokens, base, rendu du markdown
```

Le document markdown reste la source de vérité : le parseur en dérive la navigation, les phrases et la checklist. Pour mettre le contenu à jour, on édite le `.md`, pas les composants.

Les deux versions doivent garder la même structure (25 sections `## N.`, 6 parties `# PARTIE` / `# PART`, phrases citées en `> *"…"*`) — c'est ce que le parseur reconnaît dans les deux langues.

## Traduction anglaise

`deroule.en.md` est une traduction générée. Sa structure a été vérifiée (25 sections, 6 parties, 59 citations, comme la source) mais le texte n'a pas été relu ligne à ligne.

Les phrases à prononcer restent **verbatim en anglais** dans les deux versions du markdown : ce sont les formulations de l'entretien, et le document anglais doit les garder telles quelles. Leur traduction française vit à part, dans `i18n/lineTranslations.ts`, indexée par une clé stable dérivée du texte anglais (`lineKey`). Si une phrase est reformulée dans le markdown, la vue Phrases retombe sur l'anglais — rien ne casse.
