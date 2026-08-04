# Frontend System Design @ bsport — le déroulé complet

> **Ce que ce document est.** Le raisonnement de l'entretien, de la première à la quatre-vingt-dixième minute, déroulé comme tu vas réellement le tenir. Chaque section explique **ce que tu dis**, **pourquoi tu le dis**, et **ce qu'ils en tirent**. Quand un arbitrage se présente, il est détaillé sur place.
>
> **Ce que ce document n'est pas.** Une liste de patterns à réciter. Si tu retiens la *structure du raisonnement* et une dizaine de points d'appui, tu reconstruiras le reste en direct — ce qui est précisément ce qu'ils veulent voir.

**Format :** ~1h30, Google Meet, avec un Engineering Manager, un Staff Engineer ou le CTO. Un collègue peut assister en observateur.
**Rôle :** frontend. **Enjeu :** dernière étape technique avant l'entretien avec un fondateur.

---

# SOMMAIRE

**PARTIE I — AVANT DE DESSINER**
1. Ce qu'ils évaluent réellement
2. bsport : lire le produit pour anticiper l'exercice
3. La trame, et pourquoi l'annoncer
4. Minutes 0–10 : clarifier

**PARTIE II — POSER LES FONDATIONS**
5. Minutes 10–15 : la V1, volontairement simple
6. Minutes 15–25 : l'architecture en couches
7. Le découpage en composants

**PARTIE III — LES DONNÉES**
8. Le modèle du domaine côté serveur
9. La disponibilité : une projection, pas un état
10. Le contrat d'API, négocié depuis le client
11. Où vit l'état, et avec quelle librairie
12. Les états de l'interface

**PARTIE IV — LE CŒUR**
13. Minutes 35–50 : le flow de réservation
14. Concurrence, idempotence, retry
15. Minutes 50–60 : le temps réel
16. Le SeatSelector

**PARTIE V — DURCIR**
17. Offline
18. La stratégie de rendu
19. Performance
20. Accessibilité, i18n, sécurité
21. Observabilité et débogage

**PARTIE VI — CONCLURE**
22. POC vs production, et l'impact business
23. Quand ils te poussent vers le backend
24. Minutes 80–90 : la clôture
25. Boîte à outils : phrases, timing, entraînement

---
---

# PARTIE I — AVANT DE DESSINER

## 1. Ce qu'ils évaluent réellement

Leur email de convocation est une grille d'évaluation à peine déguisée. Chaque phrase du paragraphe « What success looks like » correspond à un critère de notation. Décodons-les, parce que savoir ce qui est mesuré change la façon dont tu occupes les 90 minutes.

**« Start by clarifying the problem, constraints and assumptions, then outline how you plan to approach the design. »**
Ils testent si tu fonces ou si tu cadres. Un candidat qui commence à dessiner des boîtes à la minute 2 a déjà perdu des points, même si son archi finale est bonne — parce qu'en situation réelle, il aurait construit la mauvaise chose très efficacement. La deuxième moitié de la phrase compte autant : *outline how you plan to approach* signifie qu'ils veulent entendre ton **plan** avant ton **design**.

**« Begin with a simple, clear solution that solves the core problem, then refine it toward real time, offline handling, scalability and reliability. »**
C'est le critère le plus discriminant, et le plus contre-intuitif pour un candidat expérimenté. Ton réflexe naturel, avec dix ans de métier, est de montrer tout ce que tu sais d'emblée — WebSockets, service workers, virtualisation, dès la première minute. **C'est exactement ce qu'il ne faut pas faire.** Ils veulent voir que tu sais *quand* introduire la complexité, ce qui suppose de montrer d'abord la version sans. Et le fait qu'ils énumèrent explicitement l'ordre (temps réel, puis offline, puis scalabilité, puis fiabilité) te donne quasiment le plan de tes deep-dives.

**« Focus on data flow and responsibilities between components, not just APIs or fields. »**
Traduction : ne liste pas des endpoints. Raconte le **trajet d'une donnée**. Qui la possède, qui l'écrit, qui la lit, qu'est-ce qui se passe quand l'écriture échoue, comment les autres l'apprennent. C'est une invitation directe à parler en termes de flux, ce qui est aussi la façon la plus naturelle de rendre un design compréhensible à l'oral.

**« Make time to talk about errors, retries, idempotency, bottlenecks and how you would monitor or debug the system. »**
Le mot **idempotency** dans une convocation frontend est un cadeau : il te dit précisément où creuser. Et « make time » signale qu'ils ont déjà vu des candidats ne jamais y arriver faute de gestion du temps. Prévois ton timing pour y consacrer un vrai bloc.

**« Think out loud, keep your reasoning structured, and be ready to adapt your design when we challenge parts of it. »**
Deux choses. D'abord, **le silence est ton ennemi** : ils n'évaluent pas ce que tu penses, seulement ce qu'ils entendent. Ensuite — et c'est capital — **ils vont te challenger, et ce n'est pas un piège, c'est le test lui-même**. Défendre sa première idée par principe est un signal négatif. Reformuler la contrainte, dire ce qu'elle change, et ajuster : c'est un signal positif, y compris quand tu maintiens ta position, à condition de la re-justifier sur la nouvelle contrainte.

**« Keep business impact in mind when you make design choices, not only the technical elegance. »**
Ils cherchent un ingénieur produit. Dans une boîte qui vend un SaaS à des studios de fitness, une décision technique qui fait perdre 5 % de conversion dans le tunnel de réservation est une mauvaise décision, même si elle est élégante.

**Le méta-point à garder en tête pendant toute la session.** En 90 minutes, personne ne conçoit une vraie architecture. Ce qu'ils achètent, c'est une **simulation de collaboration** : est-ce qu'il sera agréable et productif de concevoir des systèmes avec cette personne pendant trois ans ? Ça se traduit par des comportements concrets — poser des questions plutôt que supposer, dire « je ne sais pas, voilà comment je trancherais » plutôt que bluffer, leur retourner une question quand leur contexte compte plus que ton opinion, et accueillir un challenge comme une information plutôt que comme une attaque.

---

## 2. bsport : lire le produit pour anticiper l'exercice

bsport est une plateforme tout-en-un pour studios de fitness et wellness : réservation de cours avec disponibilité temps réel, listes d'attente, sélection de place (« choose your spot »), abonnements et packs de crédits, paiements récurrents, gestion multi-studios, applications clientes brandées, CRM.

L'exercice le plus probable est donc une variante de **« design the booking experience »**. Mais l'intérêt de connaître le produit va au-delà de deviner l'énoncé : il te donne des **contraintes réelles** à invoquer, ce qui rend chaque justification concrète au lieu d'être générique.

**Ce que le produit t'apprend, et ce que tu en déduis :**

**C'est du B2B2C.** Le client qui paie est le studio ; l'utilisateur final est le membre. Les deux ont des intérêts qui ne coïncident pas toujours — le studio veut remplir ses cours au maximum, le membre veut de la flexibilité. Ça se manifestera très concrètement sur la politique de liste d'attente et sur les pénalités de no-show. Savoir nommer cette tension te permet de poser des questions produit pertinentes plutôt que de trancher unilatéralement.

**C'est multi-tenant avec branding par client.** Chaque studio a son application à ses couleurs. Conséquence architecturale directe : **le thème est une donnée chargée à l'exécution, pas du CSS compilé**. Tu ne peux pas faire un build par studio si tu en as des centaines — un nouveau client doit pouvoir être actif sans déploiement. Cette contrainte remontera dans plusieurs décisions (rendu, styling, performance du premier paint).

**C'est consumer-facing et international.** Donc l'accessibilité et l'internationalisation ne sont pas des options qu'on ajoutera « quand on aura le temps ». Et surtout, les **fuseaux horaires** deviennent un sujet de première importance, parce qu'une application de planning est l'un des rares domaines où se tromper d'une heure ruine complètement la fonctionnalité.

**Il y a une application mobile.** Donc l'offline est une vraie question. Avec un argument concret et vérifiable que tu peux invoquer : **beaucoup de studios sont en sous-sol, où le réseau est mauvais**. Ce détail transforme une discussion abstraite sur l'offline en un problème utilisateur identifiable.

**Il y a de l'argent dans le flux.** Packs, abonnements, paiements récurrents. Ça élève le coût d'une erreur : un double débit n'est pas un bug d'affichage, c'est un litige, un remboursement, et une perte de confiance. C'est ce qui justifiera l'insistance sur l'idempotence.

**Le geste à faire en début d'entretien.** Ne récite pas ce que tu sais du produit — ça sonne comme une fiche apprise. Utilise-le pour poser de **meilleures questions** : *« Est-ce qu'on parle de l'app membre brandée, ou du back-office studio ? Parce que les contraintes ne sont pas les mêmes — l'une est consumer-facing et mobile-first, l'autre est un outil de travail utilisé sur desktop toute la journée. »* Cette question seule montre que tu as compris le modèle d'affaires.

---

## 3. La trame, et pourquoi l'annoncer

Tu vas suivre **RADIO** : Requirements, Architecture, Data, Interface, Optimizations.

**Pourquoi une trame explicite.** Trois raisons, et elles comptent toutes les trois.

D'abord, ça t'évite de te perdre. Sous pression, à l'oral, en anglais, avec trois personnes qui regardent, la tentation de partir dans un détail intéressant et de ne jamais en revenir est réelle. Une trame te donne un fil auquel te raccrocher.

Ensuite, **ça les rassure**. Un intervieweur qui ne sait pas où tu vas ne peut pas t'évaluer sereinement — il passe son énergie à essayer de suivre. S'il sait qu'après l'architecture viendront les données puis les optimisations, il peut te laisser dérouler et se concentrer sur le contenu.

Enfin, ça te donne un **outil de gestion du temps**. Si à la minute 40 tu es encore dans l'architecture, tu le sais, et tu peux dire à voix haute *« je vais accélérer sur cette partie pour garder du temps sur le flow de réservation, qui est le cœur du sujet »*. Ce comportement est en soi un signal de séniorité.

**Comment l'annoncer, en une phrase, après avoir entendu l'énoncé :**

> *"Let me structure this: I'll spend a few minutes clarifying requirements and assumptions, then sketch a high-level architecture, go into the data model and the API contract, and then deep-dive on whichever parts you find most interesting — I suspect the booking flow and real-time availability. Does that work for you?"*

Trois choses dans cette phrase méritent d'être notées. Elle annonce le plan. Elle **désigne les deep-dives à l'avance**, ce qui montre que tu as déjà identifié où sont les difficultés. Et elle se termine par une question, ce qui les implique et te donne l'occasion d'être réorienté tôt plutôt qu'à la minute 50.

---

## 4. Minutes 0–10 : clarifier

C'est le premier critère explicite de leur grille, et c'est aussi la phase que les candidats expérimentés bâclent le plus, parce qu'ils croient savoir. Prends le temps. Écris les réponses de façon visible.

### 4.1 Comment poser les questions

Ne déroule pas une liste mécanique de vingt questions — ça donne l'impression d'un questionnaire appris. Pose une question, **explique pourquoi tu la poses**, et enchaîne sur ce que la réponse change. C'est cette explicitation du lien question → conséquence architecturale qui te distingue.

Mauvaise version : *« Est-ce qu'il y a du offline ? »*
Bonne version : *« Est-ce que l'app mobile doit fonctionner hors ligne ? Je demande parce que ça change beaucoup de choses : si c'est juste de la consultation, un cache suffit ; si on veut réserver hors ligne, il faut une file d'actions et une stratégie de résolution de conflits, et surtout il faut décider ce qu'on promet à l'utilisateur, parce qu'on ne peut pas lui garantir une place sans serveur. »*

La deuxième version fait trois choses en dix secondes : elle pose la question, elle montre que tu connais les deux implémentations, et elle soulève un problème produit qu'ils n'ont peut-être pas anticipé.

### 4.2 Le périmètre fonctionnel

