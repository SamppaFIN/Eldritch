# BRDC-HUD-002 — HUD: omistetut solut ja vahvin alue

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-CLAIM-006, BRDC-HUD-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Pelaaja ei näe montako solua omistaa, kuinka suuri alue on, eikä mitä lenkin
sulkeutuminen juuri teki. Ilman palautetta mekaniikka jää näkymättömäksi.

## 🟢 GREEN

- [ ] HUD näyttää: **omistetut solut**, pinta-ala (m² / km²), vahvin alue
- [ ] Lenkin sulkeutuessa näytetään tulos lore-sävyisenä:
      *"12 cells awakened · 3 corrupted · 1 reinforced"*
- [ ] Vapautuvista soluista tulee tapahtuma **"The Void reclaims"**
- [ ] Solut, joiden rappeutuminen alkaa alle 48 h päästä, näytetään varoituksena
- [ ] Käyttöliittymän sanasto on lore-sanastoa, ei koodisanastoa
- [ ] 360 px viewportilla HUD mahtuu ilman vieritystä

## Toteutus

**Sanasto** (`files/CLAUDE.md` §Domain model) — käytä käyttöliittymässä johdonmukaisesti:

| Koodi | Käyttöliittymä |
|---|---|
| trail | Ley-line |
| claim / loop closure | Awakening the Ground |
| steal | Corruption |
| cell | Warded Cell |
| level | Consciousness Level |
| leaderboard | Codex of Dominion |

**Rappeutumisvaroitus on tärkeämpi kuin miltä kuulostaa.** Pelin ydinsilmukka on
"kävele säännöllisesti samoja reittejä". Jos pelaaja ei näe alueensa hiipuvan, hän
huomaa menetyksen vasta kun se on tapahtunut — eikä palaa.

Pinta-ala: solujen määrä × 2 150 m². Alle 1 km² näytetään neliömetreinä, sen yli
kahden desimaalin km²:nä.

## Testit

- [ ] Solumäärä päivittyy lenkin sulkeuduttua
- [ ] Tulosviesti näyttää oikeat luvut kaikille neljälle lopputulostyypille
- [ ] Kellon kelaus (+19 vrk) → varoitus ilmestyy ennen vapautumista
- [ ] Kellon kelaus (+21 vrk) → "The Void reclaims" -tapahtuma
- [ ] 360 px viewport ajetaan ensin

## Ei kuulu tähän tikettiin

Codex of Dominion -tulostaulu (Vaihe 3, vaatii moninpelin). Achievementit (Vaihe 6).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 7 · `files/CLAUDE.md` §Domain model · `MASTERPLAN.md` §2.1
