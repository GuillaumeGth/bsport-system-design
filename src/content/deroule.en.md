# Frontend System Design @ bsport — the full walkthrough

> **What this document is.** The reasoning of the interview, from the first minute to the ninetieth, laid out the way you will actually deliver it. Every section explains **what you say**, **why you say it**, and **what they take from it**. Whenever a trade-off comes up, it is worked through on the spot.
>
> **What this document is not.** A list of patterns to recite. If you retain the *structure of the reasoning* and a dozen anchor points, you will rebuild the rest live — which is precisely what they want to see.

**Format:** ~1 h 30, Google Meet, with an Engineering Manager, a Staff Engineer or the CTO. A colleague may sit in as an observer.
**Role:** frontend. **Stakes:** the final technical round before the founder interview.

---

# CONTENTS

**PART I — BEFORE YOU DRAW**
1. What they are really assessing
2. bsport: reading the product to anticipate the exercise
3. The frame, and why you announce it
4. Minutes 0–10: clarify

**PART II — LAYING THE FOUNDATIONS**
5. Minutes 10–15: the V1, deliberately simple
6. Minutes 15–25: the layered architecture
7. Breaking it into components

**PART III — THE DATA**
8. The server-side domain model
9. Availability: a projection, not a state
10. The API contract, negotiated from the client
11. Where state lives, and with which library
12. Interface states

**PART IV — THE CORE**
13. Minutes 35–50: the booking flow
14. Concurrency, idempotency, retries
15. Minutes 50–60: real time
16. The SeatSelector

**PART V — HARDENING**
17. Offline
18. Rendering strategy
19. Performance
20. Accessibility, i18n, security
21. Observability and debugging

**PART VI — CLOSING**
22. POC vs production, and business impact
23. When they push you toward the backend
24. Minutes 80–90: the close
25. Toolbox: sentences, timing, drills

---
---

# PART I — BEFORE YOU DRAW

## 1. What they are really assessing

Their invitation email is a scoring rubric barely in disguise. Every sentence in the "What success looks like" paragraph maps to a grading criterion. Let us decode them, because knowing what is being measured changes how you spend the 90 minutes.

**"Start by clarifying the problem, constraints and assumptions, then outline how you plan to approach the design."**
They are testing whether you charge ahead or frame the problem. A candidate who starts drawing boxes at minute 2 has already lost points, even if the final architecture is good — because in a real situation, they would have built the wrong thing very efficiently. The second half of the sentence matters just as much: *outline how you plan to approach* means they want to hear your **plan** before your **design**.

**"Begin with a simple, clear solution that solves the core problem, then refine it toward real time, offline handling, scalability and reliability."**
This is the most discriminating criterion, and the most counter-intuitive one for an experienced candidate. Your natural reflex, with ten years in the field, is to show everything you know up front — WebSockets, service workers, virtualization, from minute one. **That is exactly what not to do.** They want to see that you know *when* to introduce complexity, which requires showing the version without it first. And the fact that they explicitly list the order (real time, then offline, then scalability, then reliability) hands you the plan for your deep dives.

**"Focus on data flow and responsibilities between components, not just APIs or fields."**
Translation: do not list endpoints. Tell the **journey of a piece of data**. Who owns it, who writes it, who reads it, what happens when the write fails, how the others find out. That is a direct invitation to speak in terms of flows, which also happens to be the most natural way to make a design understandable out loud.

**"Make time to talk about errors, retries, idempotency, bottlenecks and how you would monitor or debug the system."**
The word **idempotency** in a frontend invitation is a gift: it tells you exactly where to dig. And "make time" signals that they have already seen candidates never get there for lack of time management. Plan your timing so you can devote a real block to it.

**"Think out loud, keep your reasoning structured, and be ready to adapt your design when we challenge parts of it."**
Two things. First, **silence is your enemy**: they are not assessing what you think, only what they hear. Second — and this is critical — **they will challenge you, and it is not a trap, it is the test itself**. Defending your first idea on principle is a negative signal. Restating the constraint, saying what it changes, and adjusting: that is a positive signal, including when you hold your position, provided you re-justify it against the new constraint.

**"Keep business impact in mind when you make design choices, not only the technical elegance."**
They are looking for a product engineer. In a company selling SaaS to fitness studios, a technical decision that costs 5% of conversion in the booking funnel is a bad decision, however elegant.

**The meta-point to keep in mind throughout the session.** In 90 minutes, nobody designs a real architecture. What they are buying is a **simulation of collaboration**: will it be pleasant and productive to design systems with this person for three years? That translates into concrete behaviours — asking questions rather than assuming, saying "I don't know, here's how I'd decide" rather than bluffing, turning a question back to them when their context matters more than your opinion, and welcoming a challenge as information rather than as an attack.

---

## 2. bsport: reading the product to anticipate the exercise

bsport is an all-in-one platform for fitness and wellness studios: class booking with real-time availability, waitlists, seat selection ("choose your spot"), memberships and credit packs, recurring payments, multi-studio management, branded member apps, CRM.

The most likely exercise is therefore some variant of **"design the booking experience"**. But knowing the product goes beyond guessing the prompt: it gives you **real constraints** to invoke, which makes every justification concrete instead of generic.

**What the product tells you, and what you deduce from it:**

**It is B2B2C.** The paying customer is the studio; the end user is the member. Their interests do not always coincide — the studio wants classes as full as possible, the member wants flexibility. This shows up very concretely in the waitlist policy and in no-show penalties. Being able to name that tension lets you ask relevant product questions rather than deciding unilaterally.

**It is multi-tenant with per-customer branding.** Each studio has an app in its own colours. Direct architectural consequence: **the theme is data loaded at runtime, not compiled CSS**. You cannot ship one build per studio when you have hundreds — a new customer must be able to go live without a deployment. This constraint resurfaces in several decisions (rendering, styling, first-paint performance).

**It is consumer-facing and international.** So accessibility and internationalization are not options to add "when we have time". And above all, **time zones** become a first-order topic, because a scheduling application is one of the rare domains where being off by an hour completely ruins the feature.

**There is a mobile app.** So offline is a real question. With a concrete, verifiable argument you can invoke: **many studios are in basements, where the network is poor**. That detail turns an abstract offline discussion into an identifiable user problem.

**There is money in the flow.** Packs, memberships, recurring payments. That raises the cost of a mistake: a double charge is not a display bug, it is a dispute, a refund, and lost trust. That is what justifies insisting on idempotency.

**The move to make early in the interview.** Do not recite what you know about the product — it sounds like a memorized fact sheet. Use it to ask **better questions**: *"Are we talking about the branded member app, or the studio back office? Because the constraints aren't the same — one is consumer-facing and mobile-first, the other is a work tool used on desktop all day."* That question alone shows you have understood the business model.

---

## 3. The frame, and why you announce it

You are going to follow **RADIO**: Requirements, Architecture, Data, Interface, Optimizations.

**Why an explicit frame.** Three reasons, and all three count.

First, it stops you getting lost. Under pressure, out loud, in English, with three people watching, the temptation to wander into an interesting detail and never come back is real. A frame gives you a thread to hold on to.

Second, **it reassures them**. An interviewer who does not know where you are going cannot assess you calmly — they spend their energy trying to follow. If they know that architecture will be followed by data and then optimizations, they can let you run and focus on the content.

Third, it gives you a **time-management tool**. If at minute 40 you are still in architecture, you know it, and you can say out loud *"I'm going to speed up here to keep time for the booking flow, which is the heart of the topic."* That behaviour is itself a seniority signal.

**How to announce it, in one sentence, after hearing the prompt:**

> *"Let me structure this: I'll spend a few minutes clarifying requirements and assumptions, then sketch a high-level architecture, go into the data model and the API contract, and then deep-dive on whichever parts you find most interesting — I suspect the booking flow and real-time availability. Does that work for you?"*

Three things in that sentence are worth noting. It announces the plan. It **names the deep dives in advance**, which shows you have already identified where the difficulties are. And it ends with a question, which involves them and gives you the chance to be redirected early rather than at minute 50.

---

## 4. Minutes 0–10: clarify

This is their first explicit criterion, and it is also the phase experienced candidates rush the most, because they believe they already know. Take the time. Write the answers down where they can be seen.

### 4.1 How to ask the questions

Do not run through a mechanical list of twenty questions — that reads as a memorized questionnaire. Ask one question, **explain why you are asking it**, and follow through on what the answer changes. It is this explicit link from question to architectural consequence that sets you apart.

Bad version: *"Is there an offline requirement?"*
Good version: *"Does the mobile app need to work offline? I'm asking because it changes a lot: if it's read-only, a cache is enough; if we want to book offline, we need an action queue and a conflict-resolution strategy, and above all we need to decide what we promise the user, because we can't guarantee them a spot without the server."*

The second version does three things in ten seconds: it asks the question, it shows you know both implementations, and it raises a product problem they may not have anticipated.

### 4.2 Functional scope

**Which surface?** Member app, studio back office, or both? If you are not told, assume the member app and say so — it is the heart of the product and the richest case.

**Which journey exactly?** Browse a schedule, book, cancel, join a waitlist, pick a seat, buy a pack, pay? Each of these adds a dimension. If they let you choose, **choose browse + book + cancel** as the core, and mention that the waitlist and seat selection are refinements you will get to next. You have just set your V1 and your deep dives in one move.

**One member, one studio or several?** This determines whether the tenant context is fixed (one branded app = one studio) or variable (an aggregated, marketplace-style app). The consequences for caching and navigation are significant.

