# Cheat sheet — Frontend System Design @ bsport

*Keep this in view. The lines in italics are meant to be said exactly as written.*

---

## The timing

| Time | What you do |
|---|---|
| 0–10 | Announce the plan · clarify · assumptions · volumes |
| 10–15 | Simple V1 **+ its four flaws** |
| 15–25 | Layers · components · the flow of one booking |
| 25–35 | Model · API contract · typed errors · client state |
| 35–50 | **Deep-dive 1** — booking, optimistic, idempotency, retry |
| 50–60 | **Deep-dive 2** — real time, reconciliation, SeatSelector |
| 60–80 | Offline · rendering · perf · a11y/i18n/security · observability |
| 80–90 | POC vs prod · summary · questions |

**If you run over:** *"I have about fifteen minutes left. I'd rather go deep on one more thing than skim three — would you prefer real-time reconciliation, or how I'd monitor this in production?"*

---

## 0–10 · Frame it

**Open with:** *"Let me structure this: I'll clarify requirements and assumptions, then sketch a high-level architecture, go into the data model and the API contract, then deep-dive on whichever parts you find most interesting — I suspect the booking flow and real-time availability. Does that work?"*

**Questions — ask, say why, say what it changes**

- **Which surface?** member app / back-office → *"one is consumer-facing and mobile-first, the other is a working tool used on desktop all day"*
- **Which journeys?** → take **browse + book + cancel**, waitlist and seats as refinements
- **One studio or several?** → tenant context fixed or variable (cache, navigation)
- **Should schedules be indexable?** → an SEO need → a rendering constraint
- **Real time?** and at what latency → periodic refetch **or** a pushed channel. Don't assume
- **Network conditions?** → *venues are in basements* → justifies round-trips + offline
- **Devices?** → low-end Android → virtualization = comfort or necessity
- **A11y?** → European Accessibility Act + an over-represented wellness audience
- **Languages / members who travel?** → time zones
- **Offline?** → reads = cache · writes = queue + conflicts + **what we promise**

**Volumes** — ~20 cards/day (⇒ **no virtualization**) · reads ≫ writes · load comes **in spikes** when booking opens (⇒ conflicts are likely, optimism lies)

**Close with:** *"Here's what I'm assuming: member-facing app, web and mobile, one studio at a time, roughly twenty classes visible, real-time availability matters, the network is unreliable in venues, and there's money in the flow through credit packs. Tell me if any of that is wrong — those assumptions drive my rendering strategy, my caching, and how far I go on offline."*

**B2B2C** — the studio pays, the member uses. The tension shows on waitlist and no-show → **ask**, don't rule on it alone.

---

## 10–15 · The V1 and its four flaws

*"Let me start with the simplest version that actually works, then I'll show you where it breaks. I find that easier to challenge than a fully-loaded architecture."*

**V1:** client → REST, fetch sessions, click Book → request → update the screen. Loading/error/empty. That's it.

*"This works, and for a pilot with one studio it might be enough. But four things will break."*

- *"First, availability goes stale the moment it's rendered."*
- *"Second, every click waits for a round-trip, which on a bad connection feels broken."*
- *"Third, if the network drops mid-request, we don't know whether the booking happened, and a retry could double-book."*
- *"Fourth, nothing tells us when it's failing in production."*

**Handling ≠ knowing** — if they challenge the fourth one: the V1 does show the error to the user, but nothing reports it to the team. And the most expensive failures raise no error at all (a button invisible at one breakpoint, a 200 with an empty list).

→ announces **real time · perceived latency · idempotency · observability**

---

## 15–25 · Architecture

**Layers** (the lower one ignores the upper) : UI → local UI state → **server state / cache** → transport (HTTP, channel, offline queue) → cross-cutting (auth, i18n, theming, flags, telemetry)

**Clean architecture on the client:** *"The domain logic — what a booking is, what states it can be in, what makes a session bookable — shouldn't know whether data arrives over REST, GraphQL or a WebSocket. That's dependency inversion applied to the client."* → this is what enables **web/mobile sharing**: share the invariant, specialize the contextual.

**The flow (tell it in one breath):** *"The user clicks. The component doesn't call the API — it dispatches a mutation. The mutation layer generates an idempotency key, applies an optimistic update, and fires the request. On success it writes the response into the cache and invalidates related keys. On a business failure it rolls back and surfaces a typed reason. On a network failure it retries with the same key. Meanwhile the real-time channel may push an update for that same session, and reconciliation has to apply it without clobbering the in-flight optimistic change."*

