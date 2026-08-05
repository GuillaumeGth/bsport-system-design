# Antisèche — Frontend System Design @ bsport

*À garder sous les yeux. Les phrases en italique sont à prononcer telles quelles.*

---

## Le minutage

| Temps | Ce que tu fais |
|---|---|
| 0–10 | Annoncer le plan · clarifier · hypothèses · volumétrie |
| 10–15 | V1 simple **+ ses quatre failles** |
| 15–25 | Couches · composants · flux d'une réservation |
| 25–35 | Modèle · contrat d'API · erreurs typées · état client |
| 35–50 | **Deep-dive 1** — réservation, optimiste, idempotence, retry |
| 50–60 | **Deep-dive 2** — temps réel, réconciliation, SeatSelector |
| 60–80 | Offline · rendu · perf · a11y/i18n/sécu · observabilité |
| 80–90 | POC vs prod · résumé · questions |

**Si tu débordes :** *"I have about fifteen minutes left. I'd rather go deep on one more thing than skim three — would you prefer real-time reconciliation, or how I'd monitor this in production?"*

---

## 0–10 · Cadrer

**Ouvrir :** *"Let me structure this: I'll clarify requirements and assumptions, then sketch a high-level architecture, go into the data model and the API contract, then deep-dive on whichever parts you find most interesting — I suspect the booking flow and real-time availability. Does that work?"*

**Questions — poser + dire pourquoi + dire ce que ça change**

- **Surface ?** app membre / back-office → *"one is consumer-facing and mobile-first, the other is a working tool used on desktop all day"*
- **Parcours ?** → prends **consulter + réserver + annuler**, waitlist et places en raffinement
- **Un studio ou plusieurs ?** → contexte tenant fixe ou variable (cache, navigation)
- **Plannings indexables ?** → besoin SEO → contrainte de rendu
- **Temps réel ?** et quelle latence → refetch périodique **ou** canal poussé. Ne pas supposer
- **Conditions réseau ?** → *les salles sont en sous-sol* → justifie round-trips + offline
- **Appareils ?** → Android d'entrée de gamme → virtualisation = confort ou nécessité
- **A11y ?** → European Accessibility Act + public wellness surreprésenté
- **Langues / membres qui voyagent ?** → fuseaux horaires
- **Offline ?** → lecture = cache · écriture = file + conflits + **ce qu'on promet**

**Volumétrie** — ~20 cartes/jour (⇒ **pas de virtualisation**) · lecture ≫ écriture · charge **en pics** à l'ouverture des résas (⇒ conflits probables, l'optimiste ment)

**Clore :** *"Here's what I'm assuming: member-facing app, web and mobile, one studio at a time, roughly twenty classes visible, real-time availability matters, the network is unreliable in venues, and there's money in the flow through credit packs. Tell me if any of that is wrong — those assumptions drive my rendering strategy, my caching, and how far I go on offline."*

**B2B2C** — le studio paie, le membre utilise. Tension visible sur waitlist et no-show → **demander**, ne pas trancher seul.

---

## 10–15 · La V1 et ses quatre failles

*"Let me start with the simplest version that actually works, then I'll show you where it breaks. I find that easier to challenge than a fully-loaded architecture."*

**V1 :** client → REST, fetch sessions, clic Réserver → requête → maj écran. Loading/erreur/vide. C'est tout.

*"This works, and for a pilot with one studio it might be enough. But four things will break. First, availability goes stale the moment it's rendered. Second, every click waits for a round-trip, which on a bad connection feels broken. Third, if the network drops mid-request, we don't know whether the booking happened, and a retry could double-book. Fourth, nothing tells us when it's failing in production."*

→ annonce **temps réel · latence perçue · idempotence · observabilité**

---

## 15–25 · Architecture

**Couches** (basse ignore la haute) : UI → état UI local → **état serveur / cache** → transport (HTTP, canal, file offline) → transverses (auth, i18n, theming, flags, télémétrie)

**Clean archi côté client :** *"The domain logic — what a booking is, what states it can be in, what makes a session bookable — shouldn't know whether data arrives over REST, GraphQL or a WebSocket. That's dependency inversion applied to the client."* → permet le **partage web/mobile** : partager l'invariant, spécialiser le contextuel.

