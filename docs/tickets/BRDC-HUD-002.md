# BRDC-HUD-002 — HUD: omistetut solut ja vahvin alue

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-CLAIM-006, BRDC-HUD-001 |
| **Status** | `done` — 2026-08-27 (1 kohta auki) |
| **Valmius** | 90 % |

## 🔴 RED

Pelaaja ei näe montako solua omistaa, kuinka suuri alue on, eikä mitä lenkin
sulkeutuminen juuri teki. Ilman palautetta mekaniikka jää näkymättömäksi.

## 🟢 GREEN

- [x] HUD näyttää: **omistetut solut**, pinta-ala (m² / km²), vahvin alue
- [x] Lenkin sulkeutuessa näytetään tulos lore-sävyisenä:
      *"12 cells awakened · 3 corrupted · 1 reinforced"*
- [x] Vapautuvista soluista tulee tapahtuma **"The Void reclaims"**
- [x] Rappeutumisvaroitus: **48 h ennen vapautumista** HUD sanoo montako solua hiipuu
      ja milloin ensimmäinen menee ("2 cells fade in 2 days — walk them")
- [x] Käyttöliittymän sanasto on lore-sanastoa, ei koodisanastoa
- [x] 360 px viewportilla HUD mahtuu ilman vieritystä

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

Pinta-ala: **mitattu `h3.cellArea`lla**, ei kerrottu nimellisarvolla — res-11-solu on
Tampereen leveydellä ~1 622 m², ei 2 150 m².

## Testit

- [x] Solumäärä päivittyy lenkin sulkeuduttua
- [~] Tulosviesti testattu `awakened`-tapaukselle e2e:ssä. Muut kolme yksikkötesteissä
- [x] Kellon kelaus +10 vrk → varoitus ilmestyy (e2e `decay.spec.ts`)
- [x] Kellon kelaus +16 vrk → solut vapautuvat, HUD putoaa nollaan (e2e)
- [x] 360 px viewport ajetaan ensin

> **HUD kasvoi yli oman sääntönsä.** Aluetilastojen lisääminen vei sen 30,5 %:iin
> ruudun korkeudesta — juuri yli rajan jonka asetin itse. Kaksi korjausta:
>
> 1. Signaali ja `Withdraw` jakavat rivin. 238 px → 206 px.
> 2. Tilastot ovat **yksi ruudukko**, kaksi saraketta puhelimessa ja neljä kun leveyttä
>    on. Kahtena erillisenä rivinä ne maksoivat kartalle kymmenyksen ruudusta pelkän
>    merkkauksen takia.
>
> **HUDin tekstitiheys on kiinteä**, ei `clamp()`-skaalattu. Skaala kasvaa näkymän
> mukana, mikä on oikein leipätekstille ja väärin mittaripaneelille: leveällä ja
> matalalla ikkunalla se paisutti HUDia. Lopputulos 26 % molemmilla näkymillä.

## Ei kuulu tähän tikettiin

Codex of Dominion -tulostaulu (Vaihe 3, vaatii moninpelin). Achievementit (Vaihe 6).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 7 · `files/CLAUDE.md` §Domain model · `MASTERPLAN.md` §2.1