**Components:** SchedulePage · Filters · List · **ClassSlotCard** · BookingFlow · **SeatSelector** · WaitlistButton · MembershipBadge
- container/presentational = **stability** — two rates of change: the API contract (the backend's schedule) and the visual grammar (the design team's). In one file, every backend release ends up touching the pixels
  - **the boundary test: moving from polling to SSE must not change a single line of the card**
  - along the way: tests on fixtures · web/mobile sharing · the same card in the list, in search, in the modal
  - not the 2015 `containers/` folder: colocate, let data in at the route boundary, **keep the leaves dumb**
  - *"I split on rate of change: the API contract moves on the backend's schedule, the card's visual grammar moves on the design team's."*
- 25 boolean props = an alarm bell → **composition**, for three reasons worth naming separately
  - **a state machine nobody named** — 2ⁿ combinations, `isFull && isBooked` representable, therefore reachable → discriminated union
  - **the call site's context leaks** into a shared component (`compact`, `inModal`) → slots. The test: add the waitlist button on one screen **without touching the card**
  - **which combinations are legal is written nowhere** — not in the types, not in the tests
  - cross-cutting (theme, locale, tenant) = React context · a genuinely closed set = `density`, not a flag
  - *"Twenty-five booleans is a state machine nobody named, plus every call site's context leaking into a shared component."*
- **Ivalua**: contracts · declared extension points · versioning/migration · DX for non-developers
- *"The first lever on re-renders isn't memoization, it's state structure."*

---

## 25–35 · Data & contract

**4 contexts** (DDD bounded contexts, nothing to do with React context) **:** Catalog (who/what/where) · Scheduling (when) · Booking (who shows up) · Billing (who pays)
→ *"a screen usually spans several of them — that's where waterfalls and over-fetching come from"*

**Scheduling:** ClassTemplate (the rule) vs **Session** (a dated occurrence with a stable identity) → **materialize over a rolling horizon**. A rule that changes = *"the edit-this-event / all-events / all-following problem from Google Calendar"* → the back-office **asks**, the member app **notifies**.

**Hold:** *"I wouldn't introduce hold-and-confirm by default. A credit-pack booking doesn't need it. I'd add it exactly when a card payment sits between the intent and the confirmation."*

**Availability = a projection**: `capacity − occupancies`. No field on the Seat (bike 12 is taken at 6pm, free at 7pm). **Three states: FREE · HELD · BOOKED.** A **materialized** counter (read/write ratio).

> *"Whatever number the server gives me for spots left, it's a hint, not a guarantee. The only moment truth exists is the response to the booking request."*
> *"Which means the rejection path isn't an edge case — it's a nominal path I design from the start."*

**The contract, 4 arguments:**
1. **Round-trips** — *"I optimize for round-trips, not payload size. Bandwidth is abundant, latency isn't."* (3 hops = one second of empty screen)
2. **Eligibility server-side** + a typed reason — *"duplicating a business rule across three clients guarantees they drift"*. Offline: *"last known eligibility, explicitly marked as unconfirmed, rather than lying confidently"*
3. **Typed errors** ↓
4. **Time** — UTC + the studio's timezone in the data

| Code | Interface | What's at stake |
|---|---|---|
| `SESSION_FULL` | rollback + waitlist | retention |
| `SEAT_TAKEN` | back to the picker | experience |
| `ALREADY_BOOKED` | **not an error** — show the booking | don't alarm |
| `NO_CREDITS_LEFT` | offer a pack | **revenue** |
| `NOT_COVERED_BY_PLAN` | offer an upgrade | **revenue** |
| `BOOKING_WINDOW_CLOSED` | "opens August 3 at 9am" + a reminder | retention |
| `PAYMENT_FAILED` | switch payment method | **revenue** |

*"Three of these are revenue opportunities rather than failures. And ALREADY_BOOKED isn't an error at all — it's usually a successful retry."*

**State, 4 families:** server · local UI · global client · **URL**
- *"The classic mistake is putting server data in Redux — it has a completely different lifecycle."*
- URL: date + filters. **Trap: the Android back button leaves the app if the modal doesn't touch the URL.**
- **Library:** Redux already there → RTK Query · greenfield → TanStack Query · never adopt Redux just to get RTK Query. *"The decision is driven by mutation complexity, not reads."*
- **Document** cache + prefix invalidation `['sessions', studioId, date]`. Normalized (Apollo) = if the app becomes a graph.
- **Freshness per type**, no global value. Availability = 0 + the channel.