**Le flux (à raconter d'un trait) :** *"The user clicks. The component doesn't call the API — it dispatches a mutation. The mutation layer generates an idempotency key, applies an optimistic update, and fires the request. On success it writes the response into the cache and invalidates related keys. On a business failure it rolls back and surfaces a typed reason. On a network failure it retries with the same key. Meanwhile the real-time channel may push an update for that same session, and reconciliation has to apply it without clobbering the in-flight optimistic change."*

**Composants :** SchedulePage · Filters · List · **ClassSlotCard** · BookingFlow · **SeatSelector** · WaitlistButton · MembershipBadge
- conteneur/présentationnel = **stabilité** (l'API change, la carte ne bouge pas)
- 25 props booléennes = alarme → **composition**
- **Ivalua** : contrats · points d'extension déclarés · versioning/migration · DX pour non-développeurs
- *"The first lever on re-renders isn't memoization, it's state structure."*

---

## 25–35 · Données & contrat

**4 contextes :** Catalog (qui/quoi/où) · Scheduling (quand) · Booking (qui vient) · Billing (qui paie)
→ *"a screen usually spans several of them — that's where waterfalls and over-fetching come from"*

**Scheduling :** ClassTemplate (règle) vs **Session** (occurrence datée, identité stable) → **matérialiser sur horizon glissant**. Règle qui change = *"the edit-this-event / all-events / all-following problem from Google Calendar"* → le back-office **demande**, l'app membre **notifie**.

**Hold :** *"I wouldn't introduce hold-and-confirm by default. A credit-pack booking doesn't need it. I'd add it exactly when a card payment sits between the intent and the confirmation."*

**Disponibilité = projection** : `capacité − occupations`. Pas de champ sur le Seat (le vélo 12 est pris à 18h, libre à 19h). **Trois états : FREE · HELD · BOOKED.** Compteur **matérialisé** (ratio lecture/écriture).

> *"Whatever number the server gives me for spots left, it's a hint, not a guarantee. The only moment truth exists is the response to the booking request."*
> *"Which means the rejection path isn't an edge case — it's a nominal path I design from the start."*

**Contrat, 4 arguments :**
1. **Round-trips** — *"I optimize for round-trips, not payload size. Bandwidth is abundant, latency isn't."* (3 sauts = 1 s d'écran vide)
2. **Éligibilité côté serveur** + raison typée — *"duplicating a business rule across three clients guarantees they drift"*. Offline : *"last known eligibility, explicitly marked as unconfirmed, rather than lying confidently"*
3. **Erreurs typées** ↓
4. **Temps** — UTC + timezone du studio dans la donnée

| Code | Interface | Enjeu |
|---|---|---|
| `SESSION_FULL` | rollback + waitlist | rétention |
| `SEAT_TAKEN` | retour au sélecteur | expérience |
| `ALREADY_BOOKED` | **pas une erreur** — montrer la résa | ne pas alarmer |
| `NO_CREDITS_LEFT` | proposer un pack | **revenu** |
| `NOT_COVERED_BY_PLAN` | proposer un upgrade | **revenu** |
| `BOOKING_WINDOW_CLOSED` | « ouvre le 3 août à 9h » + rappel | rétention |
| `PAYMENT_FAILED` | changer de moyen | **revenu** |

*"Three of these are revenue opportunities rather than failures. And ALREADY_BOOKED isn't an error at all — it's usually a successful retry."*

**État, 4 familles :** serveur · UI local · client global · **URL**
- *"The classic mistake is putting server data in Redux — it has a completely different lifecycle."*
- URL : date + filtres. **Piège : le bouton retour Android sort de l'app si la modale ne touche pas l'URL.**
- **Librairie :** Redux déjà là → RTK Query · greenfield → TanStack Query · jamais adopter Redux pour RTK Query. *"The decision is driven by mutation complexity, not reads."*
- Cache **document** + invalidation par préfixe `['sessions', studioId, date]`. Normalisé (Apollo) = si l'app devient un graphe.
- **Fraîcheur par type**, pas de valeur globale. Dispo = 0 + canal.

**États UI** — technique : idle/loading(**skeleton**)/success/**empty ≠ error**/error/refetching(**jamais re-skeleton**)/optimistic/offline
**États métier** — BOOKABLE · ALMOST_FULL · FULL · WAITLISTED · BOOKED · PENDING · **INELIGIBLE** · BOOKING_NOT_OPEN · CANCELLATION_LOCKED · CANCELLED · PAST

> **INELIGIBLE ≠ FULL** — *"If I collapse those two into one 'you can't book this' state, I've turned a sales opportunity into a dead end. And that's the studio's revenue, not just a UX detail."*

**Certains états périment seuls** (17h59 gratuit / 18h01 non) → **revérifier au moment de l'action**.

**Machine à états :** union discriminée — *"five booleans give thirty-two combinations, most impossible but still representable, so a bug can reach them"*

---

## 35–50 · Deep-dive 1 — la réservation

**1** clic → **clé au clic** · **2** snapshot + décrément optimiste · **3** requête avec la clé · **4a** succès → écrire + invalider · **4b** échec métier → rollback **expliqué** · **4c** réseau → retry **même clé** · **5** event temps réel sans écraser la mutation en vol

**Optimiste par action :** annuler ✓ · waitlist ✓ · cours à moitié vide ✓ · **dernière place → prudent** · payer → **pessimiste**
> *"Optimism doesn't remove failure handling — it makes failure more visible. So the rollback has to explain itself: 'that spot was just taken, here are three alternatives', never a silent revert."*

**Invalidation :** les deux — écriture optimiste, réponse au succès, **puis invalidation de fond**. Garder le snapshot.

**Idempotence** — la clé naît **au clic**, pas à la requête :
> *"The key is tied to the user's intention, not to the HTTP request. Only the client knows that this retry is a continuation of the same click. The server can't infer it."*
- couvre : double-clic · retry après timeout · resync offline
- **nouvelle intention = nouvelle clé** (full → waitlist → place libérée → rebook)
- la clé couvre **résa + paiement**, sinon double débit

**Retry :** timeout/5xx/429 ✓ (backoff + **jitter** + borne + timeout) · 4xx métier ✗ · 401 = réauth · sans clé ✗
> *"Retries and idempotency aren't two topics, they're one."*

**Anti-double-submit, 4 couches :** bouton · dédup client · **clé** · **unicité serveur**
> *"Disabling the button is UX, not correctness. Two tabs, a direct API call, or an offline resync walk straight past it."*

---

## 50–60 · Deep-dive 2 — temps réel & SeatSelector

**SSE** — *"the need is purely server-to-client, it's plain HTTP, and the automatic reconnect with Last-Event-ID means the server can replay what I missed."* WebSocket seulement si vraiment bidirectionnel.
**HTTP/1.1 : 6 connexions/domaine** → plusieurs onglets = tout se bloque (*"the app freezes when I have three tabs open"*). HTTP/2 → multiplexé.

**Delta + version monotone** → rejeter le désordre · **détecter un trou → resync complète** · ignorer le déjà appliqué. *Un delta sans versionnement diverge silencieusement.*

**Réconciliation :** ne pas écraser l'optimiste en vol · resync à la reconnexion · **batcher** (200 places = 1 tick) · s'abonner au visible seulement

**SeatSelector — 3 couches, 3 durées de vie :** plan (heures) · états des places (volatile) · **ma sélection (local)**
> *"Two separate resources with two different cache lifetimes. If I merge them, I re-download the entire room layout on every availability update."*
- conflit **animé, pas brutal** · un event ne doit jamais écraser ma sélection
- **a11y, à soulever spontanément :** *"The seat selector is the hardest thing in this app to make accessible. A clickable grid gives a screen reader nothing — you need keyboard selection with labels that carry position and status."*

---

## 60–80 · Durcir

**Offline** — niveau 1 (lecture + **montrer sa résa à l'accueil**) systématique · niveau 2 si les données le justifient
> *"Offline booking is technically attractive and honestly questionable in value. A feature that fails silently is worse than not having it. If we built it, the UI has to say 'pending confirmation', never 'confirmed'."*
Si on le fait : ordre · **expiration** (pas rejouer le cours d'hier) · compaction · idempotence · notification · **server-wins** (pas de CRDT, rien à fusionner)
SW : stratégie **par ressource** · piège = **bloqué sur une vieille version** · IndexedDB (async + transactionnel), pas localStorage

**Rendu** — planning public SSG/ISR · détail partageable SSR · **app membre CSR**
> *"SSR mainly improves LCP. Inside the member app the bottleneck isn't first paint, it's INP — and what actually improves INP here is the optimistic update we discussed."*
Multi-tenant : thème **avant le premier paint** · un seul build + CSS custom properties · **valider les contrastes au moment où le studio choisit ses couleurs**

**Perf** — *"First — do we need to? We said twenty cards. Virtualizing that is over-engineering."* · structure avant mémoïsation · LCP (public) / **INP** (membre) / CLS (**un layout qui saute = clic sur le mauvais cours**) · *"RUM at p75 and p95, not averages"* · bundle : split par route + lazy paiement/SeatSelector + **préchargement au survol**

**Fuseaux** — heure locale du studio, toujours. **La récurrence se définit en heure locale.**
> *"Adding 168 hours in UTC silently shifts every class by an hour, twice a year."*
Heure qui n'existe pas / existe deux fois · le serveur ne formate pas dans son fuseau · Temporal / date-fns-tz

**i18n** — ICU (pluriels) · Intl natif · propriétés logiques · tester en allemand (+30 %) · descriptions studio non traduites

**Sécurité** — access token en mémoire + refresh en cookie httpOnly
> *"httpOnly doesn't make XSS harmless, but it stops them exfiltrating a token to use elsewhere and later. It's defense in depth, not a fix."*
Descriptions saisies par les studios = **surface XSS réelle** · **chaque clé de cache inclut le studioId** (sinon fuite entre tenants) · cartes dans les iframes du PSP

**A11y** — WCAG AA sur les parcours critiques · focus modale · live regions **avec parcimonie**
> *"Retrofitting accessibility costs several times more, because it touches DOM structure, semantics and focus order — not styling."*

**Observabilité** — erreurs + source maps · RUM p75/p95 · **trace propagée du clic au backend** · **métriques métier** : complétion du tunnel · échecs par code · temps de confirmation perçu · **taux de rollback optimiste** (diagnostique le temps réel par un symptôme utilisateur)
> *"A frontend can be perfectly healthy and completely broken, because a button ended up invisible at one breakpoint. Only funnel completion catches that."*

---

## 80–90 · Conclure

**POC vs prod**
> *"What's deferrable is what I can add later without breaking anything or misleading anyone. What isn't is anything whose absence produces a lie to the user or loses the studio money."*
> *"A POC narrows scope, it doesn't lower correctness."*

Différable : offline · temps réel · SSR · virtualisation · i18n exhaustive · DS complet
**Jamais :** anti-double-résa · erreurs typées · heures justes · pas de faux « confirmé » · sécu de base · a11y clavier

**Si on te pousse backend**
> *"The correctness guarantee has to live server-side — I can't prevent double-booking from the client, and I wouldn't try. My job is to make the optimistic path feel instant and the rejection path feel graceful. What I do care about is that the contract gives me typed reasons."*
> *"I haven't built that specific piece. Here's how I'd reason about it, and here's who I'd want in the room to validate it."*

**Résumé**
> *"I started with a simple client that fetches and books, then hardened it in four directions. Optimistic updates with a client-generated idempotency key, so the app feels instant and retries are safe. SSE for live availability, because the need is one-directional and reconnection comes free. Read-first offline, because the network is bad in venues and what people need there is to show their booking. And typed errors throughout, because three of the failure modes are actually revenue opportunities. The thing I'd want to validate first with your team is the waitlist promotion policy — that's a product decision that shapes a lot of the UI."*

**Questions**
- Où en est le frontend — monolithe, modules, plusieurs apps ? Qu'est-ce qui fait le plus mal ?
- Comment gérez-vous le theming multi-tenant ? Web et mobile partagent-ils du code, jusqu'où ?
- **Qui décide des contrats d'API — les équipes front sont-elles impliquées en amont ?**
- Équipes découpées par feature, surface ou domaine ? Y a-t-il une frontend platform ?
- Contrainte la plus dure aujourd'hui — échelle, variété des studios, international ?

---

## Les dix à ne pas rater

1. **Clarifier avant de dessiner**, en disant *pourquoi* chaque question compte
2. **V1 simple + ses quatre failles** — le paragraphe le plus rentable
3. **Séparer état serveur et état UI**
4. **La clé d'idempotence naît de l'intention, pas de la requête**
5. **La dispo est une indication** → le chemin de refus est nominal
6. **`INELIGIBLE` ≠ `FULL`** — ton meilleur lien technique↔business
7. **SSE plutôt que WebSocket**, et savoir quand basculer
8. **La récurrence se définit en heure locale**
9. **Alerter sur la complétion du tunnel**, pas que sur les erreurs
10. **S'adapter quand ils challengent** — reformuler, dire ce que ça change, ajuster. *C'est le test.*

---

**Le silence est ton ennemi.** Ils n'évaluent que ce qu'ils entendent.
