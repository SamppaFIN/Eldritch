# BRDC-CLAIM-005 — `MockRepository`: closeLoop, getCells, aikakelaus

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-004, BRDC-MOCK-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |

## 🔴 RED

Sääntöfunktiot ovat olemassa ja testattuja, mutta mikään ei kutsu niitä. Peli ei
vielä tee mitään, kun lenkki sulkeutuu.

## 🟢 GREEN

- [ ] `MockRepository.closeLoop(runId)` toteuttaa ketjun:
      `loopDetection` → `polygonToCells` → `capture` → tallennus
- [ ] `MockRepository.getCells(bbox)` ajaa `applyDecay`n **lukuhetkellä** ja
      poistaa vapautuneet solut
- [ ] Tulos tallentuu IndexedDB:hen ja säilyy reloadin yli
- [ ] `ClaimResult` kertoo mitä tapahtui: vallattu / vahvistettu / vahingoitettu /
      omistaja vaihtui — solukohtaisesti
- [ ] **Dev-työkalu: "kelaa aikaa +1 vrk" -painike**
- [ ] Sääntölogiikkaa ei ole kopioitu tänne — vain kutsuja

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

- [ ] `square.json`-fixture → `closed: true`, soluja > 0, kaikki `claimed`
- [ ] Sama lenkki uudelleen samana päivänä → kaikki `reinforced`, strength +25
- [ ] Sama lenkki kellon kelauksen jälkeen (+1 vrk) → `reinforced` streakilla, +50
- [ ] Naapurin solujen päälle kävely → `damaged`, omistaja ei vaihdu
- [ ] Kolme lenkkiä samojen solujen yli → omistaja vaihtuu jossain vaiheessa
- [ ] Kellon kelaus +20 vrk → heikot solut vapautuvat `getCells`issä
- [ ] `open-line.json` → `closed: false`, mitään ei tallennu
- [ ] Reload säilyttää solut ja kellon offsetin

## Ei kuulu tähän tikettiin

Renderöinti (BRDC-CLAIM-006). `SupabaseRepository` ja golden fixture -testit (Vaihe 3).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 5 · `MASTERPLAN.md` §3.2 · `files/CLAUDE.md` §Data layer