**Are the schedules public and indexable?** A studio wants to be found on Google when someone searches "pilates Bastille". If so, you have an SEO need, and therefore a rendering constraint.

### 4.3 Non-functional — what really drives the architecture

**Does availability have to update live?** And with what acceptable latency? The difference between "a few seconds of lag is tolerable" and "it has to move instantly" is the difference between simple periodic refresh and a server-pushed channel. Do not assume the latter.

**What are the real network conditions?** This is the question nobody asks and that changes the most. An app used on good office wifi and an app used on flaky 4G in a studio basement do not call for the same trade-offs. This is what will later justify your insistence on reducing round-trips and on offline reads.

**Which devices?** An entry-level Android does not have the CPU budget of a recent iPhone. That determines whether virtualization and controlling re-renders are a comfort or a necessity.

**What level of accessibility?** In Europe, on consumer-facing products, there is a regulatory dimension (the European Accessibility Act), not just an ethical one. And the audience of wellness studios includes older people and people in rehabilitation — the affected population is overrepresented, not marginal.

**How many languages, and do members travel between studios?** This leads straight into time zones.

### 4.4 Volumetry

Give orders of magnitude, even approximate ones. It is not precision that counts, it is the fact of reasoning in quantities rather than abstractions.

**How many slots on screen?** A day of schedule is about twenty classes. A month across studios is thousands. **That answer alone decides whether virtualization is necessary or would be over-engineering.** Asking now saves you from being cornered later: if they ask "how would you virtualize?", you can answer "we said twenty cards a day, so I wouldn't virtualize here — I would if we displayed a monthly view."

**What is the read/write ratio?** It is massively unbalanced: a schedule is read hundreds of times per booking. That is a structuring fact, because it points toward aggressive read caching and a carefully designed write path, rather than the opposite.

**How is load distributed over time?** Not uniformly — in spikes. When a studio opens bookings for the week, hundreds of people rush the same classes in the same second. That has two frontend consequences: it is exactly when booking conflicts become likely, and it is when an optimistic interface is most at risk of lying.

### 4.5 State your assumptions and move on

End this phase by verbalizing your assumptions, then moving forward. Do not stay stuck asking: if you get no answer, decide and announce your decision.

> *"Here's what I'm assuming: member-facing app, web and mobile, one studio at a time, roughly twenty classes visible at once, real-time availability matters, the network is unreliable in the venues, and there's money in the flow through credit packs. Tell me if any of that is wrong — those assumptions are what drive my rendering strategy, my caching, and how far I go on offline."*

That last sentence matters: it explains that your assumptions are not decorative, they are **the inputs to your decisions**. That is what makes the clarification phase useful rather than ritual.

---
---
# PART II — LAYING THE FOUNDATIONS

## 5. Minutes 10–15: the V1, deliberately simple

This is the most counter-intuitive moment of the interview. You have ten years of experience, you can already see the whole target architecture, and you are going to deliberately describe something basic.

**Do it, but announce that you are doing it.** The difference between a candidate who proposes a simple V1 because that is all they know, and a candidate who proposes it strategically, lies entirely in that announcement.

> *"Let me start with the simplest version that actually works, and then I'll show you where it breaks and what I'd add. I find that easier to challenge than a fully-loaded architecture."*

**The V1:** a client application calling a REST API. It fetches the list of sessions for a studio and a date range, displays them, and when the user clicks "Book", it sends a request and updates the screen with the response. Loading, error and empty states are handled. That is all.

**Then, immediately, name the flaws.** That is what turns simplicity into a demonstration of mastery:

> *"This works, and honestly for a pilot with one studio it might be enough. But there are four things that will break. First, availability goes stale the moment it's rendered — someone else books while you're looking. Second, every click waits for a round-trip, which on a bad connection feels broken. Third, if the network drops mid-request, we don't know whether the booking happened, and a retry could double-book. Fourth, nothing tells us when it's failing in production. Those four are what I want to dig into."*

Look at what that paragraph accomplishes. It sets a common baseline. It proves the simplicity was a choice, not a limit. It **announces four deep dives** — real time, perceived latency, idempotency, observability — matching exactly what their email asks for. And it gives them four entry points to challenge you, which makes their job easier and the conversation smoother.

It is the highest-return paragraph of the whole interview. It deserves to be rehearsed until it comes out naturally.

---

## 6. Minutes 15–25: the layered architecture

Now you build. Draw layers, not a cloud of boxes joined by arrows.

### 6.1 The layers

```
┌──────────────────────────────────────────────────┐
│  UI components                                    │
│  rendering, interaction, accessibility            │
├──────────────────────────────────────────────────┤
│  Local UI state                                   │
│  filters, modal, selection, step in the journey   │
├──────────────────────────────────────────────────┤
│  Server state / cache                             │
│  sessions, availability, profile, bookings        │
├──────────────────────────────────────────────────┤
│  Transport                                        │
│  HTTP client, real-time channel, offline queue    │
├──────────────────────────────────────────────────┤
│  Cross-cutting services                           │
│  auth · i18n · tenant theming · flags · telemetry │
└──────────────────────────────────────────────────┘
```

**The principle to state:** each layer has a single responsibility, and lower layers know nothing about higher ones. The HTTP client does not know a `ClassSlotCard` component exists; the cache does not know how an error is displayed.

**Make the link to clean architecture explicit**, since they cite it in their email. The point to make: clean architecture is not a backend-only idea. Its central proposition — the domain at the centre, independent of infrastructure, with dependency inversion — applies perfectly here.

> *"The domain logic — what a booking is, what states it can be in, what makes a session bookable — shouldn't know whether data arrives over REST, GraphQL or a WebSocket. If I keep that separation, I can swap the transport, test the domain without a network, and share that layer with the mobile app. That's dependency inversion applied to the client."*

That point has an important practical consequence you can chain into: it is what makes **web/mobile code sharing** possible and sensible. The domain layer — rules, state machine, types — is pure TypeScript, entirely shareable. The presentation layer does not share well, and should not. That is a trade-off to state if the mobile topic comes up: share what is invariant, specialize what is contextual.

### 6.2 The flow of a booking

This is where they want to hear you speak in flows rather than boxes. Tell the full journey, naming at each step who owns what:

> *"The user clicks. The component doesn't call the API — it dispatches a mutation. The mutation layer generates an idempotency key, applies an optimistic update to the cached session so the UI reflects the change immediately, and fires the request. On success it writes the response into the cache and invalidates the related keys. On a business failure it rolls back to the snapshot and surfaces a typed reason the component maps to a specific UI. On a network failure it retries with the same key. Meanwhile the real-time channel may push an update for that same session, and the reconciliation logic has to apply it without clobbering the in-flight optimistic change."*

That paragraph already contains your whole deep dive. Saying it once now, at a high level, lets you come back to it in detail later without rebuilding everything — and it makes them want to dig in.

---

## 7. Breaking it into components

### 7.1 The breakdown itself

| Component | Responsibility | Nature |
|---|---|---|
| `SchedulePage` | orchestration, top-level fetching, routing | container |
| `ScheduleFilters` | date, discipline, studio, instructor | container (local state + URL) |
| `ScheduleList` | list rendering, virtualization if needed | presentational |
| `ClassSlotCard` | one slot and its business state | presentational |
| `BookingFlow` | state machine for the journey | container |
| `SeatSelector` | seat selection, real time | container |
| `WaitlistButton` | joining and position | container |
| `MembershipBadge` | credits, eligibility | presentational |

### 7.2 What to say beyond the table

**The container / presentational distinction is not cosmetic.** Its real value is **stability**: presentational components do not change when the API changes. If your `ClassSlotCard` receives a well-defined props object rather than fetching its own data, an API contract redesign does not touch it. On a codebase that lives five years, that is the difference between a localized refactor and a project.

**Composition rather than accumulating props.** A `ClassSlotCard` with twenty-five boolean props is an alarm signal: it means it is trying to be every variant at once. The answer is composition — sub-components passed as children, or compound components — rather than one flag per variation.

This is a point where your experience speaks directly. At Ivalua you built a component library consumed by several teams, with a configuration engine allowing customization without code. The problem you solved — how a component stays stable while remaining extensible by third parties — is exactly the one that arises here, where every studio wants its own appearance.

**The re-render boundary.** This is the point that connects the breakdown to performance. When a real-time event says "session 42 now has 3 spots", it must re-render only the card for session 42, not the other forty. You do not get that from memoization added afterwards, but from **structure**: each card subscribes to its own slice of the cache, rather than receiving a global array as props.

Say it as a principle, because it is one:

> *"The first lever on re-renders isn't memoization, it's state structure — colocating state, splitting contexts, letting each card subscribe to its own slice. Memoization is what you add after you've measured, not what you sprinkle everywhere upfront."*

### 7.3 Telling the story of your component library

If the opportunity arises — and it will, because multi-tenancy invites it — tell the story of your work at Ivalua **as a system**, not as a list of features. The angles that land:

**Contracts.** How you defined what is guaranteed stable and what may move, so the core could evolve without breaking consumers.

**Extension points.** Declared explicitly, rather than letting teams patch the inside of components. The difference between designed extensibility and extensibility you suffer.

**Versioning and migration.** The real problem of an internal library: how to evolve a component used by N teams without blocking everyone or freezing the component forever.

**Developer experience.** Your configuration engine let non-developers customize. That is an API design problem for humans, which is harder than API design for machines.

That story is probably your best card in the whole interview, because few candidates have lived that problem at that scale, and because it maps directly onto a structural need at bsport.

