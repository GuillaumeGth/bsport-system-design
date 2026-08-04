import { lineKey } from '../lib/markdown'

/** Traduction française des phrases à prononcer. L'anglais reste ce qu'on dit
 *  en entretien ; le français sert à réviser et, en mode révision, d'amorce. */
const PAIRS: { en: string; fr: string }[] = [
  {
    en: 'Let me structure this: I\'ll spend a few minutes clarifying requirements and assumptions, then sketch a high-level architecture, go into the data model and the API contract, and then deep-dive on whichever parts you find most interesting — I suspect the booking flow and real-time availability. Does that work for you?',
    fr: 'Je vous propose de structurer : je prends quelques minutes pour clarifier les besoins et poser mes hypothèses, puis je dessine une architecture générale, j\'entre dans le modèle de données et le contrat d\'API, et ensuite on creuse les parties qui vous intéressent le plus — je soupçonne le flow de réservation et la disponibilité temps réel. Ça vous va ?',
  },
  {
    en: 'Here\'s what I\'m assuming: member-facing app, web and mobile, one studio at a time, roughly twenty classes visible at once, real-time availability matters, the network is unreliable in the venues, and there\'s money in the flow through credit packs. Tell me if any of that is wrong — those assumptions are what drive my rendering strategy, my caching, and how far I go on offline.',
    fr: 'Voici ce que je suppose : application côté membre, web et mobile, un studio à la fois, une vingtaine de cours visibles en même temps, la disponibilité temps réel compte, le réseau est mauvais dans les salles, et il y a de l\'argent dans le flux via les packs de crédits. Dites-moi si quelque chose est faux — ces hypothèses sont ce qui pilote ma stratégie de rendu, mon cache, et jusqu\'où je vais sur l\'offline.',
  },
  {
    en: 'Let me start with the simplest version that actually works, and then I\'ll show you where it breaks and what I\'d add. I find that easier to challenge than a fully-loaded architecture.',
    fr: 'Je commence par la version la plus simple qui fonctionne vraiment, puis je vous montre où elle casse et ce que j\'ajouterais. Je trouve ça plus facile à challenger qu\'une architecture complète d\'emblée.',
  },
  {
    en: 'This works, and honestly for a pilot with one studio it might be enough. But there are four things that will break. First, availability goes stale the moment it\'s rendered — someone else books while you\'re looking. Second, every click waits for a round-trip, which on a bad connection feels broken. Third, if the network drops mid-request, we don\'t know whether the booking happened, and a retry could double-book. Fourth, nothing tells us when it\'s failing in production. Those four are what I want to dig into.',
    fr: 'Ça marche, et honnêtement pour un pilote avec un seul studio ça pourrait suffire. Mais quatre choses vont casser. D\'abord, la disponibilité est périmée dès qu\'elle est affichée — quelqu\'un réserve pendant que vous regardez. Ensuite, chaque clic attend un aller-retour, ce qui sur une mauvaise connexion donne l\'impression que c\'est cassé. Troisièmement, si le réseau tombe en cours de requête, on ne sait pas si la réservation a eu lieu, et un retry peut créer un doublon. Enfin, rien ne nous dit quand ça échoue en production. Ce sont ces quatre points que je veux creuser.',
  },
  {
    en: 'The domain logic — what a booking is, what states it can be in, what makes a session bookable — shouldn\'t know whether data arrives over REST, GraphQL or a WebSocket. If I keep that separation, I can swap the transport, test the domain without a network, and share that layer with the mobile app. That\'s dependency inversion applied to the client.',
    fr: 'La logique métier — ce qu\'est une réservation, dans quels états elle peut être, ce qui rend une session réservable — ne doit pas savoir si les données arrivent en REST, en GraphQL ou par WebSocket. Si je garde cette séparation, je peux changer de transport, tester le domaine sans réseau, et partager cette couche avec l\'app mobile. C\'est l\'inversion de dépendances appliquée au client.',
  },
  {
    en: 'The user clicks. The component doesn\'t call the API — it dispatches a mutation. The mutation layer generates an idempotency key, applies an optimistic update to the cached session so the UI reflects the change immediately, and fires the request. On success it writes the response into the cache and invalidates the related keys. On a business failure it rolls back to the snapshot and surfaces a typed reason the component maps to a specific UI. On a network failure it retries with the same key. Meanwhile the real-time channel may push an update for that same session, and the reconciliation logic has to apply it without clobbering the in-flight optimistic change.',
    fr: 'L\'utilisateur clique. Le composant n\'appelle pas l\'API — il dispatche une mutation. La couche mutation génère une clé d\'idempotence, applique une mise à jour optimiste sur la session en cache pour que l\'interface reflète le changement immédiatement, et envoie la requête. En cas de succès, elle écrit la réponse dans le cache et invalide les clés liées. En cas d\'échec métier, elle revient au snapshot et expose une raison typée que le composant traduit en interface spécifique. En cas d\'échec réseau, elle retente avec la même clé. Pendant ce temps, le canal temps réel peut pousser une mise à jour sur cette même session, et la réconciliation doit l\'appliquer sans écraser la mutation optimiste en vol.',
  },
  {
    en: 'The first lever on re-renders isn\'t memoization, it\'s state structure — colocating state, splitting contexts, letting each card subscribe to its own slice. Memoization is what you add after you\'ve measured, not what you sprinkle everywhere upfront.',
    fr: 'Le premier levier sur les re-renders n\'est pas la mémoïsation, c\'est la structure de l\'état — colocaliser, découper les contextes, laisser chaque carte s\'abonner à sa propre tranche. La mémoïsation, c\'est ce qu\'on ajoute après avoir mesuré, pas ce qu\'on saupoudre partout d\'emblée.',
  },
  {
    en: 'These map to bounded contexts, and they\'re also the natural seams of the API. The reason it matters to me as a frontend engineer is that a screen usually spans several of them — the schedule screen needs Catalog, Scheduling and Billing at once — and that tension is exactly where waterfalls and over-fetching come from.',
    fr: 'Ça correspond à des bounded contexts, et ce sont aussi les coutures naturelles de l\'API. Ce qui m\'intéresse en tant que frontend, c\'est qu\'un écran en traverse généralement plusieurs — l\'écran de planning a besoin de Catalog, Scheduling et Billing à la fois — et c\'est exactement de cette tension que naissent les cascades et le sur-fetch.',
  },
  {
    en: 'So I wouldn\'t introduce hold-and-confirm by default. It brings a TTL, an expiry job, a pending state, a countdown in the UI, and hold release on abandon. That\'s a lot of machinery, and a credit-pack booking doesn\'t need any of it. I\'d add it exactly when a card payment sits between the intent and the confirmation.',
    fr: 'Donc je n\'introduirais pas le hold-and-confirm par défaut. Ça amène un TTL, un job d\'expiration, un état pending, un compte à rebours dans l\'interface, et la libération du verrou en cas d\'abandon. C\'est beaucoup de machinerie, et une réservation sur pack de crédits n\'en a aucun besoin. Je l\'ajouterais exactement quand un paiement par carte s\'intercale entre l\'intention et la confirmation.',
  },
  {
    en: 'That\'s a product call more than an engineering one. I\'d probably go hybrid on time-to-class, but I\'d want to know whether studios penalize no-shows — because auto-booking someone who then gets penalized for not showing up is the worst of both worlds.',
    fr: 'C\'est une décision produit plus qu\'une décision technique. J\'irais sans doute vers un hybride selon le délai avant le cours, mais je voudrais savoir si les studios pénalisent les no-shows — parce que réserver automatiquement pour quelqu\'un qui se fait ensuite pénaliser parce qu\'il n\'est pas venu, c\'est le pire des deux mondes.',
  },
  {
    en: 'Whatever number the server gives me for spots left, it\'s a hint, not a guarantee. It might come from a cache, it might be two hundred milliseconds old, and someone may be mid-payment on the last seat. The only moment truth exists is the response to the booking request.',
    fr: 'Quel que soit le nombre de places restantes que le serveur me donne, c\'est une indication, pas une garantie. Ça peut venir d\'un cache, ça peut avoir deux cents millisecondes, et quelqu\'un peut être en train de payer la dernière place. Le seul moment où la vérité existe, c\'est la réponse à la requête de réservation.',
  },
  {
    en: 'Which means the rejection path isn\'t an edge case I handle at the end — it\'s a nominal path I design from the start. \'The spot was just taken, here are three alternatives\' has to be as polished as the success screen.',
    fr: 'Ce qui veut dire que le chemin de refus n\'est pas un cas limite traité à la fin — c\'est un chemin nominal que je conçois dès le départ. « La place vient d\'être prise, voici trois alternatives » doit être aussi soigné que l\'écran de succès.',
  },
  {
    en: 'I optimize for round-trips, not payload size. Duplicating an instructor forty times costs a couple of kilobytes after compression; an extra waterfall costs hundreds of milliseconds of blank screen. Bandwidth is abundant, latency isn\'t.',
    fr: 'J\'optimise les allers-retours, pas la taille du payload. Dupliquer un prof quarante fois coûte quelques kilo-octets après compression ; une cascade supplémentaire coûte des centaines de millisecondes d\'écran vide. La bande passante est abondante, la latence non.',
  },
  {
    en: 'Offline I\'d show the last known eligibility, explicitly marked as unconfirmed, rather than re-deriving the rules client-side and lying confidently.',
    fr: 'Hors ligne, j\'afficherais la dernière éligibilité connue, explicitement marquée comme non confirmée, plutôt que de recalculer les règles côté client et de mentir avec assurance.',
  },
  {
    en: 'Three of these codes are revenue opportunities rather than failures. And ALREADY_BOOKED isn\'t an error at all — it\'s usually a successful retry. Showing an error there scares the user for nothing.',
    fr: 'Trois de ces codes sont des opportunités de revenu plutôt que des échecs. Et ALREADY_BOOKED n\'est pas du tout une erreur — c\'est en général un retry réussi. Afficher une erreur là fait peur à l\'utilisateur pour rien.',
  },
  {
    en: 'The classic mistake is putting server data in Redux. It has a completely different lifecycle — caching, staleness, background revalidation, garbage collection — and you end up reimplementing all of that by hand inside reducers. I keep the global store for cross-cutting client state and the offline queue.',
    fr: 'L\'erreur classique, c\'est de mettre les données serveur dans Redux. Elles ont un cycle de vie complètement différent — cache, péremption, revalidation en arrière-plan, garbage collection — et on finit par réimplémenter tout ça à la main dans des reducers. Je garde le store global pour l\'état client transverse et la file offline.',
  },
  {
    en: 'If the app already runs on Redux, I\'d default to RTK Query — adding TanStack Query alongside means two competing data paradigms in one codebase, and that\'s a real maintenance and onboarding cost I\'ve watched play out. On greenfield with no Redux, TanStack Query: better invalidation ergonomics and devtools, without paying the Redux tax. And I\'d never adopt Redux just to get RTK Query.',
    fr: 'Si l\'app tourne déjà sur Redux, je partirais sur RTK Query — ajouter TanStack Query à côté, c\'est deux paradigmes de données concurrents dans une même codebase, et c\'est un vrai coût de maintenance et d\'onboarding que j\'ai vu se produire. Sur un greenfield sans Redux, TanStack Query : meilleure ergonomie d\'invalidation et meilleurs devtools, sans payer la taxe Redux. Et je n\'adopterais jamais Redux juste pour avoir RTK Query.',
  },
  {
    en: 'The decision is driven by mutation complexity, not reads. All three cache a list of classes just fine. It\'s this booking flow — optimistic update, rollback on conflict, idempotent retry, reconciliation with a live event — that separates them.',
    fr: 'La décision est pilotée par la complexité des mutations, pas par les lectures. Les trois cachent très bien une liste de cours. C\'est ce flow de réservation — mise à jour optimiste, rollback en cas de conflit, retry idempotent, réconciliation avec un événement temps réel — qui les sépare.',
  },
  {
    en: 'If that pain grew — if the app became genuinely graph-shaped and stale copies started causing real bugs — that\'s precisely where GraphQL with Apollo would earn its complexity. Its normalized cache is the best thing about it. But I wouldn\'t buy that upfront.',
    fr: 'Si cette douleur grandissait — si l\'app devenait vraiment un graphe et que les copies périmées causaient de vrais bugs — c\'est précisément là que GraphQL avec Apollo justifierait sa complexité. Son cache normalisé est ce qu\'il a de meilleur. Mais je n\'achèterais pas ça d\'emblée.',
  },
  {
    en: 'Stale time per data type, not one global value. Too short and I hammer the API; too long and I show phantom spots.',
    fr: 'Une fraîcheur par type de donnée, pas une valeur globale. Trop courte, je martèle l\'API ; trop longue, j\'affiche des places fantômes.',
  },
  {
    en: 'If I collapse those two into one \'you can\'t book this\' state, I\'ve turned a sales opportunity into a dead end. And that\'s the studio\'s revenue, not just a UX detail.',
    fr: 'Si je fusionne ces deux cas dans un seul état « vous ne pouvez pas réserver », je transforme une opportunité de vente en cul-de-sac. Et c\'est le chiffre d\'affaires du studio, pas juste un détail d\'UX.',
  },
  {
    en: 'A discriminated union rather than a handful of booleans — five booleans give you thirty-two combinations, most of which are impossible but still representable, so a bug can reach them. With a union, impossible states are unrepresentable and the compiler forces me to handle every case.',
    fr: 'Une union discriminée plutôt qu\'une poignée de booléens — cinq booléens donnent trente-deux combinaisons, dont la plupart sont impossibles mais restent représentables, donc un bug peut les atteindre. Avec une union, les états impossibles ne sont pas représentables et le compilateur m\'oblige à traiter chaque cas.',
  },
  {
    en: 'Optimism doesn\'t remove failure handling — it makes failure more visible, because the user already saw success. So the rollback has to explain itself: \'that spot was just taken, here are three alternatives\', never a silent revert.',
    fr: 'L\'optimisme ne supprime pas la gestion d\'erreur — il rend l\'échec plus visible, parce que l\'utilisateur a déjà vu le succès. Donc le rollback doit s\'expliquer : « cette place vient d\'être prise, voici trois alternatives », jamais un retour en arrière silencieux.',
  },
  {
    en: 'The key is tied to the user\'s intention, not to the HTTP request. That\'s why it\'s a frontend responsibility — only the client knows that this retry is a continuation of the same click. The server can\'t infer it.',
    fr: 'La clé est liée à l\'intention de l\'utilisateur, pas à la requête HTTP. C\'est pour ça que c\'est une responsabilité frontend — seul le client sait que ce retry prolonge le même clic. Le serveur ne peut pas le déduire.',
  },
  {
    en: 'Retries and idempotency aren\'t two topics, they\'re one. I only auto-retry operations that are idempotent — a silent retry on a non-idempotent mutation is a duplicate generator.',
    fr: 'Les retries et l\'idempotence ne sont pas deux sujets, c\'est le même. Je ne retente automatiquement que des opérations idempotentes — un retry silencieux sur une mutation non idempotente est une machine à doublons.',
  },
  {
    en: 'Disabling the button is UX, not correctness. Two tabs, a direct API call, or an offline resync walk straight past it. The actual guarantee is the idempotency key plus a server-side uniqueness constraint. I can make the happy path feel instant — correctness has to live server-side.',
    fr: 'Désactiver le bouton, c\'est de l\'UX, pas de la correction. Deux onglets, un appel direct à l\'API ou une resynchronisation offline passent à travers. La vraie garantie, c\'est la clé d\'idempotence plus une contrainte d\'unicité côté serveur. Je peux rendre le chemin nominal instantané — la correction, elle, doit vivre côté serveur.',
  },
  {
    en: 'For live availability, SSE. The need is purely server-to-client, it\'s plain HTTP, and the automatic reconnect with Last-Event-ID means the server can replay what I missed — with WebSockets I\'d write all of that myself. I\'d only reach for WebSockets where the interaction is genuinely bidirectional, like shared seat selection.',
    fr: 'Pour la disponibilité en direct, SSE. Le besoin est purement serveur vers client, c\'est du HTTP ordinaire, et la reconnexion automatique avec Last-Event-ID permet au serveur de rejouer ce que j\'ai manqué — avec WebSocket, j\'écrirais tout ça moi-même. Je n\'irais vers WebSocket que là où l\'interaction est vraiment bidirectionnelle, comme la sélection de place partagée.',
  },
  {
    en: 'SSE works on any HTTP version, but I\'d want HTTP/2 — otherwise the six-connections-per-domain cap can starve every other request when a few tabs each hold an open stream.',
    fr: 'SSE fonctionne sur n\'importe quelle version de HTTP, mais je voudrais HTTP/2 — sinon la limite de six connexions par domaine peut affamer toutes les autres requêtes dès que quelques onglets maintiennent chacun un flux ouvert.',
  },
  {
    en: 'Two separate resources with two different cache lifetimes. If I merge them into one payload, I re-download the entire room layout on every availability update — which is pure waste on a channel that fires several times a second.',
    fr: 'Deux ressources distinctes avec deux durées de cache différentes. Si je les fusionne dans un seul payload, je retélécharge tout le plan de salle à chaque mise à jour de disponibilité — c\'est du gaspillage pur sur un canal qui émet plusieurs fois par seconde.',
  },
  {
    en: 'The seat selector is the hardest thing in this app to make accessible. A clickable grid gives a screen reader nothing — you need keyboard selection with labels that carry position and status, and live announcements that are informative without being constant.',
    fr: 'Le sélecteur de place est ce qu\'il y a de plus difficile à rendre accessible dans cette app. Une grille cliquable ne donne rien à un lecteur d\'écran — il faut une sélection au clavier avec des libellés qui portent la position et l\'état, et des annonces live informatives sans être incessantes.',
  },
  {
    en: 'Offline booking is technically attractive and honestly questionable in value. I\'d be promising a spot I can\'t guarantee — the member thinks they\'re booked, walks in, and there\'s no bike. A feature that fails silently is worse than not having it. If we did build it, the UI has to say \'pending confirmation\', never \'confirmed\'.',
    fr: 'La réservation hors ligne est techniquement séduisante et honnêtement discutable en valeur. Je promettrais une place que je ne peux pas garantir — le membre croit être inscrit, il se déplace, et il n\'y a pas de vélo. Une fonctionnalité qui échoue en silence est pire que son absence. Si on la construisait, l\'interface doit dire « en attente de confirmation », jamais « confirmé ».',
  },
  {
    en: 'SSR mainly improves LCP. Inside the member app, the user has been there for thirty seconds — the bottleneck isn\'t first paint, it\'s INP: how fast the Book button responds. SSR would add server cost and hydration complexity to optimize a metric that isn\'t the constraint here. And interestingly, the thing that actually improves INP on this screen is the optimistic update we discussed earlier.',
    fr: 'Le SSR améliore surtout le LCP. Dans l\'app membre, l\'utilisateur est là depuis trente secondes — le goulot n\'est pas le premier paint, c\'est l\'INP : la vitesse de réponse du bouton Réserver. Le SSR ajouterait du coût serveur et de la complexité d\'hydratation pour optimiser une métrique qui n\'est pas la contrainte ici. Et, chose intéressante, ce qui améliore vraiment l\'INP sur cet écran, c\'est la mise à jour optimiste dont on a parlé.',
  },
  {
    en: 'First — do we need to? We said a day of classes is about twenty cards. Virtualizing that is over-engineering, and it costs me browser search, deep-linking to an element, and screen-reader semantics. I\'d virtualize if we\'re rendering a month across studios.',
    fr: 'D\'abord — est-ce qu\'on en a besoin ? On a dit qu\'une journée de cours, c\'est une vingtaine de cartes. Virtualiser ça, c\'est de la sur-ingénierie, et ça me coûte la recherche du navigateur, le lien profond vers un élément, et la sémantique pour les lecteurs d\'écran. Je virtualiserais si on affichait un mois sur plusieurs studios.',
  },
  {
    en: 'And I\'d measure in RUM, at p75 and p95 rather than averages. A perfect Lighthouse score on a wired MacBook tells me nothing about a mid-range Android on 4G in a basement — which is exactly our user.',
    fr: 'Et je mesurerais en RUM, au p75 et au p95 plutôt qu\'en moyenne. Un score Lighthouse parfait sur un MacBook filaire ne me dit rien sur un Android milieu de gamme en 4G au sous-sol — qui est exactement notre utilisateur.',
  },
  {
    en: 'Generating recurring occurrences by adding 168 hours in UTC silently shifts every class by an hour, twice a year. Recurrence is defined in local time — that\'s the one thing I\'d make sure is right from day one, because it\'s cheap now and it\'s a support nightmare later.',
    fr: 'Générer les occurrences récurrentes en ajoutant 168 heures en UTC décale silencieusement chaque cours d\'une heure, deux fois par an. La récurrence se définit en heure locale — c\'est la chose que je m\'assurerais d\'avoir juste dès le premier jour, parce que c\'est gratuit maintenant et que c\'est un cauchemar de support plus tard.',
  },
  {
    en: 'httpOnly doesn\'t make XSS harmless — an attacker can still act inside the session from the page. But it stops them exfiltrating a token to use elsewhere and later, which changes the blast radius and the duration of the compromise. It\'s defense in depth, not a fix.',
    fr: 'httpOnly ne rend pas le XSS inoffensif — un attaquant peut toujours agir dans la session depuis la page. Mais ça l\'empêche d\'exfiltrer un token pour s\'en servir ailleurs et plus tard, ce qui change le rayon d\'impact et la durée de la compromission. C\'est de la défense en profondeur, pas un correctif.',
  },
  {
    en: 'Retrofitting accessibility costs several times more than building it in, because it touches DOM structure, semantics and focus order — not styling. It\'s a cost argument as much as an ethical one. And on a wellness product, the affected population is overrepresented, not marginal.',
    fr: 'Rattraper l\'accessibilité après coup coûte plusieurs fois plus cher que de la construire dès le départ, parce que ça touche la structure du DOM, la sémantique et l\'ordre de focus — pas le style. C\'est un argument de coût autant qu\'un argument éthique. Et sur un produit wellness, la population concernée est surreprésentée, pas marginale.',
  },
  {
    en: 'A frontend can be perfectly healthy — zero JS errors, normal latency, every service green — and completely broken, because a button ended up invisible at one breakpoint or a condition blocked one step of the flow. No technical monitoring catches that. Only funnel completion does. So I\'d alert on booking completion rate, not just error rate.',
    fr: 'Un frontend peut être parfaitement sain — zéro erreur JS, latence normale, tous les services au vert — et complètement cassé, parce qu\'un bouton est devenu invisible à un breakpoint ou qu\'une condition bloque une étape du parcours. Aucun monitoring technique n\'attrape ça. Seul le taux de complétion du tunnel le fait. Donc j\'alerterais sur le taux de complétion des réservations, pas seulement sur le taux d\'erreur.',
  },
  {
    en: 'What\'s deferrable is what I can add later without breaking anything or misleading anyone. What isn\'t deferrable is anything whose absence produces a lie to the user or loses the studio money.',
    fr: 'Ce qui est différable, c\'est ce que je peux ajouter plus tard sans rien casser ni tromper personne. Ce qui ne l\'est pas, c\'est tout ce dont l\'absence produit un mensonge à l\'utilisateur ou fait perdre de l\'argent au studio.',
  },
  {
    en: 'A POC narrows scope, it doesn\'t lower correctness. Reducing what we support is legitimate; reducing whether it\'s right isn\'t.',
    fr: 'Un POC réduit le périmètre, il ne réduit pas la justesse. Réduire ce qu\'on supporte est légitime ; réduire le fait que ce soit correct ne l\'est pas.',
  },
  {
    en: 'The correctness guarantee has to live server-side — I can\'t prevent double-booking from the client, and I wouldn\'t try. My job is to make the optimistic path feel instant and the rejection path feel graceful. What I do care about on the API side is that the contract gives me typed reasons, so I can turn each failure into the right experience.',
    fr: 'La garantie de correction doit vivre côté serveur — je ne peux pas empêcher la double réservation depuis le client, et je n\'essaierais pas. Mon travail, c\'est de rendre le chemin optimiste instantané et le chemin de refus élégant. Ce à quoi je tiens côté API, c\'est que le contrat me donne des raisons typées, pour que je transforme chaque échec en la bonne expérience.',
  },
  {
    en: 'I haven\'t built that specific piece. Here\'s how I\'d reason about it, and here\'s who I\'d want in the room to validate it.',
    fr: 'Je n\'ai pas construit cette brique-là. Voici comment je raisonnerais dessus, et voici qui je voudrais autour de la table pour la valider.',
  },
  {
    en: 'I have about fifteen minutes left. I\'d rather go deep on one more thing than skim three — would you prefer real-time reconciliation, or how I\'d monitor this in production?',
    fr: 'Il me reste environ quinze minutes. Je préfère creuser un sujet de plus que d\'en survoler trois — vous préférez la réconciliation temps réel, ou la façon dont je monitorerais ça en production ?',
  },
  {
    en: 'So: I started with a simple client that fetches and books, then hardened it in four directions. Optimistic updates with a client-generated idempotency key, so the app feels instant and retries are safe. SSE for live availability, because the need is one-directional and reconnection comes free. Read-first offline, because the network is bad in venues and what people need there is to show their booking. And typed errors throughout, because three of the failure modes are actually revenue opportunities. The thing I\'d want to validate first with your team is the waitlist promotion policy — that\'s a product decision that shapes a lot of the UI.',
    fr: 'Donc : je suis parti d\'un client simple qui récupère et réserve, puis je l\'ai durci dans quatre directions. Des mises à jour optimistes avec une clé d\'idempotence générée par le client, pour que l\'app paraisse instantanée et que les retries soient sûrs. SSE pour la disponibilité en direct, parce que le besoin est unidirectionnel et que la reconnexion est offerte. Un offline en lecture d\'abord, parce que le réseau est mauvais dans les salles et que ce dont les gens ont besoin là-bas, c\'est de montrer leur réservation. Et des erreurs typées partout, parce que trois des modes d\'échec sont en réalité des opportunités de revenu. Ce que je voudrais valider en premier avec votre équipe, c\'est la politique de promotion depuis la liste d\'attente — c\'est une décision produit qui façonne beaucoup d\'interface.',
  },
  {
    en: 'Before I design, let me clarify requirements and state my assumptions.',
    fr: 'Avant de concevoir, laissez-moi clarifier les besoins et poser mes hypothèses.',
  },
  {
    en: 'Let me start with the simplest version that works, then show you where it breaks.',
    fr: 'Je commence par la version la plus simple qui fonctionne, puis je vous montre où elle casse.',
  },
  {
    en: 'I separate server state from UI state — the schedule is cached server state, the filters are local.',
    fr: 'Je sépare l\'état serveur de l\'état d\'interface — le planning est de l\'état serveur mis en cache, les filtres sont locaux.',
  },
  {
    en: 'I optimize for round-trips, not payload size. Bandwidth is abundant, latency isn\'t.',
    fr: 'J\'optimise les allers-retours, pas la taille du payload. La bande passante est abondante, la latence non.',
  },
  {
    en: 'The server owns eligibility and returns a typed reason; duplicating business rules across three clients guarantees they drift.',
    fr: 'Le serveur possède l\'éligibilité et renvoie une raison typée ; dupliquer des règles métier sur trois clients garantit qu\'elles divergeront.',
  },
  {
    en: 'Impossible states should be unrepresentable.',
    fr: 'Les états impossibles ne devraient pas être représentables.',
  },
  {
    en: 'The idempotency key is generated on the click, not on the request — only the client knows a retry is the same intention.',
    fr: 'La clé d\'idempotence est générée au clic, pas à la requête — seul le client sait qu\'un retry correspond à la même intention.',
  },
  {
    en: 'Optimism doesn\'t remove failure handling, it makes failure more visible.',
    fr: 'L\'optimisme ne supprime pas la gestion d\'erreur, il rend l\'échec plus visible.',
  },
  {
    en: 'Availability is a hint, not a guarantee — so the rejection path is a nominal path, not an edge case.',
    fr: 'La disponibilité est une indication, pas une garantie — donc le chemin de refus est un chemin nominal, pas un cas limite.',
  },
  {
    en: 'Correctness has to live server-side; my job is to make the happy path instant and the rejection graceful.',
    fr: 'La correction doit vivre côté serveur ; mon travail, c\'est de rendre le chemin nominal instantané et le refus élégant.',
  },
  {
    en: 'SSE, because the need is one-directional and reconnection with Last-Event-ID comes free.',
    fr: 'SSE, parce que le besoin est unidirectionnel et que la reconnexion avec Last-Event-ID est offerte.',
  },
  {
    en: 'Offline, the server stays the source of truth — the seat isn\'t confirmed until it validates.',
    fr: 'Hors ligne, le serveur reste la source de vérité — la place n\'est pas confirmée tant qu\'il n\'a pas validé.',
  },
  {
    en: 'I\'d defer that; for a POC it\'s over-engineering — and here\'s the signal that would make me add it.',
    fr: 'Je différerais ça ; pour un POC c\'est de la sur-ingénierie — et voici le signal qui me ferait l\'ajouter.',
  },
  {
    en: 'That\'s a fair challenge — if we assume that constraint, here\'s what I\'d change and what it costs.',
    fr: 'C\'est un challenge légitime — si on prend cette contrainte, voici ce que je changerais et ce que ça coûte.',
  },
  {
    en: 'I haven\'t built that specific piece, but here\'s how I\'d reason about it.',
    fr: 'Je n\'ai pas construit cette brique-là, mais voici comment je raisonnerais dessus.',
  },
]

const BY_KEY = new Map<string, string>()
for (const pair of PAIRS) {
  const key = lineKey(pair.en)
  // Première occurrence gagnante, comme la déduplication des phrases.
  if (!BY_KEY.has(key)) BY_KEY.set(key, pair.fr)
}

export function translateLine(english: string): string | undefined {
  return BY_KEY.get(lineKey(english))
}
