# The Fuming Lake — extracted content (BRDC-QUEST-001)

Extracted once from v2 `game/data/QuestFumingLake.js` so no one has to read the legacy
repo again (golden rule 6). The rule-5 exception for this extraction was the owner's
call, 2026-09-01. The playable version lives in
`packages/core/src/data/adventures.json`; this is the source it was adapted from.

## Voice

Terry Pratchett meets H.P. Lovecraft. Cosmic horror played as farce. The universe is
vast, indifferent, and mildly annoyed. Footnote humour, apologetic signage, bureaucratic
Elder Gods.

## The six beats

1. **The Statue.** A boy holds a propeller that "shouldn't exist — it's *aggressively
   possible* in ways that make reality uncomfortable." A map at his feet points to a lake
   and is "screaming, very quietly." Signed *-Management*.
2. **The Lake.** Fuming green, not metaphorically. A fallen sign: *"DO NOT BREATHE THE
   FUMES. SIDE EFFECTS INCLUDE: Death, Un-death, Sideways-death, and Mild Indigestion."*
   The fumes "smell of burnt algebra and disappointed expectations." Get to high ground
   or become a cautionary tale.
3. **The Hermit.** Cornelius — "professional hermit, amateur reality-botherer." Talks to
   rocks ("excellent conversationalists, unlike trolls"). Has an incantation to clear the
   lake, wants company ("safety in numbers, and also, I'm lonely"). Warns of the troll.
4. **The Troll.** Grug, on a bridge, mid-philosophy: *"What is the sound of one hand
   thinking?"* Three ways past, per Cornelius: **a shiny trinket bribes him, a staff
   slays him, wisdom outwits him.** A fourth — argue philosophy — and he "deconstructs
   your argument in three sentences, then deconstructs you."
5. **The Deep.** Cornelius begins the incantation. It goes wrong. The fumes thicken, the
   lake *unfolds*, Cornelius screams an *enlightened* scream. Something rises: "too many
   angles, too many eyes, not enough mercy."
6. **Servitude.** The voice is "not sound, it's *concept*." *"SERVANT," it says. You
   are. The choosing was an illusion. Free will is closed for renovations.* Ending is
   the same on every route: you are conscripted. "Try to see the bright side: excellent
   dental." Reward: 500 XP, the codex entry *cthulhu-awakening*.

## The three troll solutions → v3

v2 had you carry items. v3 has no inventory, so each route requires **holding the cell**
at that site (you walked there and claimed it), plus a small resource nick:

| Route | Site cell held | Resource |
|---|---|---|
| Outwit | Wisdom Stone | wisdom |
| Slay | Ancient Staff | iron |
| Bribe | Shiny Trinket | gold |

The staff is given by Cornelius; in v3 that becomes "the Hermit stage unlocks the staff
site as claimable" — or simply: hold the staff cell.

## The ten locations (v2 coordinates, real Härmälä)

| Site | lat | lng |
|---|---|---|
| Statue of the Boy (start) | 61.47290805294704 | 23.725882485862012 |
| The Fuming Lake | 61.47525973065058 | 23.728040739777192 |
| Shiny Trinket | 61.47414451871632 | 23.728673812249834 |
| Hermit's Hovel | 61.47307544507844 | 23.732610983055974 |
| Ancient Staff | 61.473586729904675 | 23.733321862539352 |
| Troll Bridge | 61.47658474193526 | 23.730553569085355 |
| Wisdom Stone | 61.475937533235395 | 23.724059855235694 |
| The Deep | 61.477750840409435 | 23.7272125677718 |
| Healing Shrine | 61.47295360880876 | 23.726675342590156 |
| Sanity Shrine | 61.476970066258765 | 23.730978272652262 |

The statue is the canonical origin. The lake at 61.4753, 23.7280 confirms the water
placement in `terrainSeed.ts`.

## Dropped in the v3 adaptation

- Health / sanity damage — no system in v3 (§6, parked). Flavour stays, mechanic goes.
- SVG cutscenes — replaced by one animated sacred-geometry sigil per speaker.
- Player titles / achievements — XP and a codex unlock only.
- The Healing / Sanity shrines — markers only for now, no mechanic.