---
---

# PART III — THE DATA

## 8. The server-side domain model

You are not designing the database. But you need to know what you are talking about in order to **negotiate the API contract**, and that is precisely what separates a senior frontend engineer from an integrator.

### 8.1 The four contexts

Announce the split before the entities — it shows you are modelling a domain rather than listing tables, and it answers their mention of DDD.

| Context | Entities | What it governs |
|---|---|---|
| **Catalog** | Studio, Location, Room, Discipline, Instructor | who, what, where |
| **Scheduling** | ClassTemplate, Session, Seat | when |
| **Booking** | Member, Booking, WaitlistEntry | who attends |
| **Billing** | Membership/Pack, Order/Payment | who pays |

> *"These map to bounded contexts, and they're also the natural seams of the API. The reason it matters to me as a frontend engineer is that a screen usually spans several of them — the schedule screen needs Catalog, Scheduling and Billing at once — and that tension is exactly where waterfalls and over-fetching come from."*

### 8.2 Catalog

**`Studio`** carries branding, time zone, currency, default locale, and booking policies (opening window, free-cancellation deadline, no-show penalty).

Two of those fields have a disproportionate frontend impact, and it is worth saying so:

**Branding** must be available **before first paint**, otherwise the user sees a flash of the wrong colours before the app rebrands itself. On an app supposed to belong to the studio, that is visible and it breaks the illusion.

**Time zone** must accompany every temporal value. We will come back to it in detail, but state it now: a class at 6 p.m. in Barcelona is at 6 p.m. for everyone, including a member browsing from Paris.

**`Location`** lets a studio have several addresses, potentially in different time zones. **`Room`** carries capacity and the floor plan. **`Discipline`** carries a name and a colour, which feeds filtering and the visual coding of the schedule. **`Instructor`** is a strong choice criterion for members — many people choose "X's class" rather than "yoga at 6" — so plan for instructor filtering and for displaying substitutions.

### 8.3 Scheduling — the part that matters

This is where the modelling subtlety a good interviewer is waiting for plays out.

**`ClassTemplate`** is the recurring definition: "Vinyasa, every Tuesday at 6 p.m., room 2, 45 minutes, instructor X, 15 spots, 1 credit". It carries a recurrence rule.

**`Session`** is **the concrete dated occurrence** — that is what gets booked. It carries its start instant in UTC, its time zone, its capacity, its booking counter, its status, and the **exceptions** for that specific occurrence: substitute instructor, changed room, cancelled class.

**The trade-off: materialize occurrences or generate them on the fly?**

*Generating on the fly* from the rule costs nothing in storage. But a generated occurrence **has no stable identity**: you cannot attach a booking, a cancellation or a substitute to it. And handling exceptions inside a recurrence rule quickly becomes unmanageable.

*Materializing* all occurrences gives each one an identity, and therefore the ability to hang data off it. But how far into the future do you generate?

**The answer: a rolling horizon.** You materialize a few months ahead and a job regenerates over time. You reconcile stable identity with bounded storage.

**And the real topic, which you should raise yourself: what happens when the rule changes?** The instructor changes every Tuesday from September. Do you modify the already-materialized occurrences? All of them, or only future ones? And the ones that already have bookings?

This is exactly Google Calendar's "edit this event / all events / all following" problem. Naming it that way shows you recognize a known problem instead of improvising. And it has a **direct frontend consequence**: the back-office interface must **ask the user** rather than guess, and the member app must handle "the class you booked has changed instructor or room" with a clear notification.

**`Seat`** exists only for classes with assigned spots: an identifier, a label ("Bike 12"), a position in the plan, a type (standard, accessible, out of service).

### 8.4 Booking and Billing

**`Booking`** carries the session, the member, possibly the seat, its status, and its idempotency key.

Its lifecycle is a genuine state machine:

```
                     ┌──> CHECKED_IN      (attended)
      ┌──> CONFIRMED ┤
      │              └──> NO_SHOW         (absent → penalty per policy)
PENDING ──> CANCELLED                      (by the member or the studio)
      └──> EXPIRED                         (hold not confirmed in time)

WAITLISTED ──(spot freed)──> CONFIRMED
```

**One point to make here, because it illustrates "simple first" perfectly.** The `PENDING` state only exists if there is a temporary **hold** while a payment goes through. If the booking is covered by a credit pack, the debit is instant and you go straight to `CONFIRMED`.

> *"So I wouldn't introduce hold-and-confirm by default. It brings a TTL, an expiry job, a pending state, a countdown in the UI, and hold release on abandon. That's a lot of machinery, and a credit-pack booking doesn't need any of it. I'd add it exactly when a card payment sits between the intent and the confirmation."*

That is the behaviour they are assessing, applied to a concrete case.

**`WaitlistEntry`** brings up a **product question to put to them** rather than decide alone: when a spot frees up, is the first person on the list booked automatically, or do they receive an invitation to accept within a time window?

Automatic maximizes fill rate — the studio's interest. Opt-in protects the member from being committed without wanting it, charged a credit, or even penalized for a no-show if they did not read the notification. And the right choice depends on the lead time: 24 hours before the class, opt-in is reasonable; 20 minutes before, an acceptance window leaves the spot empty.

> *"That's a product call more than an engineering one. I'd probably go hybrid on time-to-class, but I'd want to know whether studios penalize no-shows — because auto-booking someone who then gets penalized for not showing up is the worst of both worlds."*

**`Membership` / `Pack`** carries the membership type, remaining credits, validity, and **restrictions** (allowed disciplines or studios). This is what drives **eligibility**, and it is a major point for the interface: being able to book does not depend only on remaining spots, but also on the pack. We return to it in detail in the UI states chapter, because it is the point most candidates miss.

---

## 9. Availability: a projection, not a state

This is a modelling point where it is easy to get it wrong, and where having the right answer is very visible.

### 9.1 The principle

**Availability is not a stored attribute.** It is a **projection**:

```
availability = capacity (static)  −  occupancy (dynamic)
```

A `Seat` has no `is_available` field. It cannot have one: bike 12 is taken at 6 p.m. and free at 7 p.m. Availability is a property of the **(seat, session) pair**, not of the seat. If you store it on the Seat, your model breaks at the second session.

Consequence for the contract: the client consumes a list of `SeatAvailability { seatId, status }` **per session**, separate from the room layout.

### 9.2 Two regimes

**Anonymous capacity** — no individual seats, just a counter. The session carries `capacity` and `booked_count`.

**Assigned seats** — real `Seat` entities, availability computed seat by seat.

**The point to make: the second contains the first.** If you have the seats, you can derive the counter. But you do not make classes that do not need a floor plan pay for its complexity. The room layout is optional, and the interface switches between a simple journey and the `SeatSelector` depending on its presence.

### 9.3 The counter: derived or materialized

*Derived* (counting bookings on every read) is always exact and impossible to desynchronize, but expensive when the schedule is read heavily.

*Materialized* (a counter on the session, updated on every write) is instant to read, and it is also **that counter which carries the no-overbooking invariant server-side**. In exchange it can drift in case of a bug, so it needs periodic reconciliation.

**The read/write ratio settles it: materialized.** It is read hundreds of times per write.

### 9.4 Three states, not two

This is the subtlety that makes the difference:

| State | Origin |
|---|---|
| `FREE` | no occupancy |
| `HELD` | temporary lock with a TTL — someone is paying |
| `BOOKED` | confirmed booking |

Without `HELD`, you face an impossible choice: either you book on click, and an abandoned payment blocks the seat indefinitely; or you only book after payment, and two people can pay for the same seat. A hold with expiry solves that — and it is exactly what explains the booking's `PENDING` state and the countdown in the interface.

On top of that there are unavailabilities that do not come from members: broken machine, seat reserved for staff.

### 9.5 The point that governs everything else

> *"Whatever number the server gives me for spots left, it's a hint, not a guarantee. It might come from a cache, it might be two hundred milliseconds old, and someone may be mid-payment on the last seat. The only moment truth exists is the response to the booking request."*

And the design consequence, which is the real point:

> *"Which means the rejection path isn't an edge case I handle at the end — it's a nominal path I design from the start. 'The spot was just taken, here are three alternatives' has to be as polished as the success screen."*

That is a sentence worth a lot, because it shows you drawing a design consequence from a property of the system, rather than listing features.

---

## 10. The API contract, negotiated from the client

### 10.1 The stance

You are not a passive consumer of APIs. A senior frontend engineer **negotiates** their contract, with arguments that hold up in front of a backend team. Here are the four that carry.

### 10.2 Enriched responses: optimize round-trips, not bytes

**The trade-off.** Does the server return enriched sessions (with discipline, instructor, spots left, eligibility), or references to be re-fetched?

*Normalized* gives a compact payload but causes a **waterfall**: sessions, then instructors, then disciplines. Every hop costs a round-trip.

*Enriched* gives a larger payload with duplication — the same instructor repeated forty times — but a single round-trip.

**The deciding criterion is the cost of a round-trip on the target network.** On mediocre 4G in a basement, every hop costs between 100 and 300 milliseconds. Three cascading hops is a second of blank screen.

**The answer, and the argument to remember:**

> *"I optimize for round-trips, not payload size. Duplicating an instructor forty times costs a couple of kilobytes after compression; an extra waterfall costs hundreds of milliseconds of blank screen. Bandwidth is abundant, latency isn't."*

That is the highest-return principle in mobile network performance, and it fits in one sentence.

### 10.3 Eligibility comes from the server