**Quelle surface ?** App membre, back-office studio, ou les deux ? Si on ne te précise rien, assume l'app membre et dis-le — c'est le cœur du produit et le cas le plus riche.

**Quel parcours exactement ?** Consulter un planning, réserver, annuler, rejoindre une liste d'attente, choisir sa place, acheter un pack, payer ? Chacun de ces éléments ajoute une dimension. Si on te laisse choisir, **choisis consulter + réserver + annuler** comme cœur, et mentionne que la waitlist et la sélection de place sont des raffinements que tu aborderas ensuite. Tu viens de poser ta V1 et tes deep-dives d'un coup.

**Un membre, un studio ou plusieurs ?** Ça détermine si le contexte tenant est fixe (une app brandée = un studio) ou variable (une app agrégée façon marketplace). Les conséquences sur le cache et la navigation sont significatives.

**Les plannings sont-ils publics et indexables ?** Un studio veut être trouvé sur Google quand quelqu'un cherche « pilates Bastille ». Si oui, tu as un besoin SEO, donc une contrainte de rendu.

### 4.3 Le non-fonctionnel — ce qui pilote vraiment l'architecture

**La disponibilité doit-elle se mettre à jour en direct ?** Et avec quelle latence acceptable ? La différence entre « quelques secondes de retard sont tolérables » et « il faut que ça bouge instantanément » est la différence entre un simple rafraîchissement périodique et un canal poussé par le serveur. Ne suppose pas le second.

**Quelles sont les conditions réseau réelles ?** C'est la question que personne ne pose et qui change le plus de choses. Une app utilisée sur un bon wifi de bureau et une app utilisée sur une 4G capricieuse au sous-sol d'un studio n'appellent pas les mêmes compromis. C'est ce qui justifiera plus tard ton insistance sur la réduction des allers-retours réseau et sur la lecture hors ligne.

**Quels appareils ?** Un Android d'entrée de gamme n'a pas le même budget CPU qu'un iPhone récent. Ça détermine si la virtualisation et la maîtrise des re-renders sont un confort ou une nécessité.

**Quel niveau d'accessibilité ?** En Europe, sur du consumer-facing, il y a une dimension réglementaire (European Accessibility Act) et pas seulement éthique. Et le public des studios de wellness inclut des personnes âgées et des personnes en rééducation — la population concernée est surreprésentée, pas marginale.

**Combien de langues, et est-ce que les membres voyagent entre studios ?** Ça amène directement le sujet des fuseaux horaires.

### 4.4 La volumétrie

Donne des ordres de grandeur, même approximatifs. Ce n'est pas la précision qui compte, c'est le fait de raisonner en quantités plutôt qu'en abstractions.

**Combien de créneaux à l'écran ?** Une journée de planning, c'est une vingtaine de cours. Un mois multi-studios, c'est des milliers. **Cette réponse décide à elle seule si la virtualisation est nécessaire ou si elle serait de la sur-ingénierie.** Poser la question maintenant t'évite de la subir plus tard : si on te demande « comment tu virtualises ? », tu pourras répondre « on avait dit vingt cartes par jour, donc je ne virtualiserais pas ici — je le ferais si on affichait une vue mensuelle ».

**Quel est le ratio lecture/écriture ?** Il est massivement déséquilibré : on consulte un planning des centaines de fois pour une réservation. C'est un fait structurant, parce qu'il oriente vers un cache agressif en lecture et un chemin d'écriture soigné, plutôt que l'inverse.

**Comment se répartit la charge dans le temps ?** Elle n'est pas uniforme, elle est en pics. Quand un studio ouvre ses réservations pour la semaine, des centaines de personnes se ruent sur les mêmes cours à la même seconde. Ça a deux conséquences frontend : c'est exactement le moment où les conflits de réservation deviennent probables, et c'est le moment où une interface optimiste risque le plus de mentir.

### 4.5 Poser les hypothèses et avancer

Termine cette phase en verbalisant tes hypothèses, puis en avançant. Ne reste pas bloqué à demander : si on ne te répond pas, décide et annonce ta décision.

> *"Here's what I'm assuming: member-facing app, web and mobile, one studio at a time, roughly twenty classes visible at once, real-time availability matters, the network is unreliable in the venues, and there's money in the flow through credit packs. Tell me if any of that is wrong — those assumptions are what drive my rendering strategy, my caching, and how far I go on offline."*

Cette dernière phrase est importante : elle explique que tes hypothèses ne sont pas décoratives, elles sont **les entrées de tes décisions**. C'est ce qui rend la phase de clarification utile plutôt que rituelle.

---
---

# PARTIE II — POSER LES FONDATIONS

## 5. Minutes 10–15 : la V1, volontairement simple

Voici le moment le plus contre-intuitif de l'entretien. Tu as dix ans d'expérience, tu vois déjà toute l'architecture cible, et tu vas volontairement décrire quelque chose de basique.

**Fais-le, mais annonce que tu le fais.** La différence entre un candidat qui propose une V1 simple parce qu'il ne connaît que ça, et un candidat qui la propose stratégiquement, tient entièrement à cette annonce.

> *"Let me start with the simplest version that actually works, and then I'll show you where it breaks and what I'd add. I find that easier to challenge than a fully-loaded architecture."*

**La V1 :** une application cliente qui appelle une API REST. Elle récupère la liste des sessions pour un studio et une plage de dates, les affiche, et quand l'utilisateur clique sur « Réserver », elle envoie une requête et met à jour l'écran avec la réponse. Loading, erreur, vide sont gérés. C'est tout.

**Puis, immédiatement, désigne les failles.** C'est ça qui transforme la simplicité en démonstration de maîtrise :

> *"This works, and honestly for a pilot with one studio it might be enough. But there are four things that will break. First, availability goes stale the moment it's rendered — someone else books while you're looking. Second, every click waits for a round-trip, which on a bad connection feels broken. Third, if the network drops mid-request, we don't know whether the booking happened, and a retry could double-book. Fourth, nothing tells us when it's failing in production. Those four are what I want to dig into."*

Regarde ce que ce paragraphe accomplit. Il pose une base commune. Il prouve que la simplicité était un choix, pas une limite. Il **annonce quatre deep-dives** — temps réel, latence perçue, idempotence, observabilité — qui correspondent exactement à ce que leur email demande. Et il leur donne quatre portes d'entrée pour te challenger, ce qui rend leur travail plus facile et la conversation plus fluide.

C'est le paragraphe le plus rentable de tout l'entretien. Il mérite d'être répété jusqu'à sortir naturellement.

---

## 6. Minutes 15–25 : l'architecture en couches

Maintenant tu construis. Dessine des couches, pas un nuage de boîtes reliées par des flèches.

### 6.1 Les couches

```
┌──────────────────────────────────────────────────┐
│  Composants d'UI                                  │
│  rendu, interaction, accessibilité                │
├──────────────────────────────────────────────────┤
│  État UI local                                    │
│  filtres, modale, sélection, étape du parcours    │
├──────────────────────────────────────────────────┤
│  État serveur / cache                             │
│  sessions, dispo, profil, bookings                │
├──────────────────────────────────────────────────┤
│  Transport                                        │
│  client HTTP, canal temps réel, file offline      │
├──────────────────────────────────────────────────┤
│  Services transverses                             │
│  auth · i18n · theming tenant · flags · télémétrie│
└──────────────────────────────────────────────────┘
```

**Le principe à énoncer :** chaque couche a une responsabilité unique, et les couches basses ignorent les couches hautes. Le client HTTP ne sait pas qu'il existe un composant `ClassSlotCard` ; le cache ne sait pas comment on affiche une erreur.

**Fais explicitement le lien avec la clean architecture**, puisqu'ils la citent dans leur email. Le point à faire : la clean architecture n'est pas réservée au backend. Sa proposition centrale — le domaine au centre, indépendant de l'infrastructure, avec inversion des dépendances — s'applique parfaitement ici.

> *"The domain logic — what a booking is, what states it can be in, what makes a session bookable — shouldn't know whether data arrives over REST, GraphQL or a WebSocket. If I keep that separation, I can swap the transport, test the domain without a network, and share that layer with the mobile app. That's dependency inversion applied to the client."*

Ce point a une conséquence pratique importante que tu peux enchaîner : c'est ce qui rend le **partage de code web/mobile** possible et sensé. La couche domaine — règles, machine à états, types — est du TypeScript pur, partageable intégralement. La couche présentation ne se partage pas bien, et ne devrait pas. C'est un arbitrage à énoncer si le sujet mobile arrive : partager ce qui est invariant, spécialiser ce qui est contextuel.

### 6.2 Le flux d'une réservation

C'est ici qu'ils veulent t'entendre parler en flux plutôt qu'en boîtes. Raconte le trajet complet, en désignant à chaque étape qui possède quoi :

> *"The user clicks. The component doesn't call the API — it dispatches a mutation. The mutation layer generates an idempotency key, applies an optimistic update to the cached session so the UI reflects the change immediately, and fires the request. On success it writes the response into the cache and invalidates the related keys. On a business failure it rolls back to the snapshot and surfaces a typed reason the component maps to a specific UI. On a network failure it retries with the same key. Meanwhile the real-time channel may push an update for that same session, and the reconciliation logic has to apply it without clobbering the in-flight optimistic change."*

Ce paragraphe contient déjà tout ton deep-dive. Le dire une fois maintenant, à haut niveau, te permet d'y revenir en détail plus tard sans avoir à tout reconstruire — et ça leur donne envie de creuser.

---

## 7. Le découpage en composants

### 7.1 Le découpage lui-même

| Composant | Responsabilité | Nature |
|---|---|---|
| `SchedulePage` | orchestration, fetch de haut niveau, routing | conteneur |
| `ScheduleFilters` | date, discipline, studio, prof | conteneur (état local + URL) |
| `ScheduleList` | rendu de la liste, virtualisation si besoin | présentationnel |
| `ClassSlotCard` | un créneau et son état métier | présentationnel |
| `BookingFlow` | machine à états du parcours | conteneur |
| `SeatSelector` | sélection de place, temps réel | conteneur |
| `WaitlistButton` | inscription et position | conteneur |
| `MembershipBadge` | crédits, éligibilité | présentationnel |

### 7.2 Ce qu'il faut dire au-delà du tableau

**La distinction conteneur / présentationnel n'est pas cosmétique.** Son intérêt réel est la **stabilité** : les composants présentationnels ne changent pas quand l'API change. Si ta `ClassSlotCard` reçoit un objet de props bien défini plutôt que d'aller chercher ses données elle-même, une refonte du contrat d'API ne la touche pas. Sur une codebase qui vit cinq ans, c'est ce qui fait la différence entre un refactor localisé et un chantier.

**La composition plutôt que l'accumulation de props.** Une `ClassSlotCard` avec vingt-cinq props booléennes est un signal d'alarme : ça veut dire qu'elle essaie d'être toutes les variantes à la fois. La réponse est la composition — des sous-composants passés en enfants, ou des compound components — plutôt qu'un drapeau par variation.

C'est un point où ton expérience parle directement. Chez Ivalua, tu as construit une bibliothèque de composants consommée par plusieurs équipes, avec un moteur de configuration permettant de personnaliser sans code. Le problème que tu as résolu — comment un composant reste stable tout en étant extensible par des tiers — est exactement celui qui se pose ici, où chaque studio veut son apparence.

**La frontière de re-render.** C'est le point qui relie le découpage à la performance. Quand un event temps réel dit « la session 42 a maintenant 3 places », il ne doit re-render que la carte de la session 42, pas les quarante autres. Ça ne s'obtient pas par de la mémoïsation ajoutée après coup, mais par la **structure** : chaque carte s'abonne à sa propre tranche de cache, plutôt que de recevoir un tableau global en props.

Dis-le comme un principe, parce que c'en est un :

> *"The first lever on re-renders isn't memoization, it's state structure — colocating state, splitting contexts, letting each card subscribe to its own slice. Memoization is what you add after you've measured, not what you sprinkle everywhere upfront."*

### 7.3 Raconter ta bibliothèque de composants

