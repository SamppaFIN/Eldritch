# BRDC-NATION-001 — Valtion nimi, lippu ja tilastot Keepin kärkeen

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CASTLE-002, BRDC-CHAR-001, BRDC-BANNER-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"ennen sitä valtion nimen ja lipun valinta ja tilastot, lääni ja asukasmäärä."*

Keep-paneeli (`HearthPanel`) avaa "Your Anchor Stone" ja kertoo Consciousness-tason,
mutta pelaajalla ei ole **valtiota** — ei nimeä, ei lippua, ei kansakunnan lukuja. Keep
on `claude.md` §10:n mukaan se julkinen kasvo jonka muut näkevät; kasvolla pitää olla nimi.

## 🟢 GREEN

- [ ] **Valtion identiteetti tallessa.** Yksi `es3:nation`-avain: `{ name, bannerId }`.
      Nimi ja lippu asetetaan Keepin identiteettiosiossa; tyhjä nimi näyttää arvotun
      oletuksen (`"The Nameless Reach"` tms.), ei estä pelaamista.
- [ ] **Identiteettiosio on paneelin ensimmäinen** — nimi, lippu (`BRDC-BANNER-001`:n
      esivalituista), ja sen alla tilastorivi.
- [ ] **Tilastot:** *lääni* = omistettujen res 6 -alueiden (`H3_RES_REGION`) määrä —
      montako erillistä maakuntaa hallitset. *Asukasmäärä* = johdettu luku
      omistetuista soluista ja rakennuksista (esim. `Σ cells * K + Σ housingOf(building)`);
      puhdas funktio `packages/core`ssa, ei tallennettu kenttä. Ei väestömekaniikkaa —
      luku on lipun vieressä oleva mittari, ei resurssi.
- [ ] Nimen muokkaus **ei nyi eikä menetä fokusta** — `BRDC-CHAR-001`:n kenttähavainto
      samasta ongelmasta koskee tätäkin. Kontrolloitu input, ei uudelleenrenderöi joka
      näppäimenpainalluksella koko paneelia.
- [ ] Nimi ja lippu näkyvät Wager-viestissä ja (Vaihe 5) `world.json`issa — kirjaa kenttä
      nyt, käytä myöhemmin.
- [ ] Puhtaat funktiot testattu: `provinceCount(owned)`, `population(owned, buildings)`.

## Ei tässä

- Oikea väestömekaniikka (kasvu, ruoka, tyytyväisyys). Luku on koriste, ei järjestelmä.
- Lipun grafiikka ja heksamerkki — `BRDC-BANNER-001`.
- Diplomatia, valtioiden väliset suhteet — `BRDC-CITY-001`.