**The trade-off.** Who computes "can this member book this class"?

*Client-side*, from the pack and the session: reactive, computable offline. But it **duplicates a business rule across three clients** — web, mobile, back office — and those three copies will drift. The day the studio adds a time restriction to a pack, you show "bookable" for a class the API will refuse.

*Server-side*, returned as a field with a typed reason: a single implementation, evolvable without redeploying clients.

**The criterion: is it a business rule or a presentation rule?** Eligibility is a business rule — it changes, it has exceptions, and it is worth money.

**The answer: the server decides, the client presents.** The server returns `canBook` **and** the typed reason; the client maps the reason to a UI.

**The subtle case, to raise yourself: what do we do offline?** You cannot ask the server. Two honest options: show the last known eligibility, explicitly marked as "to be confirmed", or embed an approximate copy of the rules and accept that it can be wrong — in which case the interface must stay cautious rather than assertive.

> *"Offline I'd show the last known eligibility, explicitly marked as unconfirmed, rather than re-deriving the rules client-side and lying confidently."*

### 10.4 Typed errors, because they drive the interface

**The trade-off.** A `400` with a message, or a machine-readable error code?

**The criterion: does each cause call for a different interface?** Here, overwhelmingly yes.

| Code | What the interface does | What's at stake |
|---|---|---|
| `SESSION_FULL` | roll back, offer the waitlist | retention |
| `SEAT_TAKEN` | back to the seat selector | experience |
| `ALREADY_BOOKED` | **not an error** — show the booking | don't alarm |
| `NO_CREDITS_LEFT` | offer to buy a pack | **revenue** |
| `NOT_COVERED_BY_PLAN` | offer an upgrade | **revenue** |
| `BOOKING_WINDOW_CLOSED` | "opens 3 August at 9 a.m." + reminder | retention |
| `CANCELLATION_TOO_LATE` | explain the policy | support avoided |
| `PAYMENT_FAILED` | change payment method | **revenue** |

**Two points to make.**

First, **the displayed message belongs to the client**. The code is for the machine; the text must be translated, matched to the brand's tone, and paired with the right action. Displaying the raw server message is a shortcut that produces inconsistent interfaces and sometimes information leaks.

Second, **`ALREADY_BOOKED` is not an error**. It is the normal result of a successful retry or a double click. Treating it as an error shows an anxiety-inducing alert in a situation where everything is fine. That detail is an excellent marker: it shows you think about non-nominal paths as user experiences, not as exception cases.

> *"Three of these codes are revenue opportunities rather than failures. And ALREADY_BOOKED isn't an error at all — it's usually a successful retry. Showing an error there scares the user for nothing."*

### 10.5 Time, in the contract

Instants travel in **UTC**, the **studio's time zone accompanies the data**, and rendering happens in that time zone. The device's zone is only used for relative displays ("in 2 hours") or to warn a travelling member. We expand on this in chapter 20 — but state the principle here, because it is a field of the contract.

---

## 11. Where state lives, and with which library

### 11.1 The four-way split

This is an immediate maturity marker. State it clearly.

**Server state** — sessions, availability, seats, my bookings, my pack, room layout.
*Characteristics:* I do not own it, it can be stale, it revalidates, it gets garbage-collected.

**Local UI state** — open modal, hovered seat, step in the journey, scroll position.
*Characteristics:* ephemeral, unshared, dies with the component.

**Global client state** — auth session, tenant theme, locale, network status, offline action queue.
*Characteristics:* cross-cutting, persistent, few consumers but scattered.

**URL state** — date, filters, selected class.
*Characteristics:* shareable, bookmarkable, survives a reload.

**The criterion that sorts everything: scope and lifecycle.** Who needs it, and when does it die.

**The mistake to name explicitly**, because it is the most widespread:

> *"The classic mistake is putting server data in Redux. It has a completely different lifecycle — caching, staleness, background revalidation, garbage collection — and you end up reimplementing all of that by hand inside reducers. I keep the global store for cross-cutting client state and the offline queue."*

**And the symmetric mistake**, less often cited: colocating everything and then lifting it through props across five levels. The rule is to colocate by default, lift when proven necessary, and prefer composition through children over prop drilling.

### 11.2 The URL as application state

A short point that lands. `/studio/42/schedule?date=2026-08-05&discipline=yoga` — the date and filters live in the URL, because a member wants to send "come to this class" to a friend, go back after opening a class, and find their filters again after a reload.

**The trap to mention: the back button.** If the booking modal opens without touching the URL, Android back exits the app instead of closing the modal. That is one of the most classic uninstall reasons on mobile, and it is invisible when developing on desktop.

### 11.3 Choosing the data-fetching library

**The common ground.** TanStack Query, SWR and RTK Query all do caching, request deduplication, background revalidation, stale-while-revalidate, loading and error states. Without them you reimplement all of that — badly.

And **none of the three does automatic normalized caching**. That is a limit worth knowing; we come back to it right after.

| | **TanStack Query v5** | **SWR** | **RTK Query** |
|---|---|---|---|
| Weight | ~13 KB gz | **~4 KB gz** | ~13 KB + RTK + React-Redux |
| Prerequisite | none | none | **Redux** |
| Invalidation | query keys, surgical | manual per key | **tags**, declarative |
| Optimistic | complete, built-in rollback | manual | via `onQueryStarted` |
| DevTools | excellent | limited | Redux DevTools, time travel |

**TanStack Query** is the most complete: mutations, optimistic updates with rollback, prefetching, SSR with fine control, reference devtools, the largest community. Against it: three times SWR's weight, more concepts to master (`staleTime` vs `gcTime`, structural sharing), and a v5 that introduced breaking changes.

**SWR** owns its minimalism: four kilobytes, very elegant with Next.js. On a read-dominant application, **simplicity is a feature, not a limitation**. Against it: you hit a ceiling as soon as mutations get complex, invalidation is manual, and it has no real notion of stale time or conditional revalidation.

**RTK Query** is the right choice **exactly when it looks like it**: when Redux Toolkit is already there. It removes thunk boilerplate, makes invalidation declarative through tags, and gives you time-travel debugging. Against it: it requires Redux, imposes a lot of specific concepts, its definitions are verbose, and the cumulative weight is substantial.

**The two questions that decide:** is Redux already there? And how complex are the mutations?

**Your answer, with your personal angle:**

> *"If the app already runs on Redux, I'd default to RTK Query — adding TanStack Query alongside means two competing data paradigms in one codebase, and that's a real maintenance and onboarding cost I've watched play out. On greenfield with no Redux, TanStack Query: better invalidation ergonomics and devtools, without paying the Redux tax. And I'd never adopt Redux just to get RTK Query."*

**And the point that really shows seniority:**

> *"The decision is driven by mutation complexity, not reads. All three cache a list of classes just fine. It's this booking flow — optimistic update, rollback on conflict, idempotent retry, reconciliation with a live event — that separates them."*

### 11.4 Document cache vs normalized cache

**The problem.** All three libraries store **whole responses** under a key. The same entity can therefore exist in several copies: class 42 is in the schedule, in "my bookings", and in the detail screen. I cancel from the detail — the other two lie until revalidation.

*A normalized cache* (Apollo, Relay) stores entities flat by identifier, with views holding only references. An update propagates everywhere instantly. But it costs: reliable global identifiers, garbage collection, and lists still have to be invalidated separately — a new entity does not magically appear in a list.

**The answer: document cache, with invalidation discipline.** Concretely, structure query keys hierarchically — `['sessions', studioId, date]` — so you can invalidate by prefix after a mutation.

**The link to make, and it shows the coherence of your decision system:**

> *"If that pain grew — if the app became genuinely graph-shaped and stale copies started causing real bugs — that's precisely where GraphQL with Apollo would earn its complexity. Its normalized cache is the best thing about it. But I wouldn't buy that upfront."*

### 11.5 Freshness, by data type

A short point that shows you have actually used these tools: **a single global freshness value is always a bad compromise**.

| Data | Freshness | Why |
|---|---|---|
| Room layout | hours | only changes on a refit |
| Disciplines, instructors | ~1 hour | near static |
| Schedule structure | a few minutes | changes little during the day |
| **Availability** | **zero + real-time channel** | changes by the second |
| My profile, my credits | invalidated after mutation | changes when I act |

> *"Stale time per data type, not one global value. Too short and I hammer the API; too long and I show phantom spots."*

---

## 12. Interface states

Two levels to distinguish clearly. Most candidates only see one.

### 12.1 Technical level: any remote data

| State | Expected rendering |
|---|---|
| **idle** | nothing requested yet |
| **initial loading** | **skeleton shaped like the content**, not a centred spinner |
| **success** | the content |
| **empty** | "No classes that day" + an action. **This is not an error** |
| **error** | clear message + retry, distinguishing network from server |
| **refetching** | content shown + discreet indicator |
| **optimistic** | anticipated value + a visual "in progress" state |
| **offline** | banner + cache + queued actions |

**The two points that separate seniors from the rest.**

**Never confuse empty with error.** An empty schedule on a Sunday is not an outage. Showing "an error occurred" when there simply are no classes generates needless support and anxiety.

**Never fall back to a skeleton on refresh.** This is *literally* the difference between an app that feels slow and an app that feels instant. If you re-skeleton on every background revalidation, the screen flickers and the user perceives every interaction as a reload. The distinction between initial load and background refresh is a state-architecture decision, not a cosmetic detail.

### 12.2 Business level: a class card