Si l'occasion se présente — et elle se présentera, parce que le multi-tenant l'appelle — raconte ton travail chez Ivalua **comme un système**, pas comme une liste de features. Les axes qui portent :

**Les contrats.** Comment tu as défini ce qui est garanti stable et ce qui peut bouger, pour pouvoir faire évoluer le noyau sans casser les consommateurs.

**Les points d'extension.** Déclarés explicitement, plutôt que de laisser les équipes patcher l'intérieur des composants. La différence entre une extensibilité conçue et une extensibilité subie.

**Le versioning et la migration.** Le vrai problème d'une bibliothèque interne : comment faire évoluer un composant utilisé par N équipes sans bloquer tout le monde ni figer le composant à jamais.

**L'expérience développeur.** Ton moteur de configuration permettait à des non-développeurs de personnaliser. C'est un problème de conception d'API pour humains, ce qui est plus difficile que de la conception d'API pour machines.

Cette histoire est probablement ta meilleure carte de tout l'entretien, parce que peu de candidats ont vécu ce problème à cette échelle, et parce qu'elle correspond directement à un besoin structurel de bsport.

---
---

# PARTIE III — LES DONNÉES

## 8. Le modèle du domaine côté serveur

Tu ne conçois pas la base de données. Mais tu dois savoir de quoi tu parles pour **négocier le contrat d'API**, et c'est précisément ce qui distingue un frontend senior d'un intégrateur.

### 8.1 Les quatre contextes

Annonce le découpage avant les entités — ça montre que tu modélises un domaine plutôt que d'énumérer des tables, et ça répond à leur mention du DDD.

| Contexte | Entités | Ce qu'il gouverne |
|---|---|---|
| **Catalog** | Studio, Location, Room, Discipline, Instructor | qui, quoi, où |
| **Scheduling** | ClassTemplate, Session, Seat | quand |
| **Booking** | Member, Booking, WaitlistEntry | qui vient |
| **Billing** | Membership/Pack, Order/Payment | qui paie |

> *"These map to bounded contexts, and they're also the natural seams of the API. The reason it matters to me as a frontend engineer is that a screen usually spans several of them — the schedule screen needs Catalog, Scheduling and Billing at once — and that tension is exactly where waterfalls and over-fetching come from."*

### 8.2 Catalog

**`Studio`** porte le branding, la timezone, la devise, la locale par défaut, et les politiques de réservation (fenêtre d'ouverture, délai d'annulation gratuite, pénalité no-show).

Deux de ces champs ont un impact frontend disproportionné, et il faut le dire :

Le **branding** doit être disponible **avant le premier paint**, sinon l'utilisateur voit un flash aux mauvaises couleurs avant que l'app se rebrande. Sur une app censée appartenir au studio, c'est visible et ça casse l'illusion.

La **timezone** doit accompagner toute donnée temporelle. On y reviendra en détail, mais pose-le maintenant : un cours à 18h à Barcelone est à 18h pour tout le monde, y compris pour un membre qui consulte depuis Paris.

**`Location`** permet à un studio d'avoir plusieurs adresses, avec potentiellement une timezone différente. **`Room`** porte la capacité et le plan de salle. **`Discipline`** porte un nom et une couleur, ce qui alimente le filtrage et le code visuel du planning. **`Instructor`** est un critère de choix fort côté membre — beaucoup de gens choisissent « le cours de X » plutôt que « du yoga à 18h » — donc prévois le filtre par prof et l'affichage du remplaçant.

### 8.3 Scheduling — la partie qui compte

C'est ici que se joue la subtilité de modélisation qu'un bon intervieweur attend.

**`ClassTemplate`** est la définition récurrente : « Vinyasa, tous les mardis à 18h, salle 2, 45 minutes, prof X, 15 places, 1 crédit ». Elle porte une règle de récurrence.

**`Session`** est **l'occurrence datée concrète** — c'est ce qu'on réserve. Elle porte son instant de début en UTC, sa timezone, sa capacité, son compteur de réservations, son statut, et les **exceptions** de cette occurrence précise : prof remplaçant, salle changée, cours annulé.

**L'arbitrage : matérialiser les occurrences ou les générer à la volée ?**

*Générer à la volée* depuis la règle ne coûte rien en stockage. Mais une occurrence générée **n'a pas d'identité stable** : tu ne peux pas y attacher une réservation, une annulation, un remplaçant. Et gérer les exceptions à l'intérieur d'une règle de récurrence devient rapidement ingérable.

*Matérialiser* toutes les occurrences donne à chacune une identité, donc la possibilité d'y accrocher des données. Mais jusqu'où dans le futur génère-t-on ?

**La réponse : un horizon glissant.** On matérialise sur quelques mois, un job régénère au fil du temps. On concilie identité stable et stockage borné.

**Et le vrai sujet, qu'il faut soulever spontanément : que se passe-t-il quand la règle change ?** Le prof change tous les mardis à partir de septembre. Modifie-t-on les occurrences déjà matérialisées ? Toutes, ou seulement les futures ? Et celles qui ont déjà des réservations ?

C'est exactement le problème « modifier cet événement / tous les événements / tous les suivants » de Google Calendar. Le nommer ainsi montre que tu reconnais un problème connu au lieu de l'improviser. Et ça a une **conséquence frontend directe** : l'interface de back-office doit **poser la question** à l'utilisateur plutôt que de deviner, et l'app membre doit gérer le cas « le cours que tu as réservé a changé de prof ou de salle » avec une notification claire.

**`Seat`** existe uniquement pour les cours à place attribuée : un identifiant, un libellé (« Vélo 12 »), une position dans le plan, un type (standard, PMR, hors service).

### 8.4 Booking et Billing

**`Booking`** porte la session, le membre, éventuellement la place, son statut, et sa clé d'idempotence.

Son cycle de vie est une vraie machine à états :

```
                     ┌──> CHECKED_IN      (venu)
      ┌──> CONFIRMED ┤
      │              └──> NO_SHOW         (absent → pénalité selon policy)
PENDING ──> CANCELLED                      (par le membre ou le studio)
      └──> EXPIRED                         (hold non confirmé à temps)

WAITLISTED ──(place libérée)──> CONFIRMED
```

**Un point à faire ici, parce qu'il illustre parfaitement « simple d'abord ».** L'état `PENDING` n'existe que s'il y a un **hold** temporaire le temps d'un paiement. Si la réservation est couverte par un pack de crédits, le débit est instantané et on passe directement en `CONFIRMED`.

> *"So I wouldn't introduce hold-and-confirm by default. It brings a TTL, an expiry job, a pending state, a countdown in the UI, and hold release on abandon. That's a lot of machinery, and a credit-pack booking doesn't need any of it. I'd add it exactly when a card payment sits between the intent and the confirmation."*

C'est le comportement qu'ils évaluent, appliqué à un cas concret.

**`WaitlistEntry`** amène une **question produit à leur poser** plutôt qu'à trancher seul : quand une place se libère, le premier de la liste est-il réservé automatiquement, ou reçoit-il une invitation à accepter dans une fenêtre de temps ?

L'automatique maximise le remplissage — l'intérêt du studio. L'opt-in protège le membre d'être engagé sans l'avoir voulu, débité d'un crédit, voire pénalisé pour no-show s'il n'a pas lu la notification. Et le bon choix dépend du délai : à 24 heures du cours, l'opt-in est raisonnable ; à 20 minutes, une fenêtre d'acceptation laisse la place vide.

> *"That's a product call more than an engineering one. I'd probably go hybrid on time-to-class, but I'd want to know whether studios penalize no-shows — because auto-booking someone who then gets penalized for not showing up is the worst of both worlds."*

**`Membership` / `Pack`** porte le type d'abonnement, les crédits restants, la validité, et les **restrictions** (disciplines ou studios autorisés). C'est ce qui pilote l'**éligibilité**, et c'est un point majeur pour l'interface : pouvoir réserver ne dépend pas seulement des places restantes, mais aussi du pack. On y revient en détail au chapitre des états UI, parce que c'est le point que la plupart des candidats manquent.

---

## 9. La disponibilité : une projection, pas un état

C'est un point de modélisation où il est facile de se tromper, et où avoir la bonne réponse est très visible.

### 9.1 Le principe

**La disponibilité n'est pas un attribut stocké.** C'est une **projection** :

```
disponibilité = capacité (statique)  −  occupations (dynamique)
```

Un `Seat` n'a pas de champ `is_available`. Il ne peut pas en avoir : le vélo 12 est pris à 18h et libre à 19h. La disponibilité est une propriété du **couple (place, session)**, pas de la place. Si tu la stockes sur le Seat, ton modèle casse à la deuxième session.

Conséquence sur le contrat : le client consomme une liste de `SeatAvailability { seatId, status }` **par session**, séparée du plan de salle.

### 9.2 Deux régimes

**Capacité anonyme** — pas de places individuelles, juste un compteur. La session porte `capacity` et `booked_count`.

**Places attribuées** — des entités `Seat` réelles, disponibilité calculée place par place.

**Le point à faire : le second contient le premier.** Si tu as les places, tu peux dériver le compteur. Mais tu ne fais pas payer la complexité du plan de salle aux cours qui n'en ont pas besoin. Le plan de salle est optionnel, et l'interface bascule entre un parcours simple et le `SeatSelector` selon sa présence.

### 9.3 Le compteur : dérivé ou matérialisé

*Dérivé* (compter les bookings à chaque lecture) est toujours exact et impossible à désynchroniser, mais coûteux quand le planning est lu massivement.

*Matérialisé* (un compteur sur la session, mis à jour à chaque écriture) est instantané en lecture, et c'est aussi **ce compteur qui porte l'invariant de non-surbooking côté serveur**. En contrepartie il peut dériver en cas de bug, donc il faut une réconciliation périodique.

**Le ratio lecture/écriture tranche : matérialisé.** On consulte des centaines de fois pour une écriture.

### 9.4 Trois états, pas deux

C'est la subtilité qui fait la différence :

| État | Origine |
|---|---|
| `FREE` | aucune occupation |
| `HELD` | verrou temporaire avec TTL — quelqu'un est en train de payer |
| `BOOKED` | réservation confirmée |

Sans le `HELD`, tu as un choix impossible : soit tu réserves dès le clic, et un abandon de paiement bloque la place indéfiniment ; soit tu ne réserves qu'après paiement, et deux personnes peuvent payer pour la même place. Le hold avec expiration résout ça — et c'est exactement ce qui explique l'état `PENDING` du booking et le compte à rebours dans l'interface.

S'ajoutent des indisponibilités qui ne viennent pas des membres : machine en panne, place réservée au staff.

### 9.5 Le point qui gouverne tout le reste

> *"Whatever number the server gives me for spots left, it's a hint, not a guarantee. It might come from a cache, it might be two hundred milliseconds old, and someone may be mid-payment on the last seat. The only moment truth exists is the response to the booking request."*

Et la conséquence de conception, qui est le vrai point :

> *"Which means the rejection path isn't an edge case I handle at the end — it's a nominal path I design from the start. 'The spot was just taken, here are three alternatives' has to be as polished as the success screen."*

C'est une phrase qui vaut cher, parce qu'elle montre que tu tires une conséquence de conception d'une propriété du système, plutôt que d'énumérer des fonctionnalités.

---

## 10. Le contrat d'API, négocié depuis le client

### 10.1 La posture

Tu n'es pas un consommateur passif d'API. Un frontend senior **négocie** son contrat, avec des arguments qui tiennent devant une équipe backend. Voilà les quatre qui portent.

### 10.2 Réponses enrichies : optimiser les allers-retours, pas les octets

**L'arbitrage.** Le serveur renvoie-t-il des sessions enrichies (avec discipline, prof, places restantes, éligibilité), ou des références à re-fetcher ?

*Normalisé* donne un payload compact mais provoque une **cascade** : sessions, puis profs, puis disciplines. Chaque saut coûte un aller-retour.

*Enrichi* donne un payload plus gros avec de la duplication — le même prof répété quarante fois — mais un seul aller-retour.

