# BRDC-HEARTH-002 — Kotipesää ei voi menettää

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-HEARTH-001, BRDC-CLAIM-005 |
| **Status** | `done` — 2026-09-01 |
| **Valmius** | 100 % |

## 🔴 RED

`projectCell` rappeuttaa kotipesäsolua kuten mitä tahansa: kaksi viikkoa poissa ja
`runDecay` vapauttaa sen. Pelaaja voi kirjaimellisesti menettää sen paikan johon
suostui aloittamaan. HUD myös varoittaa "1 cell fades" osoittaen soluun jota ei voi
menettää.

## 🟢 GREEN

- [x] `projectCell(cell, now, loyalty, home?)` — `if (home && cell.h3 === home) return
      cell` heti `imported`-tarkistuksen yläpuolella. Ei vuoda, ei vapaudu, koskaan
- [x] `sweepDecay` ja `sweepAndPersist` välittävät `home`n; `MockRepository`n kolme
      kutsupaikkaa (`getCells`, `getOwnedCells`, `runDecay`) antavat `await getHome()`
- [x] `walkFlow.ts`: lenkki joka sivuaa kotipesää ei saa olla se joka poistaa sen
- [x] `resolveCapture(cell, attacker, now, defence, defenderHome?)` — "someone else's"
      -haarassa `remaining` pohjataan 1:een jos `cell.h3 === defenderHome`. Piiritettävä,
      ei vallattavissa. Ei elävää polkua vielä (`wager.ts`/`spoils.ts` eivät koske
      paikallisiin soluihin) — Vaihe 5:n oikea taistelu käyttää
- [x] HUD:n "fades"-laskuri ohittaa kotipesän (`useTerritory` `home`-parametri)

## Toteutus

Sama muoto kuin olemassa oleva `cell.imported`-vartija `projectCell`issä: yksi
aikainen paluu. Vain rappeutumispolku koskettaa `home`a — se on ainoa joka poistaa
soluja (`sweepAndPersist`). Yksittäiset `projectCell`-kutsut (`wardCell`, `buildStore`)
jäävät ennalleen: ne eivät poista mitään, ja invariantti "kotipesää ei vapauteta"
pitää silti.

`resolveCapture`n `defenderHome` on puhtaasti additiivinen — yksikään nykyinen
kutsupaikka ei anna sitä. Testi ajaa sen suoraan.

**Testikorjaus:** `aura.repo`, `spell.repo` ja `wager` mittasivat rappeutumista/
bulwarkia/vanhentunutta vientiä nimenomaan kotipesäsolulla, koska se oli kätevä
omistettu solu. Ne mittaavat nyt naapurisolua — kotipesä ei enää rappeudu, joten se ei
voi näyttää hidastusta eikä kadota viennistä.

## Testit

- [x] `projectCell`: kotipesä 60 pv koskematta seisoo yhä; naapuri samassa iässä on jo
      poissa; ilman `home`-argumenttia kotipesä rappeutuu kuten ennen (opt-in)
- [x] `sweepDecay`: `released` sisältää naapurin, ei kotipesää
- [x] `resolveCapture`: kilpailijan MAX-kotipesä 20 iskun jälkeen strength 1, omistaja
      ei vaihdu; ilman `defenderHome`ia sama solu vallataan normaalisti
- [x] 683 testiä vihreä, `tsc -b`, `lint:lines` — puhtaat

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `claude.md` §11 (siege-malli)