| State | Rendering | Action |
|---|---|---|
| `BOOKABLE` | spots left, solid CTA | Book |
| `ALMOST_FULL` | "2 spots left" badge | Book — *conversion lever* |
| `FULL` | full | Join the waitlist |
| `WAITLISTED_BY_ME` | "You're 3rd" | Leave the list |
| `BOOKED_BY_ME` | confirmed badge | Cancel / View |
| `PENDING` | disabled CTA + indicator | — |
| `INELIGIBLE` | "Not included in your pack" | **Upgrade / Buy** |
| `BOOKING_NOT_OPEN` | "Opens 3 August at 9 a.m." | Notify me |
| `CANCELLATION_LOCKED` | "Free until 12 h before" | Cancel with a warning |
| `CANCELLED_BY_STUDIO` | struck through + reason | — |
| `PAST` | greyed out | — |

**The point to hammer: `INELIGIBLE`.**

This is the case the vast majority of candidates forget, because they model availability and stop there. But "the class is full" and "your pack doesn't cover this class" are two **completely different** failures. The first offers a waitlist. The second is a **sales opportunity** — the member wants to come, they have money, they are just missing the right pack.

> *"If I collapse those two into one 'you can't book this' state, I've turned a sales opportunity into a dead end. And that's the studio's revenue, not just a UX detail."*

That is your best technical-to-business link of the whole interview, and it fits in two sentences.

**A second, subtler point to bring out if you have time: some of these states expire on their own.** At 5:59 p.m. cancellation is free, at 6:01 p.m. it is not, and **no server message warned you**. This is a rare case: data that becomes false through the mere passage of time. The consequence is that you need either a timer that recomputes at the deadline, or revalidation on focus return, or — most importantly — **a re-check at the moment of the action**. Never authorize a free cancellation on the strength of a state rendered ten minutes ago.

### 12.3 The state machine for the journey

```
IDLE
 └─> CONFIRMING              summary: class, instructor, time, cost
      ├─> SELECTING_SEAT     if assigned seating
      ├─> PAYING             if not covered by the pack
      ├─> SUBMITTING         optimistic: UI already updated
      ├─> SUCCESS            confirmation + add to calendar
      └─> FAILED ──> typed reason:
             SEAT_TAKEN      → back to the selector
             SESSION_FULL    → offer the waitlist
             PAYMENT_FAILED  → change method
             NETWORK         → auto retry, same key
```

**The trade-off: state machine or booleans?**

Five booleans — `isLoading`, `isError`, `isSuccess`, `hasSeat`, `isPaying` — give thirty-two combinations, the vast majority of which are **impossible** but **representable**. What is representable is reachable by a bug. And the rendering logic becomes a cascade of nested conditions nobody dares refactor.

A **discriminated union** makes impossible states unrepresentable, forces TypeScript to handle every case, and keeps state-specific data inside that state — the failure reason only exists in `FAILED`, you cannot access it elsewhere.

A **formal state machine** (XState) adds transition validation and visualization, at the cost of a dependency and a learning curve.

**The answer: a discriminated union in TypeScript, no dependency.** You get most of the guarantee for zero cost. XState if the graph gets genuinely complex — parallelism, nested states, history.

**The sentence**, which marries your advanced TypeScript with your architectural sense:

> *"A discriminated union rather than a handful of booleans — five booleans give you thirty-two combinations, most of which are impossible but still representable, so a bug can reach them. With a union, impossible states are unrepresentable and the compiler forces me to handle every case."*

---
---
# PART IV — THE CORE

## 13. Minutes 35–50: the booking flow

This is your set piece. If there is only one thing in this whole document you master perfectly, make it this sequence.

### 13.1 The full sequence

Tell it like a story, following the data:

**1. The click.** An idempotency key is generated — a UUID, generated **on the click**, not at request time. We come back to this; it is the subtlest point.

**2. The optimistic update.** You take a snapshot of the current cache state, decrement the spots left, and the card moves to `PENDING`. The user sees the result immediately.

**3. The request** goes out with the key in a header.

**4a. Success.** You write the response into the cache, then **invalidate** the related keys — the session, my bookings, my pack — to resync in the background. The card moves to `BOOKED_BY_ME`.

**4b. Business failure** (`SESSION_FULL`). You **roll back** to the snapshot, the card moves to `FULL`, and you offer the waitlist. The failure is explained, not silent.

**4c. Network failure.** You retry with increasing delay, **reusing the same key**. No double booking possible.

**5. In parallel**, a real-time event may modify the same session. Reconciliation must apply **without overwriting** the in-flight optimistic mutation.

### 13.2 The trade-off: optimistic or pessimistic?

*Pessimistic* — spinner, then update on the response. Never lies on screen, simple code, no rollback. But every action feels slow: on a 300-millisecond network, the app feels sluggish.

*Optimistic* — the interface changes immediately, rollback on failure. Feels instant, and **it is directly an INP improvement**. But it is more complex, and above all it **risks lying**.

**The criterion: the probability of success, and the cost of a lie.**

**The answer, and this is where it gets interesting: differentiated per action, even per context.**

| Action | Strategy | Why |
|---|---|---|
| Cancel | optimistic | almost always succeeds |
| Join a waitlist | optimistic | no scarcity |
| Book a half-empty class | optimistic | conflict unlikely |
| **Book the last spot** | cautious | conflict likely |
| Pay | pessimistic | never a false "paid" |

The refinement that shows finesse: **modulate optimism by the number of spots left**. On the last spots, an honest "confirming" beats a "you're in!" followed by "actually, no".

**And the point not to miss:**

> *"Optimism doesn't remove failure handling — it makes failure more visible, because the user already saw success. So the rollback has to explain itself: 'that spot was just taken, here are three alternatives', never a silent revert."*

### 13.3 Invalidation: the real cache topic

**The trade-off.** After a successful mutation, how do you resync?

*Invalidate and refetch* — you get server truth, you cannot get your local transformation wrong. But it is one more round-trip.

*Write the response into the cache* — instant, zero requests. But you have to transform correctly, and **the rest of the screen may stay stale**.

**The criterion: does the mutation affect data beyond what it returns?** Here, yes — a booking changes the session, but also my credits, my upcoming bookings, and possibly a waitlist. The response does not contain all of that.

**The answer: both.** Immediate optimistic write for perception, response written on success, **then background invalidation** of the impacted keys. The user sees it instantly, global consistency is restored silently.

**The trap:** keep the **pre-mutation snapshot**, otherwise rollback cannot be clean. And if two optimistic mutations are in flight on the same data, a naive rollback of the first overwrites the second — hence the value of using the mechanisms your library provides rather than a hand-rolled `setState`.

---

## 14. Concurrency, idempotency, retries

### 14.1 Idempotency, explained properly

**The problem.** The client sends the request. The server creates the booking. The response is lost — network cut, timeout. The client believes it failed and retries. **Two bookings, two charges.**

**Where is the key born?** Three options, two of them wrong:

*Generated by the server*: impossible. The server cannot know that two distinct requests represent the **same user intention**.

*Generated by the client at request time*: broken, and this is the classic mistake. Every retry generates a new key, so every retry creates a new booking. You feel like you have solved the problem and you have not touched it.

*Generated by the client at the moment of intention* — the click: correct. The same key is reused for **all** attempts at that intention.

**Why this is a frontend responsibility**, and this is the point to make:

> *"The key is tied to the user's intention, not to the HTTP request. That's why it's a frontend responsibility — only the client knows that this retry is a continuation of the same click. The server can't infer it."*

**This covers three scenarios at once:** the impatient double click, the automatic retry after a timeout, and the resync of an action queued offline an hour ago.

**The subtlest point, to keep in reserve if they push: when should the key be regenerated?** If the user gets `SESSION_FULL`, joins the waitlist, then a spot frees up and they book again — that is a **new intention**, so a **new key**. Reusing the old one would make the server return the old failure. The rule: **one key per intention, a new intention every time the user makes a fresh decision.**

And a corollary about scope: the key must cover **the booking and its associated payment**, otherwise you protect against a double booking but not a double charge.

### 14.2 Retries: what to retry, and what never to

| Situation | Retry? | Why |
|---|---|---|
| Timeout, network error | yes, backoff + jitter | transient, outcome unknown |
| `5xx` | yes, bounded | probably transient |
| `429` | yes, honouring `Retry-After` | the server told you what to do |
| Business `4xx` | **no** | retrying changes nothing |
| `401` | no — refresh the token, then replay | that is reauth, not a retry |
| Mutation without an idempotency key | **no** | duplicate risk |

**The parameters, and why each one matters.**

**Exponential backoff** — 1 s, 2 s, 4 s — avoids hammering a struggling server.

**Jitter**, a random addition to the delay, is indispensable and often forgotten. Without it, **all clients retry at the same time** and finish off the server at the precise moment it starts recovering. That detail shows you have thought about aggregate behaviour, not just a single client.

A **bound** — three attempts — then you hand control back to the user with an explicit button. And a **timeout** on every attempt: a network call without a timeout is a bug waiting to happen.

**The link between the two sections, to state out loud:**

> *"Retries and idempotency aren't two topics, they're one. I only auto-retry operations that are idempotent — a silent retry on a non-idempotent mutation is a duplicate generator."*

**And a UX point**: do not silently retry for ten seconds leaving the user in front of an indicator with no explanation. After a few seconds, say what is happening.

### 14.3 Anti-double-submit, in four layers

1. **Interface** — disable the button. Necessary, wildly insufficient.
2. **Client** — deduplication of in-flight mutations.
3. **Protocol** — the idempotency key. **The real protection.**
4. **Server** — a uniqueness constraint in the database. The ultimate net.