**Le critère qui tranche est le coût d'un round-trip sur le réseau cible.** Sur une 4G médiocre en sous-sol, chaque saut coûte entre 100 et 300 millisecondes. Trois sauts en cascade, c'est une seconde d'écran vide.

**La réponse, et l'argument à retenir :**

> *"I optimize for round-trips, not payload size. Duplicating an instructor forty times costs a couple of kilobytes after compression; an extra waterfall costs hundreds of milliseconds of blank screen. Bandwidth is abundant, latency isn't."*

C'est le principe le plus rentable de la performance réseau mobile, et il se retient en une phrase.

### 10.3 L'éligibilité vient du serveur

**L'arbitrage.** Qui calcule « ce membre peut-il réserver ce cours » ?

*Côté client*, à partir du pack et de la session : réactif, calculable hors ligne. Mais ça **duplique une règle métier sur trois clients** — web, mobile, back-office — et ces trois copies vont diverger. Le jour où le studio ajoute une restriction horaire à un pack, tu affiches « réservable » pour un cours que l'API refusera.

*Côté serveur*, renvoyé comme un champ avec une raison typée : une seule implémentation, évolutive sans redéployer les clients.

**Le critère : est-ce une règle métier ou une règle de présentation ?** L'éligibilité est une règle métier — elle change, elle a des exceptions, et elle vaut de l'argent.

**La réponse : le serveur décide, le client présente.** Le serveur renvoie `canBook` **et** la raison typée ; le client mappe la raison sur une interface.

**Le cas subtil, à soulever toi-même : que fait-on hors ligne ?** Tu ne peux pas demander au serveur. Deux options honnêtes : afficher la dernière éligibilité connue en la marquant explicitement comme « à confirmer », ou embarquer une copie approximative des règles en assumant qu'elle peut se tromper — et dans ce cas l'interface doit rester prudente plutôt qu'affirmative.

> *"Offline I'd show the last known eligibility, explicitly marked as unconfirmed, rather than re-deriving the rules client-side and lying confidently."*

### 10.4 Des erreurs typées, parce qu'elles pilotent l'interface

**L'arbitrage.** Un `400` avec un message, ou un code d'erreur machine ?

**Le critère : chaque cause appelle-t-elle une interface différente ?** Ici, massivement oui.

| Code | Ce que fait l'interface | L'enjeu |
|---|---|---|
| `SESSION_FULL` | rollback, proposer la liste d'attente | rétention |
| `SEAT_TAKEN` | retour au sélecteur de place | expérience |
| `ALREADY_BOOKED` | **pas une erreur** — montrer la réservation | ne pas alarmer |
| `NO_CREDITS_LEFT` | proposer l'achat d'un pack | **revenu** |
| `NOT_COVERED_BY_PLAN` | proposer une montée de gamme | **revenu** |
| `BOOKING_WINDOW_CLOSED` | « ouvre le 3 août à 9h » + rappel | rétention |
| `CANCELLATION_TOO_LATE` | expliquer la politique | support évité |
| `PAYMENT_FAILED` | changer de moyen de paiement | **revenu** |

**Deux points à faire.**

D'abord, **le message affiché appartient au client**. Le code est pour la machine ; le texte doit être traduit, adapté au ton de la marque, et accompagné de la bonne action. Afficher le message brut du serveur est un raccourci qui produit des interfaces incohérentes et parfois des fuites d'information.

Ensuite, **`ALREADY_BOOKED` n'est pas une erreur**. C'est le résultat normal d'un retry réussi ou d'un double-clic. Le traiter comme une erreur affiche une alerte anxiogène dans une situation où tout va bien. Ce détail est un excellent marqueur : il montre que tu penses aux chemins non nominaux comme à des expériences utilisateur, pas comme à des cas d'exception.

> *"Three of these codes are revenue opportunities rather than failures. And ALREADY_BOOKED isn't an error at all — it's usually a successful retry. Showing an error there scares the user for nothing."*

### 10.5 Le temps, dans le contrat

Les instants transitent en **UTC**, la **timezone du studio accompagne la donnée**, et le rendu se fait dans cette timezone. Le fuseau de l'appareil ne sert que pour des affichages relatifs (« dans 2 heures ») ou pour avertir un membre qui voyage. On développe au chapitre 20 — mais pose le principe ici, parce que c'est un champ du contrat.

---

## 11. Où vit l'état, et avec quelle librairie

### 11.1 La séparation en quatre

C'est un marqueur de maturité immédiat. Énonce-le clairement.

**État serveur** — sessions, disponibilité, places, mes réservations, mon pack, plan de salle.
*Caractéristiques :* je ne le possède pas, il peut être périmé, il se revalide, il se garbage-collecte.

**État UI local** — modale ouverte, place survolée, étape du parcours, position de scroll.
*Caractéristiques :* éphémère, non partagé, meurt avec le composant.

**État client global** — session d'authentification, thème du tenant, locale, statut réseau, file d'actions offline.
*Caractéristiques :* transverse, persistant, peu de consommateurs mais dispersés.

**État d'URL** — date, filtres, cours sélectionné.
*Caractéristiques :* partageable, bookmarkable, survit au rechargement.

**Le critère qui range chaque chose : la portée et le cycle de vie.** Qui en a besoin, et quand ça meurt.

**L'erreur à nommer explicitement**, parce que c'est la plus répandue :

> *"The classic mistake is putting server data in Redux. It has a completely different lifecycle — caching, staleness, background revalidation, garbage collection — and you end up reimplementing all of that by hand inside reducers. I keep the global store for cross-cutting client state and the offline queue."*

**Et l'erreur symétrique**, moins souvent citée : tout colocaliser puis faire remonter par props sur cinq niveaux. La règle est de colocaliser par défaut, remonter quand c'est prouvé nécessaire, et préférer la composition par enfants au prop drilling.

### 11.2 L'URL comme état applicatif

Un point court mais qui frappe. `/studio/42/schedule?date=2026-08-05&discipline=yoga` — la date et les filtres vivent dans l'URL, parce qu'un membre veut envoyer « viens à ce cours » à un ami, revenir en arrière après avoir ouvert un cours, et retrouver ses filtres après un rechargement.

**Le piège à mentionner : le bouton retour.** Si la modale de réservation s'ouvre sans toucher à l'URL, le retour Android sort de l'application au lieu de fermer la modale. C'est l'un des motifs de désinstallation les plus classiques sur mobile, et c'est invisible en développement sur desktop.

### 11.3 Le choix de la librairie de data fetching

**Le socle commun.** TanStack Query, SWR et RTK Query font tous cache, déduplication de requêtes, revalidation en arrière-plan, stale-while-revalidate, états de chargement et d'erreur. Sans eux, tu réimplémentes tout ça — mal.

Et **aucun des trois ne fait de cache normalisé automatique**. C'est une limite à connaître, on y revient juste après.

| | **TanStack Query v5** | **SWR** | **RTK Query** |
|---|---|---|---|
| Poids | ~13 KB gz | **~4 KB gz** | ~13 KB + RTK + React-Redux |
| Prérequis | aucun | aucun | **Redux** |
| Invalidation | query keys, chirurgicale | manuelle par clé | **tags**, déclaratif |
| Optimistic | complet, rollback intégré | manuel | via `onQueryStarted` |
| DevTools | excellents | limités | Redux DevTools, time-travel |

**TanStack Query** est le plus complet : mutations, optimiste avec rollback, prefetching, SSR avec contrôle fin, devtools de référence, la plus large communauté. En face : trois fois le poids de SWR, plus de concepts à maîtriser (`staleTime` contre `gcTime`, structural sharing), et une v5 qui a introduit des ruptures.

**SWR** assume le minimalisme : quatre kilo-octets, très élégant avec Next.js. Sur une application en lecture dominante, **la simplicité est une fonctionnalité, pas une limite**. En face : tu plafonnes dès que les mutations se complexifient, l'invalidation est manuelle, et il n'a pas de vraie notion de stale-time ni de revalidation conditionnelle.

**RTK Query** est le bon choix **exactement quand ça en a l'air** : quand Redux Toolkit est déjà là. Il élimine le boilerplate des thunks, rend l'invalidation déclarative par tags, et donne le time-travel debugging. En face : il requiert Redux, impose beaucoup de concepts spécifiques, ses définitions sont verbeuses, et le poids cumulé est conséquent.

**Les deux questions qui tranchent :** Redux est-il déjà là ? Et quelle est la complexité des mutations ?

**Ta réponse, avec ton angle personnel :**

> *"If the app already runs on Redux, I'd default to RTK Query — adding TanStack Query alongside means two competing data paradigms in one codebase, and that's a real maintenance and onboarding cost I've watched play out. On greenfield with no Redux, TanStack Query: better invalidation ergonomics and devtools, without paying the Redux tax. And I'd never adopt Redux just to get RTK Query."*

**Et le point qui montre vraiment la séniorité :**

> *"The decision is driven by mutation complexity, not reads. All three cache a list of classes just fine. It's this booking flow — optimistic update, rollback on conflict, idempotent retry, reconciliation with a live event — that separates them."*

### 11.4 Cache document contre cache normalisé

**Le problème.** Les trois librairies stockent des **réponses entières** sous une clé. La même entité peut donc exister en plusieurs copies : le cours 42 est dans le planning, dans « mes réservations », et dans l'écran de détail. J'annule depuis le détail — les deux autres mentent jusqu'à revalidation.

*Un cache normalisé* (Apollo, Relay) stocke les entités à plat par identifiant, les vues n'en tenant que des références. Une mise à jour se propage partout instantanément. Mais ça coûte : identifiants globaux fiables, garbage collection, et les listes doivent quand même être invalidées séparément — une nouvelle entité n'apparaît pas magiquement dans une liste.

**La réponse : cache document, avec une discipline d'invalidation.** Concrètement, structurer les query keys hiérarchiquement — `['sessions', studioId, date]` — pour pouvoir invalider par préfixe après une mutation.

**Le lien à faire, et il montre la cohérence de ton système de décisions :**

> *"If that pain grew — if the app became genuinely graph-shaped and stale copies started causing real bugs — that's precisely where GraphQL with Apollo would earn its complexity. Its normalized cache is the best thing about it. But I wouldn't buy that upfront."*

### 11.5 La fraîcheur, par type de donnée

Un point court qui montre que tu as vraiment manipulé ces outils : **une seule valeur globale de fraîcheur est toujours un mauvais compromis**.

| Donnée | Fraîcheur | Pourquoi |
|---|---|---|
| Plan de salle | heures | ne change qu'en cas de réaménagement |
| Disciplines, profs | ~1 heure | quasi statique |
| Structure du planning | quelques minutes | change peu dans la journée |
| **Disponibilité** | **zéro + canal temps réel** | change à la seconde |
| Mon profil, mes crédits | invalidé après mutation | change quand j'agis |

> *"Stale time per data type, not one global value. Too short and I hammer the API; too long and I show phantom spots."*

---

## 12. Les états de l'interface

Deux niveaux à distinguer nettement. La plupart des candidats n'en voient qu'un.

### 12.1 Niveau technique : toute donnée distante

| État | Rendu attendu |
|---|---|
| **idle** | rien de demandé encore |
| **loading initial** | **skeleton à la forme du contenu**, pas un spinner centré |
| **success** | le contenu |
| **empty** | « Aucun cours ce jour » + action. **Ce n'est pas une erreur** |
| **error** | message clair + réessayer, en distinguant réseau et serveur |
| **refetching** | contenu affiché + indicateur discret |
| **optimistic** | valeur anticipée + état visuel « en cours » |
| **offline** | bandeau + cache + actions en file |

**Les deux points qui séparent le senior du reste.**

**Ne jamais confondre vide et erreur.** Un planning vide un dimanche n'est pas une panne. Afficher « une erreur est survenue » quand il n'y a simplement pas de cours génère du support inutile et de l'anxiété.

