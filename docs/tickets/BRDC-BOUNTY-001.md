# BRDC-BOUNTY-001 — Bonusresurssit: mitä juuri tällä heksalla on

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001 (`TERRAIN_TABLE`), BRDC-CLAIM-009 (`getRevealed`), BRDC-LANDS-001 (näkymä) |
| **Status** | `done` — 2026-09-10 (v0.5.65) |
| **Valmius** | 100 % — portti vihreä, desktop `lands` 5/5, `step-claim` + `opening` 14/14 |
| **Lähde** | Infinite 2026-09-10: *"lisätään maalle mahdollisuus, että se voi olla bonusresurssi, niinkun civilisaatio vitosessa esim."* |

## 🔴 RED

**Kartta oli tehty seitsemästä laatasta, eikä yksikään heksa ollut minkään arvoinen omana itsenään.**

Maasto kertoi *minkälaista* maata heksa on. Kaksi metsää olivat identtiset, kaksi vuorta
olivat identtiset, eikä missään ollut syytä kävellä *tuonne* eikä *tänne*. Ja pahinta:
**plain-maa tuottaa nolla** (`TERRAIN_TABLE.plain.resource === null`), ja plain on noin
kaksi kolmasosaa kartasta. Suurin osa maasta oli keskenään vaihdettavaa tyhjää.

## 🟢 GREEN

- [x] **`rules/bounty.ts`** — yhdeksän löytöä: Wheat, Herd, Deer, Furs, Gems, Marble,
      Fish, Amber, Spices. Taulukko, kuten `BUILDINGS` ja `TECHS`.
- [x] **Deterministinen indeksistä**, kuten `terrainOf` ja `revealOf`. Ei `Math.random()`:
      kaksi pelaajaa samalla kadulla löytävät saman peuran, sivun lataus ei arvo uudestaan,
      ja Vaiheen 5 golden fixtures vaativat että SQL ja TypeScript ovat samaa mieltä.
- [x] **Sidottu omaan maastoonsa.** Kalat vedessä, jalokivet vuorilla, vehnä tasangolla.
      Bonus joka voisi osua minne tahansa lukisi koristeena; omaan maastoonsa kuuluva
      lukee maantieteenä.
- [x] **Löydetty, ei annettu.** Tuotto alkaa vasta kun heksa on **tutkittu**. Tämä on
      mekaniikka eikä tekninen yksityiskohta: paljastaminen oli kertaluonteinen palkkio,
      ja nyt se on tapa saada selville mitä oma maa on arvoltaan. `BRDC-LANDS-001`in
      "tutkimattomat ensin" -järjestys sai tästä oikean kiireen.
- [x] **Yksi heksa kahdeksasta** (`BOUNTY_SHARE = 0.125`). Kaksi rullausta kuten
      `terrainOf`issa: ensin onko mitään, sitten mikä — jotta osuutta voi säätää
      siirtämättä joka heksaa toiseen bonukseen.
- [x] **Mitoitus `TRICKLE_PER_HOUR`ia (2) vasten:** bonus suunnilleen tuplaa sen mitä
      heksa maksaa, jalokivet kolminkertaistavat. Tarpeeksi muuttamaan minne kannattaa
      kävellä, ei tarpeeksi tekemään yhdestä onnekkaasta heksasta tapaa arvokkaampaa.
- [x] **Plain sai syyn olla olemassa** — Wheat, Herd ja Spices osuvat sinne.
- [x] Näkyy **ruutukortissa** (löytö kultaisena, `Deer · +2 food / h`) ja **maakirjassa**
      omalla merkillään. Tutkimaton heksa sanoo *"Reveal this ground to see what is on it."*
- [x] Kuivuus koskee bonusta kuten kaikkea muuta: 48 h kävelemättä ja se ei maksa mitään.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1138**) + `pnpm build` vihreä.
- [x] `bounty.test.ts` (14) ~7500 todellisen solun otoksella: deterministinen 500 kutsun
      yli · **ei koskaan väärällä maastolla** · osuu noin joka kahdeksanteen · useampi
      laji kuin kolme · lukee tallennetun maaston hashin sijaan · **maksaa nollaa ennen
      tutkimista** · maksaa tutkimisen jälkeen · **kuivunut heksa ei maksa** · summautuu
      soluittain · kokonaisluvut · ja *"leaves no kind of ground unable to carry anything"*.
- [x] e2e `lands.spec.ts` +2: 127 solun paljastetulla alueella löytöjä on **enemmän kuin
      kolme ja vähemmän kuin kolmasosa** · tuore valtakunta ei paljasta yhtäkään.
- [x] Desktop `lands` 5/5, `step-claim` + `opening` 14/14.
- [ ] Kenttä: kävele, paljasta, katso löytyykö mitään. *(Infinite ajaa.)*

## Vika jonka testi nappasi kirjoittaessa

Ensimmäisessä taulukossa **Market-maalle ei voinut osua mitään** — yksikään rivi ei
nimennyt sitä. Huomasin sen ajamalla peliä: koko Hearth-rengas oli Marketia eikä yhtäkään
löytöä tullut. Se ei olisi ollut suunnittelu vaan hiljainen poissulkeminen: pelaaja jonka
naapurusto on kauppapaikkaa ei olisi löytänyt koskaan mitään.

Korjaus oli Spices, mutta oikea korjaus oli **invariantti**: *"leaves no kind of ground
unable to carry anything"* käy joka maastolajin läpi. Sama virhe ei voi palata hiljaa.

## Ei tässä

- **Bonuksen ikoni kartalle.** `cells-flag` ja `work-icons` ovat jo symbolitasoja ja tämä
  kuuluisi niiden joukkoon — mutta `BRDC-HEX-003` omistaa heksatasojen siivouksen, ja
  tämän lisääminen ennen sitä olisi neljäs taso ilman omistajaa.
- **Ylellisyys- ja strategiset resurssit erikseen** (Civ V:n kolmijako). Nämä ovat
  bonusresursseja: ne parantavat heksaa. Kaupankäynti ja monopolit ovat oma pelinsä.
- **Bonus rakennuksen ehtona** ("Kalastamo vaatii kalaa"). Houkuttava ja se on
  `BUILDINGS.needsPlace`in muotoinen laajennus — mutta se sitoisi rakentamisen onneen,
  ja se on tasapainokysymys jota ei kannata päättää ennen kenttätestiä.
