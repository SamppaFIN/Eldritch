# BRDC-CLAIM-005 — `MockRepository`: closeLoop, getCells, aikakelaus

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-004, BRDC-MOCK-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Sääntöfunktiot ovat olemassa ja testattuja, mutta mikään ei kutsu niitä. Peli ei
vielä tee mitään, kun lenkki sulkeutuu.

## 🟢 GREEN

- [x] `MockRepository.closeLoop(runId)` toteuttaa ketjun:
      `loopDetection` → `polygonToCells` → `capture` → tallennus
- [x] `MockRepository.getCells(bbox)` ajaa `applyDecay`n **lukuhetkellä** ja
      poistaa vapautuneet solut
- [x] Tulos tallentuu IndexedDB:hen ja säilyy reloadin yli
- [x] `ClaimResult` kertoo mitä tapahtui: vallattu / vahvistettu / vahingoitettu /
      omistaja vaihtui — solukohtaisesti
- [x] **Dev-työkalu: "kelaa aikaa +1 vrk" -painike**
- [x] Sääntölogiikkaa ei ole kopioitu tänne — vain kutsuja

## Toteutus

```ts
async closeLoop(runId: RunId): Promise<ClaimResult> {
  const points = await this.getTrailPoints(runId);
  const result = detectLoop(points);           // BRDC-CLAIM-001
  if (!result) return { closed: false };

  const cells = loopToCells(result.loop);      // BRDC-CLAIM-002
  const now = this.clock.now();                // kelattava kello
  const outcomes = cells.map(h3 =>
    resolveCapture(this.cellState(h3), this.profile, now)  // BRDC-CLAIM-003
  );
  await this.persist(outcomes);
  return { closed: true, outcomes };
}
```

**Kelattava kello.** `MockRepository` ei kutsu `Date.now()`ta suoraan vaan käyttää
`clock`-oliota, jonka offsetia voi siirtää. Dev-painike lisää siihen 24 h.

> Tämä painike on Vaiheen 2 hyväksymisportin edellytys. Ilman sitä rappeutumisen
> todentaminen vaatisi 20 vuorokauden odottamista.

Painike on **vain dev-buildissa** (`import.meta.env.DEV`) — se ei saa päätyä
Pages-deployhin. Kelattu offset tallennetaan, jotta reload ei nollaa sitä kesken testin.

**`ClaimResult` on solukohtainen**, koska HUD ja tapahtumafeed näyttävät sen
("12 cells awakened · 3 corrupted · 1 reinforced").

## Testit

- [x] `square.json`-fixture → `closed: true`, soluja > 0, kaikki `claimed`
- [x] Sama lenkki uudelleen samana päivänä → kaikki `reinforced`, strength +25
- [x] Sama lenkki kellon kelauksen jälkeen (+1 vrk) → `reinforced` streakilla, +50
- [x] Naapurin solujen päälle kävely → `damaged`, omistaja ei vaihdu
- [x] Kolme lenkkiä samojen solujen yli → omistaja vaihtuu jossain vaiheessa
- [x] Kellon kelaus +20 vrk → heikot solut vapautuvat `getCells`issä
- [x] `open-line.json` → `closed: false`, mitään ei tallennu
- [x] Reload säilyttää solut ja kellon offsetin

> **Kaksi peräkkäistä bugia, jotka molemmat hukkasivat valmiin lenkin hiljaa:**
>
> 1. Ensimmäinen versio palasi heti jos sulkeutumisyritys oli jo käynnissä. Jos törmäys
>    osui kävelyn **viimeiseen erään**, `trailVersion` ei muuttunut enää koskaan eikä
>    lenkkiä vallattu ikinä. Pelaaja kiertää korttelin, mitään ei tapahdu, eikä tule
>    tapahtumaan.
> 2. Toinen versio perui lennossa olevan yrityksen siivouksessa. Mutta `closeLoop` on jo
>    **kirjoittanut** siinä vaiheessa kun se palaa — peruminen ei kumonnut valtausta,
>    se hylkäsi vain tiedon siitä. Maa oli otettu, XP maksettu, ja HUD näytti nollaa.
>
> Löytyi ajamalla sama kävely neljästi: 2/4 onnistui. Yritykset sarjallistetaan nyt,
> niitä ei pudoteta, ja vain oikea unmount estää tuloksen pääsyn ruudulle. Testi
> `claim.spec.ts` vertaa **IndexedDB:n sisältöä HUDin lukemaan** — koko bugi oli näiden
> kahden erimielisyys.
>
> **Aikakelaus** on `useGameClock`issa, ei repositoryssa: rajapinta ottaa `now`:n
> parametrina, joten kello kuuluu sovellukseen. `T` kelaa vuorokauden, `Shift+T` palaa.
> Siirtymä tallennetaan, jottei reload herätä juuri kuolleeksi katsottua aluetta.

## Ei kuulu tähän tikettiin

Renderöinti (BRDC-CLAIM-006). `SupabaseRepository` ja golden fixture -testit (Vaihe 3).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 5 · `MASTERPLAN.md` §3.2 · `files/CLAUDE.md` §Data layer