**Ne jamais retomber en skeleton lors d'un rafraîchissement.** C'est *littéralement* la différence entre une application qui semble lente et une application qui semble instantanée. Si tu re-skeletonises à chaque revalidation en arrière-plan, l'écran clignote et l'utilisateur perçoit chaque interaction comme un rechargement. La distinction chargement initial contre rafraîchissement de fond est une décision d'architecture de l'état, pas un détail cosmétique.

### 12.2 Niveau métier : la carte d'un cours

| État | Rendu | Action |
|---|---|---|
| `BOOKABLE` | places restantes, CTA plein | Réserver |
| `ALMOST_FULL` | badge « 2 places restantes » | Réserver — *levier de conversion* |
| `FULL` | complet | Rejoindre la liste d'attente |
| `WAITLISTED_BY_ME` | « Tu es 3e » | Quitter la liste |
| `BOOKED_BY_ME` | badge confirmé | Annuler / Voir |
| `PENDING` | CTA désactivé + indicateur | — |
| `INELIGIBLE` | « Pas inclus dans ton pack » | **Upgrader / Acheter** |
| `BOOKING_NOT_OPEN` | « Ouvre le 3 août à 9h » | Me prévenir |
| `CANCELLATION_LOCKED` | « Gratuit jusqu'à 12h avant » | Annuler avec avertissement |
| `CANCELLED_BY_STUDIO` | barré + motif | — |
| `PAST` | grisé | — |

**Le point à marteler : `INELIGIBLE`.**

C'est le cas que la grande majorité des candidats oublie, parce qu'ils modélisent la disponibilité et s'arrêtent là. Or « le cours est complet » et « ton pack ne couvre pas ce cours » sont deux échecs **totalement différents**. Le premier propose une liste d'attente. Le second est une **opportunité de vente** — le membre veut venir, il a de l'argent, il lui manque juste le bon pack.

> *"If I collapse those two into one 'you can't book this' state, I've turned a sales opportunity into a dead end. And that's the studio's revenue, not just a UX detail."*

C'est ton meilleur lien technique-vers-business de tout l'entretien, et il tient en deux phrases.

**Un deuxième point, plus subtil, à sortir si tu as le temps : certains de ces états périment tout seuls.** À 17h59 l'annulation est gratuite, à 18h01 elle ne l'est plus, et **aucun message serveur ne t'a prévenu**. C'est un cas rare : une donnée qui devient fausse par le simple passage du temps. La conséquence est qu'il faut soit un timer qui recalcule à l'échéance, soit une revalidation au retour de focus, soit — le plus important — une **revérification au moment de l'action**. Ne jamais autoriser une annulation gratuite sur la foi d'un état rendu il y a dix minutes.

### 12.3 La machine à états du parcours

```
IDLE
 └─> CONFIRMING              récap : cours, prof, horaire, coût
      ├─> SELECTING_SEAT     si place attribuée
      ├─> PAYING             si non couvert par le pack
      ├─> SUBMITTING         optimiste : UI déjà à jour
      ├─> SUCCESS            confirmation + ajout au calendrier
      └─> FAILED ──> raison typée :
             SEAT_TAKEN      → retour au sélecteur
             SESSION_FULL    → proposer la liste d'attente
             PAYMENT_FAILED  → changer de moyen
             NETWORK         → retry auto, même clé
```

**L'arbitrage : machine à états ou booléens ?**

Cinq booléens — `isLoading`, `isError`, `isSuccess`, `hasSeat`, `isPaying` — donnent trente-deux combinaisons, dont l'immense majorité sont **impossibles** mais **représentables**. Ce qui est représentable est atteignable par un bug. Et la logique de rendu devient une cascade de conditions imbriquées que personne n'ose refactorer.

Une **union discriminée** rend les états impossibles non représentables, force TypeScript à traiter chaque cas, et fait vivre les données propres à un état dans cet état — la raison d'échec n'existe que dans `FAILED`, on ne peut pas y accéder ailleurs.

Une **machine à états formelle** (XState) ajoute la validation des transitions et la visualisation, au prix d'une dépendance et d'une courbe d'apprentissage.

**La réponse : union discriminée en TypeScript, sans dépendance.** On obtient l'essentiel de la garantie pour un coût nul. XState si le graphe devient vraiment complexe — parallélisme, états imbriqués, historique.

**La phrase**, qui marie ton TypeScript avancé et ton sens de l'architecture :

> *"A discriminated union rather than a handful of booleans — five booleans give you thirty-two combinations, most of which are impossible but still representable, so a bug can reach them. With a union, impossible states are unrepresentable and the compiler forces me to handle every case."*

---
---

# PARTIE IV — LE CŒUR

## 13. Minutes 35–50 : le flow de réservation

C'est ton morceau de bravoure. Si tu ne maîtrises parfaitement qu'une chose dans tout ce document, c'est cet enchaînement.

### 13.1 L'enchaînement complet

Raconte-le comme une histoire, en suivant la donnée :

**1. Le clic.** Une clé d'idempotence est générée — un UUID, généré **au clic**, pas au moment de la requête. On y revient, c'est le point le plus subtil.

**2. La mise à jour optimiste.** On prend un snapshot de l'état actuel du cache, on décrémente les places restantes, la carte passe en `PENDING`. L'utilisateur voit le résultat immédiatement.

**3. La requête** part avec la clé dans un header.

**4a. Succès.** On écrit la réponse dans le cache, puis on **invalide** les clés liées — la session, mes réservations, mon pack — pour resynchroniser en arrière-plan. La carte passe `BOOKED_BY_ME`.

**4b. Échec métier** (`SESSION_FULL`). On **rollback** vers le snapshot, la carte passe `FULL`, et on propose la liste d'attente. L'échec est expliqué, pas silencieux.

**4c. Échec réseau.** On retente avec un délai croissant, **en réutilisant la même clé**. Pas de double réservation possible.

**5. En parallèle**, un event temps réel peut modifier la même session. La réconciliation doit s'appliquer **sans écraser** la mutation optimiste en vol.

### 13.2 L'arbitrage : optimiste ou pessimiste ?

*Pessimiste* — spinner, puis mise à jour à la réponse. Jamais de mensonge à l'écran, code simple, pas de rollback. Mais chaque action semble lente : sur un réseau à 300 millisecondes, l'application paraît poussive.

*Optimiste* — l'interface change immédiatement, rollback en cas d'échec. Perçu instantané, et **c'est directement une amélioration de l'INP**. Mais c'est plus complexe, et surtout ça **risque de mentir**.

**Le critère : la probabilité de succès, et le coût d'un mensonge.**

**La réponse, et c'est là que c'est intéressant : différencié par action, voire par contexte.**

| Action | Stratégie | Pourquoi |
|---|---|---|
| Annuler | optimiste | réussit presque toujours |
| Rejoindre une liste d'attente | optimiste | pas de rareté |
| Réserver un cours à moitié vide | optimiste | conflit improbable |
| **Réserver la dernière place** | prudent | conflit probable |
| Payer | pessimiste | jamais de faux « payé » |

Le raffinement qui montre la finesse : **moduler l'optimisme selon le nombre de places restantes**. Sur les dernières places, un « confirmation en cours » honnête vaut mieux qu'un « c'est bon ! » suivi d'un « en fait non ».

**Et le point à ne pas rater :**

> *"Optimism doesn't remove failure handling — it makes failure more visible, because the user already saw success. So the rollback has to explain itself: 'that spot was just taken, here are three alternatives', never a silent revert."*

### 13.3 L'invalidation : le vrai sujet du cache

**L'arbitrage.** Après une mutation réussie, comment resynchroniser ?

*Invalider et refetch* — tu récupères la vérité serveur, tu ne peux pas te tromper dans ta transformation locale. Mais c'est un aller-retour de plus.

*Écrire la réponse dans le cache* — instantané, zéro requête. Mais tu dois transformer correctement, et **le reste de l'écran peut rester périmé**.

**Le critère : la mutation affecte-t-elle des données au-delà de ce qu'elle renvoie ?** Ici, oui — une réservation change la session, mais aussi mes crédits, mes prochaines réservations, et éventuellement une liste d'attente. La réponse ne contient pas tout ça.

**La réponse : les deux.** Écriture optimiste immédiate pour la perception, réponse écrite au succès, **puis invalidation en arrière-plan** des clés impactées. L'utilisateur voit instantanément, la cohérence globale se rétablit en silence.

**Le piège :** garder le **snapshot d'avant mutation**, sinon le rollback ne peut pas être propre. Et si deux mutations optimistes sont en vol sur la même donnée, un rollback naïf de la première écrase la seconde — d'où l'intérêt d'utiliser les mécanismes fournis par la librairie plutôt qu'un `setState` maison.

---

## 14. Concurrence, idempotence, retry

### 14.1 L'idempotence, expliquée proprement

**Le problème.** Le client envoie la requête. Le serveur crée la réservation. La réponse se perd — réseau coupé, timeout. Le client croit à un échec et retente. **Deux réservations, deux débits.**

**Où naît la clé ?** Trois options, deux mauvaises :

*Générée par le serveur* : impossible. Le serveur ne peut pas savoir que deux requêtes distinctes représentent la **même intention utilisateur**.

*Générée par le client au moment de la requête* : cassé, et c'est l'erreur classique. Chaque retry génère une nouvelle clé, donc chaque retry crée une nouvelle réservation. Tu as l'impression d'avoir résolu le problème et tu ne l'as pas touché.

*Générée par le client au moment de l'intention* — le clic : correct. La même clé est réutilisée pour **toutes** les tentatives de cette intention.

**Pourquoi c'est une responsabilité frontend**, et c'est le point à faire :

> *"The key is tied to the user's intention, not to the HTTP request. That's why it's a frontend responsibility — only the client knows that this retry is a continuation of the same click. The server can't infer it."*

**Ça couvre trois scénarios d'un coup :** le double-clic impatient, le retry automatique après timeout, et la resynchronisation d'une action mise en file hors ligne il y a une heure.

**Le point le plus subtil, à garder pour si on te pousse : quand faut-il régénérer la clé ?** Si l'utilisateur reçoit `SESSION_FULL`, rejoint la liste d'attente, puis une place se libère et il réserve à nouveau — c'est une **nouvelle intention**, donc une **nouvelle clé**. Réutiliser l'ancienne ferait renvoyer l'ancien échec par le serveur. La règle : **une clé par intention, une nouvelle intention à chaque fois que l'utilisateur reprend une décision.**

Et un corollaire de portée : la clé doit couvrir **la réservation et le paiement associé**, sinon tu protèges d'une double réservation mais pas d'un double débit.

### 14.2 Le retry : que retenter, et que surtout ne pas retenter

| Situation | Retry ? | Pourquoi |
|---|---|---|
| Timeout, erreur réseau | oui, backoff + jitter | transitoire, issue inconnue |
| `5xx` | oui, borné | probablement transitoire |
| `429` | oui, en respectant `Retry-After` | le serveur t'a dit quoi faire |
| `4xx` métier | **non** | retenter ne changera rien |
| `401` | non — rafraîchir le token puis rejouer | c'est une réauth, pas un retry |
| Mutation sans clé d'idempotence | **non** | risque de doublon |

**Les paramètres, et pourquoi chacun compte.**

Le **backoff exponentiel** — 1s, 2s, 4s — évite de marteler un serveur qui souffre.

Le **jitter**, un aléatoire ajouté au délai, est indispensable et souvent oublié. Sans lui, **tous les clients retentent en même temps** et achèvent le serveur au moment précis où il commence à se relever. C'est un détail qui montre que tu as pensé au comportement agrégé, pas seulement au cas d'un client isolé.

Une **borne** — trois tentatives — puis on rend la main à l'utilisateur avec un bouton explicite. Et un **timeout** sur chaque tentative : un appel réseau sans timeout est un bug qui attend.

**Le lien entre les deux sections, à énoncer :**

> *"Retries and idempotency aren't two topics, they're one. I only auto-retry operations that are idempotent — a silent retry on a non-idempotent mutation is a duplicate generator."*