**UI states** — technical: idle/loading(**skeleton**)/success/**empty ≠ error**/error/refetching(**never re-skeleton**)/optimistic/offline
**Business states** — BOOKABLE · ALMOST_FULL · FULL · WAITLISTED · BOOKED · PENDING · **INELIGIBLE** · BOOKING_NOT_OPEN · CANCELLATION_LOCKED · CANCELLED · PAST

> **INELIGIBLE ≠ FULL** — *"If I collapse those two into one 'you can't book this' state, I've turned a sales opportunity into a dead end. And that's the studio's revenue, not just a UX detail."*

**Some states expire on their own** (5:59pm free / 6:01pm not) → **re-check at the moment of the action**.

**State machine:** a discriminated union — *"five booleans give thirty-two combinations, most impossible but still representable, so a bug can reach them"*

---

## 35–50 · Deep-dive 1 — the booking

**1** click → **key at the click** · **2** snapshot + optimistic decrement · **3** request carrying the key · **4a** success → write + invalidate · **4b** business failure → rollback **that explains itself** · **4c** network → retry **with the same key** · **5** a real-time event that doesn't clobber the in-flight mutation

**Optimism, action by action:** cancel ✓ · waitlist ✓ · a half-empty class ✓ · **the last spot → careful** · paying → **pessimistic**
> *"Optimism doesn't remove failure handling — it makes failure more visible. So the rollback has to explain itself: 'that spot was just taken, here are three alternatives', never a silent revert."*

**Invalidation:** both — the optimistic write, the success response, **then a background invalidation**. Keep the snapshot.

**Idempotency** — the key is born **at the click**, not at the request:
> *"The key is tied to the user's intention, not to the HTTP request. Only the client knows that this retry is a continuation of the same click. The server can't infer it."*
- covers: double-click · retry after a timeout · offline resync
- **a new intention = a new key** (full → waitlist → a spot frees up → rebook)
- the key covers **booking + payment**, otherwise double charge

**Retry:** timeout/5xx/429 ✓ (backoff + **jitter** + a cap + a timeout) · business 4xx ✗ · 401 = re-auth · without a key ✗
> *"Retries and idempotency aren't two topics, they're one."*

**Anti-double-submit, 4 layers:** the button · client-side dedup · **the key** · **server-side uniqueness**
> *"Disabling the button is UX, not correctness. Two tabs, a direct API call, or an offline resync walk straight past it."*

---

## 50–60 · Deep-dive 2 — real time & SeatSelector

**SSE** — *"the need is purely server-to-client, it's plain HTTP, and the automatic reconnect with Last-Event-ID means the server can replay what I missed."* WebSocket only if it is genuinely bidirectional.
**HTTP/1.1: 6 connections per domain** → several tabs = everything stalls (*"the app freezes when I have three tabs open"*). HTTP/2 → multiplexed.

**Delta + a monotonic version** → reject out-of-order · **detect a gap → full resync** · ignore what's already applied. *A delta without versioning diverges silently.*

**Reconciliation:** don't clobber the in-flight optimistic change · resync on reconnect · **batch** (200 seats = 1 tick) · subscribe only to what's visible

**SeatSelector — 3 layers, 3 lifetimes:** the layout (hours) · seat states (volatile) · **my selection (local)**
> *"Two separate resources with two different cache lifetimes. If I merge them, I re-download the entire room layout on every availability update."*
- a conflict is **animated, not brutal** · an event must never overwrite my selection
- **a11y, raise it unprompted:** *"The seat selector is the hardest thing in this app to make accessible. A clickable grid gives a screen reader nothing — you need keyboard selection with labels that carry position and status."*

---

## 60–80 · Harden

**Offline** — level 1 (reads + **showing your booking at the front desk**) always · level 2 only if the data justifies it
> *"Offline booking is technically attractive and honestly questionable in value. A feature that fails silently is worse than not having it. If we built it, the UI has to say 'pending confirmation', never 'confirmed'."*
If we do it: ordering · **expiry** (don't replay yesterday's class) · compaction · idempotency · notification · **server-wins** (no CRDT, nothing to merge)
SW: a strategy **per resource** · the trap = **stuck on an old version** · IndexedDB (async + transactional), not localStorage