**You need all four**, but only layers 3 and 4 are **guarantees**. The first two are comfort.

**This is an excellent moment to show you know the limits of your scope.** An average candidate answers "I disable the button". A senior candidate says:

> *"Disabling the button is UX, not correctness. Two tabs, a direct API call, or an offline resync walk straight past it. The actual guarantee is the idempotency key plus a server-side uniqueness constraint. I can make the happy path feel instant — correctness has to live server-side."*

That sentence is valuable because it demonstrates three things at once: you know the client-side solution, you know it is insufficient, and you know where the real guarantee lives. That is exactly the profile of a senior frontend engineer who works well with backend.

---

## 15. Minutes 50–60: real time

### 15.1 The transport trade-off

| | **Polling** | **SSE** | **WebSocket** |
|---|---|---|---|
| Direction | client asks | **server → client** | **bidirectional** |
| Protocol | HTTP | HTTP (`text/event-stream`) | dedicated upgrade |
| Reconnection | n/a | **automatic + `Last-Event-ID`** | your problem |
| Latency | = the interval | low | low |
| Cost | useless requests | held-open connections | stateful connections |
| Complexity | ★ | ★★ | ★★★ |

**Polling** is trivial, needs no infrastructure, caches well, and degrades gracefully. But latency equals the interval, and the vast majority of requests return "nothing changed".

**SSE** is a stream of events pushed over a held-open HTTP connection. Three arguments in its favour: **it is plain HTTP**, so it crosses proxies and firewalls with no configuration; **reconnection is automatic and built in**, with a `Last-Event-ID` header that lets the server **replay missed events**; and the need here is purely one-directional. Its limits: one-directional, text only, and the connection cap discussed just below.

**WebSocket** is bidirectional and binary, with the lowest latency. But it is stateful — load balancing becomes sticky — and reconnection, heartbeat and recovery after a drop are **your problem**. You pay for bidirectionality even if you do not use it.

**The criterion: does the client need to emit continuously?**

**The answer:**

> *"For live availability, SSE. The need is purely server-to-client, it's plain HTTP, and the automatic reconnect with Last-Event-ID means the server can replay what I missed — with WebSockets I'd write all of that myself. I'd only reach for WebSockets where the interaction is genuinely bidirectional, like shared seat selection."*

**The expected challenge: "why not WebSocket everywhere?"** The answer is that you would pay for a bidirectional channel, stateful infrastructure and your own reconnection logic to serve a one-directional need. **The right transport is the simplest one that meets the need** — and that is exactly the demonstration they are after with "start simple, then refine".

### 15.2 SSE and HTTP versions

**The fact:** SSE works over HTTP/1.1, HTTP/2 and HTTP/3. It is not tied to a version — it is a `text/event-stream` response held open, available since HTML5.

**What changes is the concurrent connection limit per domain.**

In **HTTP/1.1**, browsers cap at roughly six connections per domain. But an SSE connection stays open permanently. Several tabs on your application means several streams, and the budget is saturated — **every other request queues up and blocks**.

That bug is particularly disorienting to diagnose, and that is what makes the anecdote land: the bug report you receive is *"the app freezes when I have three tabs open"*, which sounds like nothing at all.

In **HTTP/2 and HTTP/3**, requests are multiplexed over a single TCP connection, with around a hundred configurable concurrent streams. The problem disappears.

> *"SSE works on any HTTP version, but I'd want HTTP/2 — otherwise the six-connections-per-domain cap can starve every other request when a few tabs each hold an open stream."*

**Two nuances if they dig.** The limit is **browser-side**, not server-side; server-side the cost is the number of long-lived connections to maintain, which points toward an asynchronous backend. And there is a **workaround even on HTTP/1.1**: share a single SSE connection across all tabs via a `SharedWorker` that rebroadcasts. Only bring that out if they really dig — otherwise it is over-engineering.

### 15.3 Delta or snapshot, and why versioning

**The trade-off.** A full snapshot of the session is simple and idempotent, but heavy if repeated often. A delta is tiny, but **assumes you received all the previous ones, in the right order**.

**The answer: delta plus a monotonic version number.**

```json
{ "sessionId": "s_42", "version": 118, "changes": [{ "seatId": "v12", "status": "BOOKED" }] }
```

The version number serves three purposes:

**Reject an out-of-order event** — I receive version 117 after 118, I ignore it.

**Detect a gap** — I am at 115, I receive 118, so I missed events. I do a **full resync** rather than patching blind onto an incomplete base.

**Ignore an already-applied event.**

**The trap:** a delta without versioning is a time bomb. You never detect that you missed something, and your screen **diverges silently** from reality. Always plan a resync strategy — and that is exactly what SSE's `Last-Event-ID` makes easy.

### 15.4 Reconciliation with the cache

This is the real frontend topic in real time, and it should be treated as such.

**An incoming event must not overwrite an in-flight optimistic mutation.** If I have just clicked "Book" and my interface already shows the seat taken, a server event saying "3 spots left" must not put it back. Reconciliation has to know about in-flight mutations.

**On reconnection**, resync the visible state rather than replaying a potentially long history.

**Batch updates.** If two hundred seats change in one second, you do not apply two hundred re-renders — you aggregate over an animation frame. A tangible performance point, easy to state.

**Subscribe to what is visible only**, and unsubscribe when the tab is hidden, with a resync on return. That is a mobile reflex — battery and connection budget — showing you think about real usage conditions.

---

## 16. The SeatSelector

### 16.1 What it is, and why it is the right deep dive

This is the "choose your spot" component. On some classes — spinning with numbered bikes, reformer pilates — you do not book an abstract spot but **a specific seat** on a floor plan.

It is **the only component that genuinely justifies WebSocket**, and on its own it condenses every difficult topic. If they ask you to dig into something and leave the choice to you, propose this one.

### 16.2 Three layers of state, three lifetimes

This is the most important design point, and it follows directly from the "availability is a projection" principle:

**The room layout** — near-static server data, cacheable for hours. Only changes on a refit.

**Seat status for this session** — volatile, real time, never persisted.

**My current selection** — purely local UI state, meaningless outside the journey.

> *"Two separate resources with two different cache lifetimes. If I merge them into one payload, I re-download the entire room layout on every availability update — which is pure waste on a channel that fires several times a second."*

### 16.3 Concurrency, at seat granularity

You place an optimistic hold on the clicked seat for instant feedback, but it is only guaranteed after server validation. If someone took it in the meantime, roll back and say "pick another seat". Same logic as double booking, applied at a finer granularity.

### 16.4 The points that make the difference

**Conflict UX.** The "just taken" state must be **animated, not abrupt**. A seat that vanishes sharply while you are aiming at it is disorienting; a smooth transition communicates what is happening. It is a detail, but it is the kind of detail that separates someone who has built interfaces from someone who has specified them.

**Reconciliation.** A "seat 12 taken" event must never overwrite my current selection.

**Accessibility, and this is the point to raise spontaneously.** This is **the hardest component in the whole application to make accessible**. A clickable visual grid is unusable with a screen reader. You need keyboard selection, with labels that carry spatial information and status: "Bike 12, available, front row". And you need to announce changes without drowning the user in speech.

> *"The seat selector is the hardest thing in this app to make accessible. A clickable grid gives a screen reader nothing — you need keyboard selection with labels that carry position and status, and live announcements that are informative without being constant."*

Raising that yourself, unprompted, is a strong signal. Most candidates only mention accessibility when asked, and in generic terms.

---
---

# PART V — HARDENING

## 17. Offline

### 17.1 The levels, by increasing cost

**Level 0 — nothing.** An offline error screen. Zero cost, bad experience.

**Level 1 — cached reads.** The member sees their schedule and **their booking to show at the desk**. Low cost, very high value.

**Level 2 — queued writes.** Optimistic booking replayed on reconnection. High cost — queue, ordering, conflicts, expiry — and debatable value.

**Level 3 — full offline-first.** Very high cost.

### 17.2 The trade-off, and why it is more product than technical

**The criterion is real usage.** The concrete argument: the network is often poor in studios, frequently in basements. And the dominant need in that context is to **consult and prove** your booking, not to create one.

**The answer: level 1 always, level 2 only if usage data justifies it.**

**And here is the point worth making, because it shows product judgment rather than technical enthusiasm:**

> *"Offline booking is technically attractive and honestly questionable in value. I'd be promising a spot I can't guarantee — the member thinks they're booked, walks in, and there's no bike. A feature that fails silently is worse than not having it. If we did build it, the UI has to say 'pending confirmation', never 'confirmed'."*

That is a position that can surprise positively: a candidate who **refuses** an attractive feature for good reasons is more reassuring than one who accepts everything.

### 17.3 If you do implement writes

The rules to enumerate, because this is where quality is decided:

**Ordering.** Replay actions in the order they were issued. Book then cancel is not cancel then book.

**Expiry.** A queued action for a class that has **already happened** must be dropped, not replayed. Otherwise you book yesterday's class.

**Compaction.** Book then cancel before resync should cancel out locally rather than produce two calls.

**Idempotency.** The key generated offline protects against a duplicate if the action had in fact succeeded before the cut.

**Notification.** If the user closed the app, they have to learn the outcome some other way — a notification, or a clear state on reopening.

**Conflict resolution: server-wins, no hesitation.** A seat is an exclusive resource: there is nothing to merge. CRDTs are off-topic here, and knowing how to say so shows you know the tool **and** its domain of application.