**Et un point UX** : ne pas retenter en silence pendant dix secondes en laissant l'utilisateur devant un indicateur sans explication. Au bout de quelques secondes, dire ce qui se passe.

### 14.3 L'anti-double-submit, en quatre couches

1. **Interface** — désactiver le bouton. Nécessaire, très insuffisant.
2. **Client** — déduplication des mutations en vol.
3. **Protocole** — la clé d'idempotence. **La vraie protection.**
4. **Serveur** — contrainte d'unicité en base. Le filet ultime.

**Il faut les quatre**, mais seules les couches 3 et 4 sont des **garanties**. Les deux premières sont du confort.

**C'est un excellent moment pour montrer que tu connais les limites de ton périmètre.** Un candidat moyen répond « je désactive le bouton ». Un candidat senior dit :

> *"Disabling the button is UX, not correctness. Two tabs, a direct API call, or an offline resync walk straight past it. The actual guarantee is the idempotency key plus a server-side uniqueness constraint. I can make the happy path feel instant — correctness has to live server-side."*

Cette phrase est précieuse parce qu'elle démontre trois choses simultanément : tu connais la solution client, tu sais qu'elle est insuffisante, et tu sais où vit la vraie garantie. C'est exactement le profil d'un frontend senior qui dialogue bien avec le backend.

---

## 15. Minutes 50–60 : le temps réel

### 15.1 L'arbitrage de transport

| | **Polling** | **SSE** | **WebSocket** |
|---|---|---|---|
| Direction | client demande | **serveur → client** | **bidirectionnel** |
| Protocole | HTTP | HTTP (`text/event-stream`) | upgrade dédié |
| Reconnexion | n/a | **automatique + `Last-Event-ID`** | à ta charge |
| Latence | = l'intervalle | faible | faible |
| Coût | requêtes inutiles | connexions maintenues | connexions stateful |
| Complexité | ★ | ★★ | ★★★ |

**Polling** est trivial, ne demande aucune infrastructure, se cache, et dégrade gracieusement. Mais la latence égale l'intervalle, et la grande majorité des requêtes renvoient « rien n'a changé ».

**SSE** est un flux d'événements poussé sur une connexion HTTP maintenue ouverte. Trois arguments en sa faveur : **c'est du HTTP ordinaire**, donc ça traverse proxies et firewalls sans configuration ; la **reconnexion est automatique et intégrée**, avec un header `Last-Event-ID` qui permet au serveur de **rejouer les événements manqués** ; et le besoin ici est purement unidirectionnel. Ses limites : unidirectionnel, texte seulement, et la limite de connexions dont on parle juste après.

**WebSocket** est bidirectionnel et binaire, avec la latence la plus faible. Mais il est stateful — le load balancing devient collant — et la reconnexion, le heartbeat, la reprise après coupure sont **à ta charge**. Tu paies le bidirectionnel même si tu ne l'utilises pas.

**Le critère : le client a-t-il besoin d'émettre en continu ?**

**La réponse :**

> *"For live availability, SSE. The need is purely server-to-client, it's plain HTTP, and the automatic reconnect with Last-Event-ID means the server can replay what I missed — with WebSockets I'd write all of that myself. I'd only reach for WebSockets where the interaction is genuinely bidirectional, like shared seat selection."*

**Le challenge attendu : « pourquoi pas WebSocket partout ? »** La réponse est que tu paierais un canal bidirectionnel, une infrastructure stateful et ta propre logique de reconnexion pour un besoin unidirectionnel. **Le bon transport est le plus simple qui satisfait le besoin** — et c'est exactement la démonstration qu'ils attendent avec « start simple, then refine ».

### 15.2 SSE et les versions HTTP

**Le fait :** SSE fonctionne sur HTTP/1.1, HTTP/2 et HTTP/3. Ce n'est pas lié à une version — c'est une réponse `text/event-stream` maintenue ouverte, disponible depuis HTML5.

**Ce qui change, c'est la limite de connexions concurrentes par domaine.**

En **HTTP/1.1**, le navigateur plafonne à environ six connexions par domaine. Or une connexion SSE reste ouverte en permanence. Plusieurs onglets sur ton application, c'est plusieurs streams, et le budget est saturé — **les autres requêtes se bloquent en file d'attente**.

Ce bug est particulièrement déroutant à diagnostiquer, et c'est ce qui rend l'anecdote parlante : le rapport de bug qui arrive est *« l'application se fige quand j'ai trois onglets ouverts »*, ce qui ne ressemble à rien.

En **HTTP/2 et HTTP/3**, les requêtes sont multiplexées sur une seule connexion TCP, avec une centaine de streams concurrents configurables. Le problème disparaît.

> *"SSE works on any HTTP version, but I'd want HTTP/2 — otherwise the six-connections-per-domain cap can starve every other request when a few tabs each hold an open stream."*

**Deux nuances si on creuse.** La limite est **côté navigateur**, pas serveur ; côté serveur le coût est le nombre de connexions longues à maintenir, ce qui oriente vers un backend asynchrone. Et il existe une **parade même en HTTP/1.1** : partager une seule connexion SSE entre tous les onglets via un `SharedWorker` qui rediffuse. À ne sortir que si on creuse vraiment — sinon c'est de la sur-conception.

### 15.3 Delta ou snapshot, et pourquoi le versionnement

**L'arbitrage.** Un snapshot complet de la session est simple et idempotent, mais lourd s'il est répété souvent. Un delta est minuscule, mais **suppose que tu as reçu tous les précédents, dans le bon ordre**.

**La réponse : delta plus numéro de version monotone.**

```json
{ "sessionId": "s_42", "version": 118, "changes": [{ "seatId": "v12", "status": "BOOKED" }] }
```

Le numéro de version sert à trois choses :

**Rejeter un événement arrivé dans le désordre** — je reçois la version 117 après la 118, je l'ignore.

**Détecter un trou** — je suis à 115, je reçois 118, donc j'ai manqué des événements. Je fais une **resynchronisation complète** plutôt que de patcher à l'aveugle sur une base incomplète.

**Ignorer un événement déjà appliqué.**

**Le piège :** un delta sans versionnement est une bombe à retardement. Tu ne détectes jamais que tu as raté quelque chose, et ton écran **diverge silencieusement** de la réalité. Toujours prévoir une stratégie de resynchronisation — et c'est exactement ce que le `Last-Event-ID` de SSE facilite.

### 15.4 La réconciliation avec le cache

C'est le vrai sujet frontend du temps réel, et il faut le traiter comme tel.

**Un événement entrant ne doit pas écraser une mutation optimiste en vol.** Si je viens de cliquer « Réserver » et que mon interface affiche déjà la place prise, un événement serveur qui dit « il reste 3 places » ne doit pas la remettre. La réconciliation doit connaître les mutations en cours.

**À la reconnexion**, resynchroniser l'état visible plutôt que de rejouer un historique potentiellement long.

**Batcher les mises à jour.** Si deux cents places changent en une seconde, on n'applique pas deux cents re-renders — on agrège sur un tick d'animation. Point de performance tangible et facile à énoncer.

**S'abonner au visible seulement**, et se désabonner quand l'onglet est caché, avec resynchronisation au retour. C'est un réflexe mobile — batterie et budget de connexion — qui montre que tu penses aux conditions réelles d'usage.

---

## 16. Le SeatSelector

### 16.1 Ce que c'est, et pourquoi c'est le bon deep-dive

C'est le composant du « choose your spot ». Sur certains cours — spinning avec vélos numérotés, reformer pilates — on ne réserve pas une place abstraite, mais **une place précise** sur un plan de salle.

C'est **le seul composant qui justifie vraiment WebSocket**, et il condense à lui seul tous les sujets difficiles. Si on te demande de creuser quelque chose et qu'on te laisse le choix, propose celui-ci.

### 16.2 Trois couches d'état, trois durées de vie

C'est le point de conception le plus important, et il découle directement du principe « la disponibilité est une projection » :

**Le plan de salle** — donnée serveur quasi statique, cachable pendant des heures. Ne change qu'en cas de réaménagement.

**L'état des places pour cette session** — volatile, temps réel, jamais persisté.

**Ma sélection courante** — état UI purement local, qui n'a aucun sens hors du parcours.

> *"Two separate resources with two different cache lifetimes. If I merge them into one payload, I re-download the entire room layout on every availability update — which is pure waste on a channel that fires several times a second."*

### 16.3 La concurrence, à la granularité de la place

On pose un **hold optimiste** sur la place cliquée pour un retour instantané, mais elle n'est garantie qu'après validation serveur. Si quelqu'un l'a prise entre-temps, rollback et « choisis une autre place ». C'est la même logique que le double-booking, appliquée à une granularité plus fine.

### 16.4 Les points qui font la différence

**L'UX du conflit.** L'état « place prise à l'instant » doit être **animé, pas brutal**. Une place qui disparaît sèchement pendant qu'on la vise est déroutante ; une transition douce communique ce qui se passe. C'est un détail, mais c'est le genre de détail qui distingue quelqu'un qui a construit des interfaces de quelqu'un qui les a spécifiées.

**La réconciliation.** Un événement « place 12 prise » ne doit jamais écraser ma sélection en cours.

**L'accessibilité, et c'est le point à soulever spontanément.** C'est **le composant le plus difficile à rendre accessible de toute l'application**. Une grille visuelle cliquable est inutilisable au lecteur d'écran. Il faut une sélection au clavier, avec des libellés qui portent l'information spatiale et l'état : « Vélo 12, disponible, premier rang ». Et il faut annoncer les changements sans noyer l'utilisateur sous les notifications vocales.

> *"The seat selector is the hardest thing in this app to make accessible. A clickable grid gives a screen reader nothing — you need keyboard selection with labels that carry position and status, and live announcements that are informative without being constant."*

Soulever ça de toi-même, sans qu'on te le demande, est un signal fort. La plupart des candidats parlent d'accessibilité uniquement si on les interroge, et en termes génériques.

---
---

# PARTIE V — DURCIR

## 17. Offline

### 17.1 Les niveaux, par coût croissant

**Niveau 0 — rien.** Écran d'erreur hors ligne. Coût nul, expérience mauvaise.

**Niveau 1 — lecture en cache.** Le membre voit son planning et **sa réservation à montrer à l'accueil**. Coût faible, valeur très élevée.

**Niveau 2 — écriture en file.** Réservation optimiste rejouée à la reconnexion. Coût élevé — file, ordre, conflits, expiration — et valeur discutable.

**Niveau 3 — offline-first complet.** Coût très élevé.

### 17.2 L'arbitrage, et pourquoi il est plus produit que technique

**Le critère est l'usage réel.** L'argument concret : le réseau est souvent mauvais dans les studios, fréquemment en sous-sol. Et le besoin dominant dans ce contexte est de **consulter et prouver** sa réservation, pas d'en créer une.

**La réponse : niveau 1 systématiquement, niveau 2 seulement si les données d'usage le justifient.**

**Et voici le point qui vaut d'être fait, parce qu'il montre du jugement produit plutôt que de l'enthousiasme technique :**

> *"Offline booking is technically attractive and honestly questionable in value. I'd be promising a spot I can't guarantee — the member thinks they're booked, walks in, and there's no bike. A feature that fails silently is worse than not having it. If we did build it, the UI has to say 'pending confirmation', never 'confirmed'."*

C'est une position qui peut surprendre positivement : un candidat qui **refuse** une fonctionnalité séduisante pour de bonnes raisons est plus rassurant qu'un candidat qui accepte tout.

### 17.3 Si on implémente l'écriture

Les règles à énumérer, parce que c'est là que se joue la qualité :

**L'ordre.** Rejouer les actions dans l'ordre d'émission. Réserver puis annuler n'est pas annuler puis réserver.

**L'expiration.** Une action en file pour un cours **déjà passé** doit être abandonnée, pas rejouée. Sinon tu réserves un cours d'hier.

**La compaction.** Réserver puis annuler avant la resynchronisation devrait s'annuler localement plutôt que produire deux appels.