**Rendering** — public schedule SSG/ISR · shareable detail page SSR · **member app CSR**
> *"SSR mainly improves LCP. Inside the member app the bottleneck isn't first paint, it's INP — and what actually improves INP here is the optimistic update we discussed."*
Multi-tenant: the theme **before the first paint** · a single build + CSS custom properties · **validate contrast at the moment the studio picks its colours**

**Perf** — *"First — do we need to? We said twenty cards. Virtualizing that is over-engineering."* · structure before memoization · LCP (public) / **INP** (member) / CLS (**a layout that jumps = a click on the wrong class**) · *"RUM at p75 and p95, not averages"* · bundle: split by route + lazy payment/SeatSelector + **prefetch on hover**

**Time zones** — the studio's local time, always. **Recurrence is defined in local time.**
> *"Adding 168 hours in UTC silently shifts every class by an hour, twice a year."*
An hour that doesn't exist / exists twice · the server doesn't format in its own zone · Temporal / date-fns-tz

**i18n** — ICU (plurals) · native Intl · logical properties · test in German (+30 %) · studio descriptions left untranslated

**Security** — access token in memory + refresh token in an httpOnly cookie
> *"httpOnly doesn't make XSS harmless, but it stops them exfiltrating a token to use elsewhere and later. It's defense in depth, not a fix."*
Descriptions typed in by studios = **a real XSS surface** · **every cache key includes the studioId** (otherwise it leaks across tenants) · card details inside the PSP's iframes

**A11y** — WCAG AA on the critical journeys · focus in modals · live regions **sparingly**
> *"Retrofitting accessibility costs several times more, because it touches DOM structure, semantics and focus order — not styling."*

**Observability** — errors + source maps · RUM p75/p95 · **a trace propagated from the click to the backend** · **business metrics**: funnel completion · failures by code · perceived time to confirmation · **the optimistic rollback rate** (diagnoses real time through a user-visible symptom)
> *"A frontend can be perfectly healthy and completely broken, because a button ended up invisible at one breakpoint. Only funnel completion catches that."*

---

## 80–90 · Close

**POC vs prod**
> *"What's deferrable is what I can add later without breaking anything or misleading anyone. What isn't is anything whose absence produces a lie to the user or loses the studio money."*
> *"A POC narrows scope, it doesn't lower correctness."*

Deferrable: offline · real time · SSR · virtualization · exhaustive i18n · a complete design system
**Never:** no double-booking · typed errors · correct times · no false "confirmed" · basic security · keyboard a11y

**If they push you on the backend**
> *"The correctness guarantee has to live server-side — I can't prevent double-booking from the client, and I wouldn't try. My job is to make the optimistic path feel instant and the rejection path feel graceful. What I do care about is that the contract gives me typed reasons."*
> *"I haven't built that specific piece. Here's how I'd reason about it, and here's who I'd want in the room to validate it."*

**Summary**
> *"I started with a simple client that fetches and books, then hardened it in four directions. Optimistic updates with a client-generated idempotency key, so the app feels instant and retries are safe. SSE for live availability, because the need is one-directional and reconnection comes free. Read-first offline, because the network is bad in venues and what people need there is to show their booking. And typed errors throughout, because three of the failure modes are actually revenue opportunities. The thing I'd want to validate first with your team is the waitlist promotion policy — that's a product decision that shapes a lot of the UI."*

**Questions**
- Where is the frontend today — monolith, modules, several apps? What hurts most?
- How do you handle multi-tenant theming? Do web and mobile share code, and how far?
- **Who decides the API contracts — are the frontend teams involved upstream?**
- Are teams split by feature, surface or domain? Is there a frontend platform team?
- The hardest constraint today — scale, the variety of studios, going international?

---

## The ten not to miss

1. **Clarify before drawing**, saying *why* each question matters
2. **The simple V1 + its four flaws** — the highest-yield paragraph
3. **Separate server state from UI state**
4. **The idempotency key comes from the intention, not the request**
5. **Availability is a hint** → the rejection path is nominal
6. **`INELIGIBLE` ≠ `FULL`** — your best technical↔business link
7. **SSE over WebSocket**, and know when to switch
8. **Recurrence is defined in local time**
9. **Alert on funnel completion**, not only on errors
10. **Adapt when they challenge you** — restate, say what it changes, adjust. *That's the test.*

---

**Silence is your enemy.** They only assess what they hear.