### 17.4 The service worker

**One strategy per resource type**, not a global policy:

| Resource | Strategy |
|---|---|
| Hashed assets, fonts | cache-first |
| Application shell | cache-first + background update |
| Room layout, disciplines | stale-while-revalidate |
| Schedule | network-first with fallback |
| Availability | network-only |
| Mutations, payment | network-only |

**The classic trap, and it is painful: the service worker stuck on an old version.** A badly managed service worker serves a stale application indefinitely, and your users never see your fixes. You need an explicit **update strategy**: detect the new version, and either invite a reload or activate immediately — knowing that immediate activation can break an in-progress session if assets change under the application's feet.

**And storage:** IndexedDB for the action queue, because it is **asynchronous and transactional** — localStorage is synchronous, so it blocks the main thread, and a corrupted queue is worse than no queue. Tokens stay in memory. Three things to mention: schema versioning with migration, purge on logout (especially on a shared device), and the fact that **the browser can evict storage under pressure** — the application must work without it.

---

## 18. Rendering strategy

### 18.1 The trade-off, by surface

| Surface | Choice | Why |
|---|---|---|
| Public schedule, studio pages | **SSG/ISR** | indexable, identical for everyone, fast LCP |
| Shareable class detail | **SSR** | indexable but with fresh data |
| Member app | **CSR** | personalized, no SEO, highly interactive |

**The three questions that decide, in order:** is the content public and indexable? Is it personalized? Does it change often?

### 18.2 The point that shows you are not reciting

The expected challenge is *"why not SSR everywhere, isn't it better for performance?"*. The answer:

> *"SSR mainly improves LCP. Inside the member app, the user has been there for thirty seconds — the bottleneck isn't first paint, it's INP: how fast the Book button responds. SSR would add server cost and hydration complexity to optimize a metric that isn't the constraint here. And interestingly, the thing that actually improves INP on this screen is the optimistic update we discussed earlier."*

That link between rendering strategy and the booking flow shows your decisions form a coherent system, not a collection of independent choices.

### 18.3 The multi-tenant trap

With per-studio branding, **the theme must be known before first paint**, otherwise you get a flash of unbranded content. That is a genuine argument for SSR on public surfaces: tokens are injected server-side. In pure CSR, you either inline critical CSS per tenant or accept a neutral loading screen.

**And the theming trade-off itself**, while we are here. One build per tenant gives optimal CSS and zero flash, but **does not scale**: a thousand studios, a thousand builds, and a new customer waits for a deployment. The answer is **a single build with CSS custom properties**, tokens resolved as early as possible.

**The point to raise, and it is an excellent one: the accessibility of theming.** If a studio picks pale yellow on white, WCAG contrast blows up. You have to **validate contrast ratios at the moment the studio picks its colours**, in the back office, and provide automatically derived tokens. Few candidates make that link between multi-tenancy and accessibility.

---

## 19. Performance

### 19.1 Start by questioning the need

If they ask "how would you virtualize?", the best answer starts with a question:

> *"First — do we need to? We said a day of classes is about twenty cards. Virtualizing that is over-engineering, and it costs me browser search, deep-linking to an element, and screen-reader semantics. I'd virtualize if we're rendering a month across studios."*

That is exactly the "start simple" behaviour they are assessing, applied live to their own question. And it shows you connecting your answer to the volumetry established during clarification — which proves that phase was useful.

**And the real answer for a schedule:** the natural pagination of a calendar is **a time range**, not a page. You navigate by day or by week. Questioning the framing of the question rather than picking from an imposed menu is a seniority signal.

### 19.2 Re-renders: structure first, memoization second

The main lever is **not** memoization, it is **state structure**: colocate, split contexts — a context holding both the theme and the scroll position re-renders everything on every scroll — and use composition through children, which naturally avoids re-rendering descendants.

Memoization comes after, **targeted, at the boundaries that matter**. Here: memoize the class card so that a real-time event on one session does not re-render the other forty. That is a case where the gain is structural and predictable, not speculative.

Mentioning the React Compiler as the framework's direction is welcome, staying cautious about its exact status.

### 19.3 Which metric, and why it depends on the surface

**Public schedule → LCP.** The user arrives from Google and judges in one second.

**Member app → INP.** They are already inside; what matters is that "Book" responds instantly. And the optimistic update is exactly an INP optimization.

**Everywhere → CLS**, and not for aesthetic reasons: a layout that jumps as availability updates can make someone **click the wrong class**. Here, visual instability produces a booking error.

**The point about measurement:**

> *"And I'd measure in RUM, at p75 and p95 rather than averages. A perfect Lighthouse score on a wired MacBook tells me nothing about a mid-range Android on 4G in a basement — which is exactly our user."*

### 19.4 The bundle

Route-based splitting as a baseline, plus lazy loading on the big, rarely reached chunks: the payment journey, the `SeatSelector` — only useful for some classes — and the back office.

**And the refinement that is a pleasure:** preload on intent. On hover of the "Book" button, load the modal's chunk. The code arrives before the click, and the user never sees the latency.

**The trap:** too much splitting produces a **cascade of chunk requests** that costs more than the monolith you avoided. And every lazy-loading boundary needs an error boundary with retry — otherwise a connection that drops while loading a chunk breaks the application.

---

## 20. Accessibility, i18n, security

### 20.1 Time zones, in detail

This is the trickiest topic in a scheduling application, and handling it correctly is very visible.

**The principle: the studio's local time, always.** A class at 6 p.m. in Barcelona is at 6 p.m. for everyone. A Parisian member browsing must see 6 p.m. It is a property of the **place**, not of the observer.

**The technical corollary:** instants travel in UTC, the studio's time zone accompanies the data, rendering happens in that time zone. The device's zone is only used for "in 2 hours" or to warn a travelling member.

**The traps, and they are vicious.**

**Daylight saving.** A recurring class at 6 p.m. **local** stays at 6 p.m. after the switch to winter time, while its UTC instant changes. So **recurrence is defined in local time, not in UTC**. Generating occurrences by adding 168 hours to a UTC instant produces classes shifted by an hour twice a year — a classic bug, embarrassing, and hard to diagnose because it only shows up twice a year.

**The hour that does not exist, or exists twice.** At the spring switch, 2:30 a.m. does not exist; in autumn it exists twice. A class scheduled at that moment needs an explicit rule.

**Server rendering.** The server must not format in **its** zone, otherwise rendered HTML and hydration diverge.

**The tools:** the `Temporal` API is designed for this and makes these cases explicit; in the meantime, `date-fns-tz` or Luxon. **Avoid hand-manipulating native `Date` objects** for time-zone logic.

> *"Generating recurring occurrences by adding 168 hours in UTC silently shifts every class by an hour, twice a year. Recurrence is defined in local time — that's the one thing I'd make sure is right from day one, because it's cheap now and it's a support nightmare later."*

### 20.2 i18n

**The format:** ICU MessageFormat rather than plain keys, because it handles **plurals** — Russian has several forms, Arabic six — and gender. A naive interpolation of "{n} spots left" breaks in the singular and in half the languages.

**Formatting** through the native `Intl` API for dates, numbers, currencies and lists, rather than home-made tables.

**Two things to build in early because they are free now and expensive later:** CSS logical properties (`margin-inline-start`) in case RTL arrives, and **testing the layout in a verbose language** rather than in English — German is often 30% longer, and a button sized for French breaks.

**One case to mention:** class descriptions are entered **by the studios**, they are not translated. What does a member who does not speak that language see? Often nothing special — but it should be decided consciously rather than discovered in production.

### 20.3 Frontend security

This is a domain where you have depth, and that is rare — use it.

**Token storage.** localStorage is trivial but **accessible from JavaScript, so exfiltrable by any XSS**, including an XSS coming from a compromised dependency. An `httpOnly` cookie is inaccessible to JS. The best combination is **access token in memory, refresh token in an httpOnly cookie**, with rotation and reuse detection.

**The nuance that is worth more than the answer.** You often hear "if you have an XSS you've already lost". That is a half-truth:

> *"httpOnly doesn't make XSS harmless — an attacker can still act inside the session from the page. But it stops them exfiltrating a token to use elsewhere and later, which changes the blast radius and the duration of the compromise. It's defense in depth, not a fix."*

**The bsport context:** class descriptions are entered by studios, so there is a **real XSS surface**. Systematic sanitization, extreme caution with `dangerouslySetInnerHTML`, strict CSP.

**Multi-tenancy is also a security topic**, and this is the point not to miss: **every cache key must include the studio identifier**. Forgetting it does not produce an experience bug, it **leaks one studio's data into another's application**. In a B2B2C SaaS, that is a major incident.

**Payment:** card fields stay in the provider's hosted inputs, so the data never touches your state or your PCI scope.

### 20.4 Accessibility

The scope: **WCAG AA on critical journeys** — browse, book, cancel, pay — with automatable tests in CI and a manual audit on those journeys.

The concrete points on this screen: **focus management** in the modal (trap, then restore to the trigger), **the `SeatSelector`** (the hardest, see §16.4), **live regions** to announce availability changes — sparingly, otherwise the screen reader becomes unusable — **tenant theming contrast**, and adequate **touch targets**.

**The argument that wins the meeting**, and it is not the moral one:

> *"Retrofitting accessibility costs several times more than building it in, because it touches DOM structure, semantics and focus order — not styling. It's a cost argument as much as an ethical one. And on a wellness product, the affected population is overrepresented, not marginal."*

---

## 21. Observability and debugging