**L'idempotence.** La clé générée hors ligne protège du doublon si l'action avait en fait réussi avant la coupure.

**La notification.** Si l'utilisateur a fermé l'application, il doit apprendre le résultat autrement — notification, ou état clair à la réouverture.

**La résolution de conflit : server-wins, sans hésitation.** Une place est une ressource exclusive : il n'y a rien à fusionner. Les CRDT sont hors sujet ici, et savoir le dire montre que tu connais l'outil **et** son domaine d'application.

### 17.4 Le service worker

**Une stratégie par type de ressource**, pas une politique globale :

| Ressource | Stratégie |
|---|---|
| Assets hashés, polices | cache-first |
| Shell de l'application | cache-first + mise à jour de fond |
| Plan de salle, disciplines | stale-while-revalidate |
| Planning | network-first avec fallback |
| Disponibilité | network-only |
| Mutations, paiement | network-only |

**Le piège classique, et il est douloureux : le service worker bloqué sur une vieille version.** Un service worker mal géré sert indéfiniment une application périmée, et tes utilisateurs ne voient jamais tes correctifs. Il faut une **stratégie de mise à jour explicite** : détecter le nouveau, et soit inviter au rechargement, soit activer immédiatement — en sachant que l'activation immédiate peut casser une session en cours si les assets changent sous les pieds de l'application.

**Et le stockage :** IndexedDB pour la file d'actions, parce qu'il est **asynchrone et transactionnel** — localStorage est synchrone, donc il bloque le thread principal, et une file corrompue est pire que pas de file. Les tokens restent en mémoire. Trois points à mentionner : versionnement du schéma avec migration, purge à la déconnexion (surtout sur appareil partagé), et le fait que **le navigateur peut évincer le stockage sous pression** — l'application doit fonctionner sans.

---

## 18. La stratégie de rendu

### 18.1 L'arbitrage par surface

| Surface | Choix | Pourquoi |
|---|---|---|
| Planning public, pages studio | **SSG/ISR** | indexable, identique pour tous, LCP rapide |
| Détail d'un cours partageable | **SSR** | indexable mais avec données fraîches |
| App membre | **CSR** | personnalisé, pas de SEO, très interactif |

**Les trois questions qui tranchent, dans l'ordre :** le contenu est-il public et indexable ? Est-il personnalisé ? Change-t-il souvent ?

### 18.2 Le point qui montre que tu ne récites pas

Le challenge attendu est *« pourquoi pas du SSR partout, c'est meilleur pour la perf ? »*. La réponse :

> *"SSR mainly improves LCP. Inside the member app, the user has been there for thirty seconds — the bottleneck isn't first paint, it's INP: how fast the Book button responds. SSR would add server cost and hydration complexity to optimize a metric that isn't the constraint here. And interestingly, the thing that actually improves INP on this screen is the optimistic update we discussed earlier."*

Ce lien entre la stratégie de rendu et le flow de réservation montre que tes décisions forment un système cohérent, pas une collection de choix indépendants.

### 18.3 Le piège multi-tenant

Avec un branding par studio, **le thème doit être connu avant le premier paint**, sinon flash de contenu non brandé. C'est un vrai argument en faveur du SSR sur les surfaces publiques : les tokens sont injectés côté serveur. En CSR pur, il faut soit inliner un CSS critique par tenant, soit accepter un écran de chargement neutre.

**Et l'arbitrage du theming lui-même**, puisqu'on y est. Un build par tenant donne un CSS optimal et zéro flash, mais **ne scale pas** : mille studios, mille builds, et un nouveau client attend un déploiement. La réponse est **un seul build avec des CSS custom properties**, tokens résolus le plus tôt possible.

**Le point à soulever, et il est excellent : l'accessibilité du theming.** Si un studio choisit du jaune clair sur blanc, les contrastes WCAG explosent. Il faut **valider les ratios de contraste au moment où le studio choisit ses couleurs**, dans le back-office, et prévoir des tokens dérivés automatiquement. Peu de candidats font ce lien entre multi-tenant et accessibilité.

---

## 19. Performance

### 19.1 Commencer par remettre en question le besoin

Si on te demande « comment tu virtualises ? », la meilleure réponse commence par une question :

> *"First — do we need to? We said a day of classes is about twenty cards. Virtualizing that is over-engineering, and it costs me browser search, deep-linking to an element, and screen-reader semantics. I'd virtualize if we're rendering a month across studios."*

C'est exactement le comportement « start simple » qu'ils évaluent, appliqué en direct à leur propre question. Et ça montre que tu relies ta réponse à la volumétrie établie en phase de clarification — ce qui prouve que cette phase servait à quelque chose.

**Et la vraie réponse pour un planning :** la pagination naturelle d'un calendrier est **une plage temporelle**, pas une page. On navigue par jour ou par semaine. Remettre en cause la formulation de la question plutôt que de choisir dans un menu imposé est un signal de séniorité.

### 19.2 Les re-renders : structure d'abord, mémoïsation ensuite

Le levier principal n'est **pas** la mémoïsation, c'est la **structure d'état** : colocaliser, découper les contextes — un contexte qui contient à la fois le thème et la position de scroll re-render tout à chaque scroll — et utiliser la composition par enfants, qui évite naturellement le re-render des descendants.

La mémoïsation vient après, **ciblée, aux frontières qui comptent**. Ici : mémoïser la carte de cours pour qu'un événement temps réel sur une session ne re-render pas les quarante autres. C'est un cas où le gain est structurel et prévisible, pas spéculatif.

Mentionner le React Compiler comme direction du framework est bienvenu, en restant prudent sur son statut exact.

### 19.3 Quelle métrique, et pourquoi ça dépend de la surface

**Planning public → LCP.** L'utilisateur arrive de Google et juge en une seconde.

**App membre → INP.** Il est déjà dedans ; ce qui compte est que « Réserver » réponde instantanément. Et l'update optimiste est exactement une optimisation d'INP.

**Partout → CLS**, et pas pour des raisons esthétiques : un layout qui saute au moment où la disponibilité se met à jour peut faire **cliquer sur le mauvais cours**. Ici, une instabilité visuelle produit une erreur de réservation.

**Le point sur la mesure :**

> *"And I'd measure in RUM, at p75 and p95 rather than averages. A perfect Lighthouse score on a wired MacBook tells me nothing about a mid-range Android on 4G in a basement — which is exactly our user."*

### 19.4 Le bundle

Découpage par route en base, plus du lazy sur les gros morceaux rarement atteints : le parcours de paiement, le `SeatSelector` — utile seulement pour certains cours — le back-office.

**Et le raffinement qui fait plaisir :** précharger à l'intention. Au survol du bouton « Réserver », on charge le chunk de la modale. Le code arrive avant le clic, l'utilisateur ne voit jamais la latence.

**Le piège :** trop de découpage produit une **cascade de requêtes de chunks** qui coûte plus cher que le monolithe évité. Et chaque frontière de lazy loading a besoin d'une error boundary avec retry — sinon une connexion qui lâche pendant le chargement d'un chunk casse l'application.

---

## 20. Accessibilité, i18n, sécurité

### 20.1 Les fuseaux horaires, en détail

C'est le sujet le plus casse-gueule d'une application de planning, et le traiter correctement est très visible.

**Le principe : l'heure locale du studio, toujours.** Un cours à 18h à Barcelone est à 18h pour tout le monde. Un membre parisien qui consulte doit voir 18h. C'est une propriété du **lieu**, pas de l'observateur.

**Le corollaire technique :** les instants transitent en UTC, la timezone du studio accompagne la donnée, le rendu se fait dans cette timezone. Le fuseau de l'appareil ne sert que pour « dans 2 heures » ou pour avertir un membre en voyage.

**Les pièges, et ils sont vicieux.**

**Le changement d'heure.** Un cours récurrent à 18h **locales** reste à 18h après le passage à l'heure d'hiver, alors que son instant UTC change. Donc **la récurrence se définit en heure locale, pas en UTC**. Générer les occurrences en ajoutant 168 heures à un instant UTC produit des cours décalés d'une heure deux fois par an — un bug classique, embarrassant, et difficile à diagnostiquer parce qu'il ne se manifeste que deux fois par an.

**L'heure qui n'existe pas ou qui existe deux fois.** Au passage à l'heure d'été, 2h30 n'existe pas ; à l'automne, elle existe deux fois. Un cours planifié à ce moment-là a besoin d'une règle explicite.

**Le rendu serveur.** Le serveur ne doit pas formater dans **son** fuseau, sinon le HTML rendu et l'hydratation divergent.

**Les outils :** l'API `Temporal` est conçue pour ça et rend ces cas explicites ; en attendant, `date-fns-tz` ou Luxon. **Éviter de manipuler des `Date` natives à la main** pour de la logique de fuseau.

> *"Generating recurring occurrences by adding 168 hours in UTC silently shifts every class by an hour, twice a year. Recurrence is defined in local time — that's the one thing I'd make sure is right from day one, because it's cheap now and it's a support nightmare later."*

### 20.2 i18n

**Le format :** ICU MessageFormat plutôt que des clés simples, parce qu'il gère les **pluriels** — le russe a plusieurs formes, l'arabe six — et le genre. Une interpolation naïve « {n} places restantes » casse au singulier et dans la moitié des langues.

**Le formatage** via l'API `Intl` native pour les dates, nombres, devises et listes, plutôt que des tables maison.

**Deux choses à intégrer tôt parce qu'elles sont gratuites maintenant et coûteuses plus tard :** les propriétés CSS logiques (`margin-inline-start`) au cas où le RTL arrive, et **tester le layout dans une langue verbeuse** plutôt qu'en anglais — l'allemand est souvent 30 % plus long, et un bouton dimensionné sur le français casse.

**Un cas à mentionner :** les descriptions de cours sont saisies **par les studios**, elles ne sont pas traduites. Que voit un membre qui ne parle pas cette langue ? Souvent rien de spécial — mais il faut le décider consciemment plutôt que de le découvrir en production.

### 20.3 Sécurité frontend

C'est un domaine où tu as de la profondeur, et c'est rare — exploite-le.

**Le stockage des tokens.** localStorage est trivial mais **accessible en JavaScript, donc exfiltrable par n'importe quel XSS**, y compris un XSS venu d'une dépendance compromise. Un cookie `httpOnly` est inaccessible au JS. La meilleure combinaison est **access token en mémoire, refresh token en cookie httpOnly**, avec rotation et détection de réutilisation.

**La nuance qui vaut plus que la réponse.** On entend souvent « si tu as un XSS tu as déjà perdu ». C'est une demi-vérité :

> *"httpOnly doesn't make XSS harmless — an attacker can still act inside the session from the page. But it stops them exfiltrating a token to use elsewhere and later, which changes the blast radius and the duration of the compromise. It's defense in depth, not a fix."*

**Le contexte bsport :** les descriptions de cours sont saisies par les studios, donc il y a une **surface XSS réelle**. Sanitisation systématique, prudence extrême avec `dangerouslySetInnerHTML`, CSP stricte.

**Le multi-tenant est aussi un sujet de sécurité**, et c'est le point à ne pas rater : **chaque clé de cache doit inclure l'identifiant du studio**. L'oublier ne produit pas un bug d'expérience, ça fait **fuiter les données d'un studio dans l'application d'un autre**. Dans un SaaS B2B2C, c'est un incident majeur.

**Le paiement :** les champs de carte restent dans les inputs hébergés du prestataire, pour que les données ne touchent jamais ton état ni ton périmètre PCI.

### 20.4 Accessibilité

Le périmètre : **WCAG AA sur les parcours critiques** — consulter, réserver, annuler, payer — avec les tests automatisables en CI et un audit manuel sur ces parcours.

Les points concrets sur cet écran : **gestion du focus** dans la modale (piégeage puis restauration sur le déclencheur), **le `SeatSelector`** (le plus dur, cf. §16.4), **les live regions** pour annoncer les changements de disponibilité — avec parcimonie, sinon le lecteur d'écran devient inutilisable — les **contrastes du theming tenant**, et des **cibles tactiles** suffisantes.

