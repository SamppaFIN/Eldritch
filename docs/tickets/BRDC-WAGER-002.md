# BRDC-WAGER-002 — Jaettu maa ratkeaa kävelemällä, eikä sitä sanottu siellä missä jakoja syntyy

| | |
|---|---|
| **Alue** | `features/wager/WagerDialog.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | XS |
| **Status** | `done` — 2026-09-15 (v0.5.99) |
| **Riippuvuudet** | `BRDC-WAGER-JSON-002/-005/-006`, ja se vastaa `BRDC-CLAIM-015`:n omaan kysymykseen |
| **Lähde** | Infinite 2026-09-15: *"Nyt tuolla on paljon jaettuja heksoja."* |

## 🔴 RED

Wager hyväksytään, ja dialogi sanoo:

> *"Sampoamaja's ground is on your map — 31 cells, and 12 you now share."*

Ja siihen se jättää pelaajan. Kaksitoista jaettua heksaa, eikä riviäkään siitä mitä
niille voi tehdä.

**Sääntö on kuitenkin olemassa ja se toimii.** `capture.ts:154`, haarassa jossa oma solu
kävellään uutena päivänä:

```ts
// A fresh day's walk over contested ground reclaims the whole yield (BRDC-WAGER-JSON-002).
delete reinforced.shared;
```

Eli jako katoaa kävelemällä. `OwnershipNote` kertoo sen solukortilla — *"Walk it on a new
day to take it all back"* — mutta solukortti näkee **yhden** heksan kerrallaan. Se hetki
jolloin pelaaja kohtaa koko luvun, kaikki kaksitoista yhtä aikaa, on juuri tämä dialogi,
ja se vaikeni.

Näin oire *"jaettuja heksoja on liikaa"* syntyy ilman että yksikään sääntö on rikki:
peli ei kertonut että ne ovat väliaikaisia.

## 🟢 GREEN

- [x] Rivi sanoo mitä tehdä: *"— walk one on a new day and it is wholly yours again."*
      Sama lupaus kuin `OwnershipNote`illa, samoin sanoin, sillä hetkellä kun luku on
      suurimmillaan
- [x] `WagerDialog`in docstring sanoi *"There is no server until Phase 3"* — vaiheet
      numeroitiin uudelleen 2026-08-31 (`claude.md` §9), ja Supabase on **Vaihe 5**.
      Korjattu
- [x] Portti: `lint:lines`, `tsc -b`, 1371 vitest, `pnpm build`, e2e `wager.spec.ts`

## Todennus

`wager.spec.ts`in kolme väittämää kohdistuvat `/ground is on your map/i`:hin, joka ei
muuttunut — lisäys tulee lauseen loppuun.

## Miksi tämä on isompi kuin yksi lause

`BRDC-CLAIM-015` pyytää päivittäistä omistuslaskentaa, koska jaettuja heksoja on liikaa.
Se tiketti listasi kolme mahdollista syytä ja sanoi että ne pitää mitata ennen kuin
rakennetaan. Mitattu: **sääntö laukeaa, teksti puuttui.**

Se ei tee `CLAIM-015`:stä turhaa — Infinite voi yhä haluta käyntiperusteisen omistuksen
omana mekaniikkanaan — mutta se poistaa sen *kiireen*, ja kannattaa katsoa kentällä
uudestaan ennen kuin käyntilaskuri ja arbitraatio rakennetaan.

## Ei tässä

- Sääntömuutokset jaettuun maahan. Tämä on yksi lause, ei mekaniikka
- Se, näkyykö jaettu heksa kartalla omalla merkillään — `BRDC-HEX-003`:n aluetta
