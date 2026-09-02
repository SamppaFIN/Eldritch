# BRDC-WIKI-002 — Kirja täyttyy kohdatessa, ja You näyttää vain nähdyn

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WIKI-001 (viipale 3), BRDC-CHAR-001 |
| **Status** | `done` — 2026-09-02 (v0.5.19), kenttätodennus [~] |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä kaksi havaintoa, jotka ovat sama sääntö kahdesta suunnasta:

*"Älä näytä you sivulla levelien selityksiä, mitä ei ole nähty"* — hahmonäkymä listaa
kaikki Consciousness-tasot selityksineen, myös ne joita pelaaja ei ole saavuttanut. Se
kertoo lopun etukäteen ja tekee etenemisestä luettelon.

*"haluan myös, että ohjekirja täyttyy sitä mukaa kaikesta mihin törmää selityksellä"* —
Guide näyttää heti kaikki 17 sivua, myös mekaniikoista joita pelaaja ei ole nähnyt.
Kirja on täysi ennen kuin peli on alkanut.

Sama periaate: **peli näyttää vain sen minkä pelaaja on kohdannut.** `BRDC-WIKI-001`in
GREEN-listalla tämä on jo rivinä (*"Wiki päivittyy itsestään kun mekaniikka avautuu"*),
merkittynä `BRDC-TUTOR-001`in varaan. Kenttätesti nosti sen omaksi työkseen.

## 🟢 GREEN

- [x] **Kohdattujen aiheiden rekisteri.** `es3:seen-topics` (`features/help/encountered.ts`).
      `useEncountered` lukee lokin joka lapin jälkeen, mappaa `kind` → `HelpTopic`
      (`LOG_TOPIC`, `describe.ts`) ja kirjaa kohdatut. `markSeen` palauttaa kerralla
      lisätyt. Ensimmäinen valtaus → `awakening`, ensimmäinen rappio → `decay`, jne.
- [x] **Guiden etusivu listaa vain kohdatut** + aina `how-to-play` / `first-walk` /
      `vocabulary` (`ALWAYS_SEEN` — ohje, ei palkinto). `HelpPanel` saa `seen`-propin,
      suodattaa `GROUPS`; ryhmä ilman yhtään kohdattua aihetta ei näy.
- [x] **Uusi sivu ilmoittaa itsestään** — `GuideNews`: yksi kulta rivi, 8 s, napautus
      avaa sivun. `useMapAside`in noden sisällä. Ei modaali, ei ääni.
- [x] **Syvälinkki voittaa rekisterin** — `openTopic = note(t) + setHelp(t)`; kaikki
      `onTopic`-reitit (Vigil, loki, hahmonäkymä) menevät sen läpi ja kirjaavat aiheen.
- [x] **Hahmonäkymä näyttää vain saavutetut tasot** — `visibleMilestones(level)`
      (`consciousness.ts`): `reached` selityksin, `next` nimettynä
      *"reach it to learn what it means"*, loput piilossa.
- [x] Testit: `encountered.test.ts` (kirjaa kerran eikä kahdesti · always-3 aina ·
      etusivun suodatus), `consciousness.test.ts` (`visibleMilestones`). 888 vihreää.
- [~] Kenttätodennus: uusi peli → Guide näyttää vain 3 sivua; valtaa → "new page" -rivi
      → Awakening ilmestyy. Ensi testipäivänä.

## Ei tässä

- Opastus askel askeleelta (`BRDC-TUTOR-001`). Tämä ei opeta, se vain lakkaa näyttämästä
  sitä mitä pelaaja ei ole nähnyt.
- Taulukoista johdetut rakennus- ja Riitti-sivut — yhä `BRDC-WIKI-001`in iso GREEN.
- Hahmon nimen muokkauksen fokusbugi (kenttähavainto 2026-09-02: *"ruutu rupes nykiin
  tai kontrolli menetti fokusta"*). Infinite rajasi sen erikseen: korjataan
  hahmocustomoinnin yhteydessä, ei tässä.