**L'argument qui convainc en réunion**, et ce n'est pas l'argument moral :

> *"Retrofitting accessibility costs several times more than building it in, because it touches DOM structure, semantics and focus order — not styling. It's a cost argument as much as an ethical one. And on a wellness product, the affected population is overrepresented, not marginal."*

---

## 21. Observabilité et débogage

Leur email demande explicitement « how you would monitor or debug the system ». Ne le survole pas.

### 21.1 Les couches

**Les erreurs** — tracking avec contexte (tenant, route, version) et **source maps**, sans lesquelles les stacks minifiées sont inutilisables.

**La performance réelle** — RUM sur les vrais appareils, segmenté par type d'appareil et de réseau, lu au **p75 et p95** plutôt qu'en moyenne. Une moyenne cache exactement les utilisateurs qui souffrent.

**Les traces** — un **identifiant de trace propagé du clic jusqu'au backend**. Ça permet de suivre une réservation ratée de bout en bout, et ça ne coûte qu'un header. C'est le levier de débogage qui change le plus la vie en production.

**Le métier** — le plus important, et le plus souvent oublié.

### 21.2 Les métriques métier

**Le taux de complétion du tunnel de réservation.** La métrique reine.

**Le taux d'échec par code d'erreur.** Une hausse de `PAYMENT_FAILED` est un incident même si aucun serveur n'est tombé.

**Le temps de confirmation perçu**, du clic au feedback — pas la latence API.

**Le taux de rollback optimiste.** Si les places sont prises entre l'affichage et le clic beaucoup plus souvent qu'avant, c'est que ta disponibilité temps réel est en retard. C'est une métrique qui **diagnostique une couche technique par un symptôme utilisateur**, et c'est le genre de chose qui impressionne.

### 21.3 Le point qui distingue vraiment

> *"A frontend can be perfectly healthy — zero JS errors, normal latency, every service green — and completely broken, because a button ended up invisible at one breakpoint or a condition blocked one step of the flow. No technical monitoring catches that. Only funnel completion does. So I'd alert on booking completion rate, not just error rate."*

C'est le passage qui montre que tu as opéré des applications en production, pas seulement construit des interfaces.

---
---

# PARTIE VI — CONCLURE

## 22. POC vs production, et l'impact business

### 22.1 La frontière

| Différable en POC | Jamais différable |
|---|---|
| Offline complet | **Anti-double-réservation** (idempotence) |
| Temps réel / WebSocket | **États d'erreur clairs et typés** |
| SSR / SEO | **Heures affichées justes** |
| Virtualisation | **Pas de faux « confirmé »** |
| i18n exhaustive | Sécurité de base |
| Design system complet | A11y clavier des parcours critiques |

**Le critère qui gouverne la frontière**, et c'est la formulation qui compte :

> *"What's deferrable is what I can add later without breaking anything or misleading anyone. What isn't deferrable is anything whose absence produces a lie to the user or loses the studio money."*

### 22.2 La grille d'impact

| Défaut technique | Conséquence métier |
|---|---|
| Tunnel lent ou confus | abandon → attendance en baisse |
| Double réservation | litige, remboursement, confiance perdue |
| Place fantôme | membre sur place sans machine |
| Mauvais fuseau | cours raté |
| `INELIGIBLE` mal géré | **vente manquée** |
| Pas d'offline | membre bloqué à l'accueil sans réseau |

### 22.3 Le point de posture

> *"A POC narrows scope, it doesn't lower correctness. Reducing what we support is legitimate; reducing whether it's right isn't."*

Cette distinction est exactement ce que leur email teste avec « how you arbitrage between a quick proof of concept and a production ready system ». La plupart des candidats répondent en termes de « ce qu'on peut bâcler ». La bonne réponse est en termes de **périmètre**, pas de qualité.

---

## 23. Quand ils te poussent vers le backend

Ils le feront, parce que c'est la façon la plus rapide de sonder les limites d'un candidat frontend. Voici ce qu'il faut pouvoir mobiliser, et surtout **comment délimiter proprement**.

**Le double-booking côté serveur.** La garantie ne peut pas venir du client. Le serveur sérialise les écritures concurrentes — une opération atomique du type « décrémente **si** il reste de la place ». Ce que tu dois en retenir : le serveur est source de vérité, ton rôle est de gérer élégamment son refus.

**Le hold and confirm.** Si le paiement prend du temps, le serveur pose un verrou temporaire avec expiration, puis confirme. D'où l'état `PENDING` et le compte à rebours dans ton interface.

**La cohérence paiement / réservation.** Entre deux services, on utilise des **sagas** — des étapes compensables : si le paiement échoue après la réservation, une action compensatoire annule ou rembourse. **La conséquence frontend est directe** : la confirmation peut être **asynchrone**, donc il faut un état « en cours de confirmation » et un mécanisme pour apprendre le résultat (canal temps réel, polling, ou notification).

**Le cache serveur.** Ta disponibilité peut être servie depuis un cache. Donc une valeur légèrement périmée est normale, ce qui reboucle sur le principe du §9.5.

**La phrase qui délimite proprement**, et qui est probablement la plus utile de tout l'entretien face à ce type de question :

> *"The correctness guarantee has to live server-side — I can't prevent double-booking from the client, and I wouldn't try. My job is to make the optimistic path feel instant and the rejection path feel graceful. What I do care about on the API side is that the contract gives me typed reasons, so I can turn each failure into the right experience."*

Elle démontre trois choses : tu sais ce qui se passe côté serveur, tu sais que ce n'est pas ton périmètre, et tu sais exactement ce que tu dois exiger du contrat pour bien faire ton travail.

**Et si on te pousse sur quelque chose que tu ne sais vraiment pas**, la bonne réponse n'est jamais de bluffer :

> *"I haven't built that specific piece. Here's how I'd reason about it, and here's who I'd want in the room to validate it."*

---

## 24. Minutes 80–90 : la clôture

### 24.1 Gérer le temps à voix haute

Si tu sens que tu n'auras pas tout couvert, **dis-le et priorise explicitement** :

> *"I have about fifteen minutes left. I'd rather go deep on one more thing than skim three — would you prefer real-time reconciliation, or how I'd monitor this in production?"*

C'est un comportement de senior, et ça les implique dans le choix.

### 24.2 Le résumé

Reprends en une minute ce que tu as construit, en insistant sur **les décisions**, pas sur les composants :

> *"So: I started with a simple client that fetches and books, then hardened it in four directions. Optimistic updates with a client-generated idempotency key, so the app feels instant and retries are safe. SSE for live availability, because the need is one-directional and reconnection comes free. Read-first offline, because the network is bad in venues and what people need there is to show their booking. And typed errors throughout, because three of the failure modes are actually revenue opportunities. The thing I'd want to validate first with your team is the waitlist promotion policy — that's a product decision that shapes a lot of the UI."*

Ce paragraphe fait quatre choses : il montre que tu as une vue d'ensemble, il rappelle tes meilleurs points, il se termine sur une **question produit ouverte** qui prolonge la conversation, et il démontre que tu sais résumer — une compétence sous-estimée et très recherchée.

### 24.3 Les questions à poser

Elles comptent, et elles t'aident à décider si tu veux le poste.

**Technique.** Où en est le frontend aujourd'hui — monolithe, modules, plusieurs apps ? Qu'est-ce qui fait le plus mal en ce moment ? Comment gérez-vous le theming multi-tenant ? Web et mobile partagent-ils du code, et jusqu'où ? Qui décide des contrats d'API — les équipes front sont-elles impliquées en amont, ou reçoivent-elles ce qui existe ?

**Organisation.** Comment sont découpées les équipes — par feature, par surface, par domaine ? Y a-t-il une notion de « frontend platform », ou chaque équipe gère sa stack ? Quel serait l'impact attendu sur mes six premiers mois ?

**Produit.** Quelle est la contrainte la plus difficile aujourd'hui — l'échelle, la variété des studios, l'international ?

La question sur les contrats d'API est particulièrement bonne : elle est révélatrice de la culture d'ingénierie, et elle prolonge naturellement ce que tu viens de démontrer pendant 90 minutes.

---

## 25. Boîte à outils

### 25.1 Le déroulé minute par minute

| Temps | Phase | Contenu |
|---|---|---|
| 0–10 | **R** | clarifier, hypothèses, volumétrie |
| 10–15 | **V1** | la version simple + ses quatre failles annoncées |
| 15–25 | **A** | couches, composants, flux d'une réservation |
| 25–35 | **D + I** | modèle, contrat d'API, états d'erreur, état client |
| 35–50 | **Deep-dive 1** | flow de réservation, optimiste, idempotence, retry |
| 50–60 | **Deep-dive 2** | temps réel, réconciliation, SeatSelector |
| 60–80 | **O** | offline, rendu, perf, a11y/i18n/sécu, observabilité |
| 80–90 | **Clôture** | POC vs prod, résumé, questions |

### 25.2 Les phrases qui portent

**Cadrage**
- *"Before I design, let me clarify requirements and state my assumptions."*
- *"Let me start with the simplest version that works, then show you where it breaks."*

**Données**
- *"I separate server state from UI state — the schedule is cached server state, the filters are local."*
- *"I optimize for round-trips, not payload size. Bandwidth is abundant, latency isn't."*
- *"The server owns eligibility and returns a typed reason; duplicating business rules across three clients guarantees they drift."*
- *"Impossible states should be unrepresentable."*

**Le cœur**
- *"The idempotency key is generated on the click, not on the request — only the client knows a retry is the same intention."*
- *"Optimism doesn't remove failure handling, it makes failure more visible."*
- *"Availability is a hint, not a guarantee — so the rejection path is a nominal path, not an edge case."*
- *"Correctness has to live server-side; my job is to make the happy path instant and the rejection graceful."*

**Temps réel & offline**
- *"SSE, because the need is one-directional and reconnection with Last-Event-ID comes free."*
- *"Offline, the server stays the source of truth — the seat isn't confirmed until it validates."*

**Arbitrages**
- *"I'd defer that; for a POC it's over-engineering — and here's the signal that would make me add it."*
- *"That's a fair challenge — if we assume that constraint, here's what I'd change and what it costs."*
- *"I haven't built that specific piece, but here's how I'd reason about it."*

### 25.3 Les exercices d'entraînement

À faire **à voix haute**, chronométrés :

1. **Design the booking experience for a fitness studio.** Le plus probable.
2. **Design a real-time schedule view** pour des milliers d'utilisateurs simultanés.
3. **Design the offline-capable member app.**
4. **Design a component library for branded multi-tenant apps.** Ton terrain.
5. **Design the checkout and membership flow.**

Pour chacun : hypothèses, V1, failles annoncées, raffinements, arbitrages, impact business.

---
---

# LES DIX CHOSES À NE PAS RATER

1. **Clarifier avant de dessiner**, et expliquer *pourquoi* chaque question compte.
2. **Poser une V1 simple, puis annoncer ses quatre failles.** Le paragraphe le plus rentable de l'entretien.
3. **Séparer état serveur et état UI.** Marqueur de maturité immédiat.
4. **La clé d'idempotence naît de l'intention, pas de la requête.**
5. **La disponibilité est une projection et une indication** — donc le chemin de refus est un chemin nominal.
6. **`INELIGIBLE` n'est pas `FULL`.** Ton meilleur lien technique-business, en deux phrases.
7. **SSE plutôt que WebSocket**, parce que le besoin est unidirectionnel — et savoir quand basculer.
8. **La récurrence se définit en heure locale**, jamais en UTC.
9. **Alerter sur le taux de complétion du tunnel**, pas seulement sur le taux d'erreur.
10. **S'adapter quand ils challengent.** Reformuler, dire ce que ça change, ajuster. C'est le test, pas un piège.

Tu as le niveau et l'expérience. À ce stade, ce qui se joue est la mise en récit — la capacité à rendre visible un raisonnement que tu fais déjà.
