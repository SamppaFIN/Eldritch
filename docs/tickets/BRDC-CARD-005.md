# BRDC-CARD-005 — CODEX mallin mukaan

| | |
|---|---|
| **Alue** | `features/codex/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M |
| **Status** | `done` — toiminnalliset kohdat 2026-09-16; ulkoasu siirtyi käytettävyyskierrokselle (UX-004…006) |
| **Riippuvuudet** | — |
| **Lähde** | `Eldritch-Sigil.html` §06 — 07 · CODEX OF DOMINION · Infinite 2026-09-16 (ks. `BRDC-CARD-001`) |

## 🔴 RED

`BRDC-CODEX-003` (v0.5.93) toi välin seuraavaan, **mallia ei rakennettu**. Mallin oma selitys:

> *"Civilization's demographics screen, read on a phone. 'Not listed' is replaced by your own number,
> your rank out of eight, and a bar that puts you against the average and the leader — so the screen
> tells you where you stand before you tap anything."*

## Auditoi nykyinen Codex mallia vasten — tehty 2026-09-16

Mallin oma HTML (`Eldritch-Sigil.html`, "07 · CODEX OF DOMINION") luettu suoraan
lähteestä ja verrattu `CodexPanel`in nykyiseen tuotokseen: tämä ruutu osoittautui
lähimmäksi mallia kaikista viidestä CARD-tiketistä — kaksi kolmesta GREEN-kohdasta oli
jo tehty ennen tätä kierrosta.

| Mallin osa | Peli tänään | Ero |
|---|---|---|
| Otsake: "8 realms measured · you are 7th overall" | "N realms measured. Tap a row…" — ei kokonaissijaa | 🔶 **korjattu tässä kierroksessa** |
| Rivi: oma luku + sija näkyvissä aina | `codex__mine` (luku) + `codex__place` (sija+väli) — jo aina näkyvissä kun realmi on listalla | ✅ **jo tehty** |
| Palkki: huonoin → paras, keskiarvo merkittynä, oma sijainti täytettynä | Vain kolme tekstilukua (`Best`/`Average`/`Worst`), ei visuaalista palkkia | 🔶 **korjattu tässä kierroksessa** |
| "Not listed" korvattu omalla tilalla, ei rivi riviltä | `EmptyState` kerran koko taulun yläpuolella, ei seitsemän kertaa | ✅ **jo tehty** — `BRDC-CODEX-00x`in oma kommentti mainitsee tämän nimeltä |

## 🟢 GREEN

- [x] **Auditoi nykyinen Codex mallia vasten** — taulukko yllä
- [x] **Otsake: montako realmia mitattu, oma kokonaissija.** Uusi `overallStanding(metrics, me)`
      (`figures.ts`, puhdas, testattu): jokaisen mitatun mittarin oman sijan keskiarvo,
      pyöristettynä lähimpään sijaan — `null` jos realmi ei ole yhdelläkään mittarilla,
      sama "ei mitään keskiarvoitavaa" -tila jonka `listed`-tarkistus jo tunnisti
- [x] **Jokaisella rivillä oma luku, sija ja väli** — oli jo tehty (`codex__mine`/`codex__place`)
- [x] **Palkki huonoin/keskiarvo/paras vasten.** Uusi `barPct(value, worst, best)`
      (`figures.ts`, puhdas, testattu): lineaarinen sijainti 0–100 välillä, koska jokainen
      Codexin mittari on "enemmän on parempi" — ei uutta suuntalogiikkaa. Keskiarvo
      merkitty ohuena tikkinä täytön päällä, ei toisena täyttönä samalla kanavalla kuin
      oma luku
- [x] Testit: `figures.test.ts` (8 uutta — `barPct`in reunat ja lineaarisuus,
      `overallStanding`in keskiarvo, puuttuva mittari, ei-listattu). Portti: 1574 testiä,
      `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät
- [ ] 360 px -kuvakaappaus mallin rinnalla — ei kuvakaappaustyökalua tässä istunnossa

## Ei tässä

- Ei mitään — tämä on sarjan ainoa CARD-tiketti jonka kaikki toiminnalliset GREEN-kohdat
  saatiin tehtyä

## Siivous 2026-10-13

Jäljelle jääneet kohdat olivat visuaalisia uudelleenjärjestelyjä ja kuvakaappausvertailu vanhaan malliin. Ulkoasu on sittemmin tehty uudelleen käytettävyyskierroksella ([BRDC-UX-004](BRDC-UX-004.md) Keepin välilehdet, [BRDC-UX-005](BRDC-UX-005.md) heksakortti, [BRDC-UX-006](BRDC-UX-006.md) Lore) ja Sigil-designin mukaan, joten vertailu vanhaan malliin ei enää mittaa mitään.
