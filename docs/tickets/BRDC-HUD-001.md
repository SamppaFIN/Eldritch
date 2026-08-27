# BRDC-HUD-001 — HUD: taso, XP, matka, GPS-tarkkuus

| | |
|---|---|
| **Vaihe** | 1 — Kartta ja ley-line |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-TRAIL-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 95 % |

## 🔴 RED

Pelaaja ei näe mitään numeroita. Erityisesti: kun GPS on huono ja pisteitä hylätään,
mikään ei kerro miksi jälki ei etene. v2:ssa tämä johti siihen, että käyttäjä luuli
pelin olevan rikki.

## 🟢 GREEN

- [x] Lasipaneeli (`--glass-bg`) kartan päällä, Orbitron numeroille
- [x] **Consciousness Level** + XP-palkki
- [x] Matka nykyisellä runilla (m / km)
- [x] **GPS-tarkkuus metreinä ja sen tila**: hyvä / heikko / hylätään
- [x] Kun pisteitä hylätään, HUD kertoo syyn ihmiskielellä
      ("Signal too weak — the Ley-line cannot form")
- [x] Jokainen kosketuskohde vähintään `--touch-min` (44 px)
- [x] HUD vie alle 30 % ruudun korkeudesta 360 px viewportilla — mitattu
- [x] Kolme yläreunan safe-area-inset huomioitu (notch)

## Toteutus

**Tasokäyrä katkaistava** (`files/CLAUDE.md` §Domain model): v2:ssa taulukko loppui
tasoon 20, mutta koodi antoi nousta tasolle **118** ja korruptoi tallennuksen.
v3: joko katkaisu tasoon 20 tai kaava joka jatkuu määritellysti — ei molempien puuttumista.

```
1 Dormant · 5 Awakening · 10 Aware · 15 Enlightened · 20 Transcendent
```

**GPS-tila on tärkein elementti Vaiheessa 1.** Hyväksymisportti on ulkona kävely, ja
ilman tarkkuusnäyttöä ei voi erottaa rikkinäistä koodia huonosta satelliittipeitosta.

| Tarkkuus | Tila | Väri |
|---|---|---|
| ≤ 15 m | hyvä | `--awareness-green` |
| 16–50 m | heikko | `--sacred-gold` |
| > 50 m | hylätään | `--mystic-cyan` himmeänä |

## Testit

- [~] XP-palkki on `role="progressbar"` oikeilla ARIA-arvoilla (testattu). **Sen
      liikkuminen** näkyy vasta kun valtaus tuottaa XP:tä — Vaihe 2
- [x] Tarkkuus 80 → "Signal too weak — the Ley-line cannot form", `data-quality="rejected"`
- [x] Taso ei ylitä katkaisurajaa — 23 yksikkötestiä `rules/level.test.ts`:ssä
- [x] 360 px viewport ajetaan ensin
- [x] Näppäimistönavigointi: jokainen painike saa `:focus-visible`-kehyksen

> **Lisäksi:** signaalirivi kertoo tilan **sanoin**, ei vain värillä — pelaaja on ulkona
> päivänvalossa käsivarren mitan päässä ruudusta. Piste ja väri ovat toinen kanava,
> eivät ainoa. XP-palkki on `role="progressbar"` oikeine arvoineen.

## Ei kuulu tähän tikettiin

Aluetilastot (BRDC-HUD-002). Akkuvaroitus (Vaihe 5). Chat, tapahtumafeed (Vaihe 3).

## Lähde

`PROMPTS.md` Vaihe 1 kohta 7 · `files/CLAUDE.md` §Domain model · `ANALYSIS.md` §6.3