Their email explicitly asks "how you would monitor or debug the system". Do not skim it.

### 21.1 The layers

**Errors** — tracking with context (tenant, route, version) and **source maps**, without which minified stacks are useless.

**Real performance** — RUM on real devices, segmented by device and network type, read at **p75 and p95** rather than as an average. An average hides exactly the users who suffer.

**Traces** — a **trace identifier propagated from the click through to the backend**. It lets you follow a failed booking end to end, and it costs one header. It is the debugging lever that changes life in production the most.

**Business** — the most important, and the most often forgotten.

### 21.2 Business metrics

**Booking funnel completion rate.** The queen metric.

**Failure rate by error code.** A rise in `PAYMENT_FAILED` is an incident even if no server went down.

**Perceived confirmation time**, from click to feedback — not API latency.

**Optimistic rollback rate.** If spots are taken between display and click far more often than before, your real-time availability is lagging. That is a metric that **diagnoses a technical layer through a user symptom**, and that is the kind of thing that impresses.

### 21.3 The point that really sets you apart

> *"A frontend can be perfectly healthy — zero JS errors, normal latency, every service green — and completely broken, because a button ended up invisible at one breakpoint or a condition blocked one step of the flow. No technical monitoring catches that. Only funnel completion does. So I'd alert on booking completion rate, not just error rate."*

That is the passage that shows you have operated applications in production, not just built interfaces.

---
---
# PART VI — CLOSING

## 22. POC vs production, and business impact

### 22.1 The boundary

| Deferrable in a POC | Never deferrable |
|---|---|
| Full offline | **Anti-double-booking** (idempotency) |
| Real time / WebSocket | **Clear, typed error states** |
| SSR / SEO | **Correct displayed times** |
| Virtualization | **No false "confirmed"** |
| Exhaustive i18n | Basic security |
| A complete design system | Keyboard a11y on critical journeys |

**The criterion that governs the boundary**, and the phrasing is what counts:

> *"What's deferrable is what I can add later without breaking anything or misleading anyone. What isn't deferrable is anything whose absence produces a lie to the user or loses the studio money."*

### 22.2 The impact grid

| Technical defect | Business consequence |
|---|---|
| Slow or confusing funnel | abandonment → attendance drops |
| Double booking | dispute, refund, trust lost |
| Phantom seat | member on site with no machine |
| Wrong time zone | missed class |
| `INELIGIBLE` mishandled | **lost sale** |
| No offline | member stuck at the desk with no network |

### 22.3 The stance

> *"A POC narrows scope, it doesn't lower correctness. Reducing what we support is legitimate; reducing whether it's right isn't."*

That distinction is exactly what their email tests with "how you arbitrage between a quick proof of concept and a production ready system". Most candidates answer in terms of "what we can botch". The right answer is in terms of **scope**, not quality.

---

## 23. When they push you toward the backend

They will, because it is the fastest way to probe the limits of a frontend candidate. Here is what you need to be able to mobilize, and above all **how to draw the boundary cleanly**.

**Double booking, server-side.** The guarantee cannot come from the client. The server serializes concurrent writes — an atomic operation of the "decrement **if** there is room" kind. What you should take from it: the server is the source of truth, your role is to handle its refusal elegantly.

**Hold and confirm.** If payment takes time, the server places a temporary lock with an expiry, then confirms. Hence the `PENDING` state and the countdown in your interface.

**Payment / booking consistency.** Between two services you use **sagas** — compensable steps: if payment fails after the booking, a compensating action cancels or refunds. **The frontend consequence is direct**: confirmation may be **asynchronous**, so you need a "confirming" state and a mechanism to learn the outcome (real-time channel, polling, or notification).

**Server-side caching.** Your availability may be served from a cache. So a slightly stale value is normal, which loops back to the principle in §9.5.

**The sentence that draws the boundary cleanly**, and it is probably the most useful of the whole interview in the face of this kind of question:

> *"The correctness guarantee has to live server-side — I can't prevent double-booking from the client, and I wouldn't try. My job is to make the optimistic path feel instant and the rejection path feel graceful. What I do care about on the API side is that the contract gives me typed reasons, so I can turn each failure into the right experience."*

It demonstrates three things: you know what happens server-side, you know it is not your scope, and you know exactly what you need from the contract to do your job well.

**And if they push you on something you genuinely do not know**, the right answer is never to bluff:

> *"I haven't built that specific piece. Here's how I'd reason about it, and here's who I'd want in the room to validate it."*

---

## 24. Minutes 80–90: the close

### 24.1 Manage time out loud

If you sense you will not cover everything, **say so and prioritize explicitly**:

> *"I have about fifteen minutes left. I'd rather go deep on one more thing than skim three — would you prefer real-time reconciliation, or how I'd monitor this in production?"*

That is senior behaviour, and it involves them in the choice.

### 24.2 The summary

Recap in one minute what you built, insisting on **the decisions**, not the components:

> *"So: I started with a simple client that fetches and books, then hardened it in four directions. Optimistic updates with a client-generated idempotency key, so the app feels instant and retries are safe. SSE for live availability, because the need is one-directional and reconnection comes free. Read-first offline, because the network is bad in venues and what people need there is to show their booking. And typed errors throughout, because three of the failure modes are actually revenue opportunities. The thing I'd want to validate first with your team is the waitlist promotion policy — that's a product decision that shapes a lot of the UI."*

That paragraph does four things: it shows you have an overall view, it recalls your best points, it ends on an **open product question** that extends the conversation, and it demonstrates that you can summarize — an underrated and much sought-after skill.

### 24.3 The questions to ask

They count, and they help you decide whether you want the job.

**Technical.** Where is the frontend today — monolith, modules, several apps? What hurts most right now? How do you handle multi-tenant theming? Do web and mobile share code, and how far? Who decides API contracts — are frontend teams involved upstream, or do they receive what exists?

**Organization.** How are teams split — by feature, by surface, by domain? Is there a notion of "frontend platform", or does each team run its own stack? What impact would be expected in my first six months?

**Product.** What is the hardest constraint today — scale, the variety of studios, international?

The question about API contracts is particularly good: it reveals the engineering culture, and it naturally extends what you have just demonstrated for 90 minutes.

---

## 25. Toolbox

### 25.1 The minute-by-minute walkthrough

| Time | Phase | Content |
|---|---|---|
| 0–10 | **R** | clarify, assumptions, volumetry |
| 10–15 | **V1** | the simple version + its four announced flaws |
| 15–25 | **A** | layers, components, the flow of a booking |
| 25–35 | **D + I** | model, API contract, error states, client state |
| 35–50 | **Deep dive 1** | booking flow, optimistic, idempotency, retries |
| 50–60 | **Deep dive 2** | real time, reconciliation, SeatSelector |
| 60–80 | **O** | offline, rendering, perf, a11y/i18n/security, observability |
| 80–90 | **Close** | POC vs prod, summary, questions |

### 25.2 The lines that carry

**Framing**
- *"Before I design, let me clarify requirements and state my assumptions."*
- *"Let me start with the simplest version that works, then show you where it breaks."*

**Data**
- *"I separate server state from UI state — the schedule is cached server state, the filters are local."*
- *"I optimize for round-trips, not payload size. Bandwidth is abundant, latency isn't."*
- *"The server owns eligibility and returns a typed reason; duplicating business rules across three clients guarantees they drift."*
- *"Impossible states should be unrepresentable."*

**The core**
- *"The idempotency key is generated on the click, not on the request — only the client knows a retry is the same intention."*
- *"Optimism doesn't remove failure handling, it makes failure more visible."*
- *"Availability is a hint, not a guarantee — so the rejection path is a nominal path, not an edge case."*
- *"Correctness has to live server-side; my job is to make the happy path instant and the rejection graceful."*

**Real time & offline**
- *"SSE, because the need is one-directional and reconnection with Last-Event-ID comes free."*
- *"Offline, the server stays the source of truth — the seat isn't confirmed until it validates."*

**Trade-offs**
- *"I'd defer that; for a POC it's over-engineering — and here's the signal that would make me add it."*
- *"That's a fair challenge — if we assume that constraint, here's what I'd change and what it costs."*
- *"I haven't built that specific piece, but here's how I'd reason about it."*

### 25.3 The drills

To do **out loud**, timed:

1. **Design the booking experience for a fitness studio.** The most likely.
2. **Design a real-time schedule view** for thousands of concurrent users.
3. **Design the offline-capable member app.**
4. **Design a component library for branded multi-tenant apps.** Your home ground.
5. **Design the checkout and membership flow.**

For each: assumptions, V1, announced flaws, refinements, trade-offs, business impact.

---
---

# TEN THINGS NOT TO MISS

1. **Clarify before you draw**, and explain *why* each question matters.
2. **Put up a simple V1, then announce its four flaws.** The highest-return paragraph of the interview.
3. **Separate server state from UI state.** An immediate maturity marker.
4. **The idempotency key is born from the intention, not from the request.**
5. **Availability is a projection and a hint** — so the rejection path is a nominal path.
6. **`INELIGIBLE` is not `FULL`.** Your best technical-to-business link, in two sentences.
7. **SSE rather than WebSocket**, because the need is one-directional — and know when to switch.
8. **Recurrence is defined in local time**, never in UTC.
9. **Alert on funnel completion rate**, not just on error rate.
10. **Adapt when they challenge you.** Restate, say what it changes, adjust. That is the test, not a trap.

You have the level and the experience. What is at stake now is the storytelling — making visible a line of reasoning you already follow.
