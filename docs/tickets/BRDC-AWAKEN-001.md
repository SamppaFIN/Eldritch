# BRDC-AWAKEN-001 — Lenkin sulkeutuminen on tapahtuma, ei tilamuutos

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-CLAIM-006 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Ulkotesti 2026-08-27 · Infiniten havainto |

## 🔴 RED

Kortteli kierretään, lenkki sulkeutuu — ja ruudulla välähtää mandala ja luku `+7`.
Kartta vain *näyttää erilaiselta* jälkeenpäin. Kukaan ei näe mitään tapahtuvan, eikä
mikään onnittele. Se on pelin ainoa palkintohetki ja se meni ohi huomaamatta.

## 🟢 GREEN

- [x] Sulkeutumisesta tulee **ilmoitus sanoilla**: mitä tapahtui ja paljonko sai
- [x] Otsikko skaalautuu saaliin mukaan (`The Ground Stirs` → `Dominion`)
- [x] Heksat **paljastuvat kartalla** kultaisena aaltona keskeltä ulospäin
- [x] Aalto on `awakening.ts`:ssä puhtaana funktiona ja testattu ilman selainta
- [x] Yhden solun valtaus ei tuota `NaN`-viivettä (näkymätön paljastus)
- [x] Paneeli on `<button>`: kosketus sulkee, Enter ja välilyönti myös, fokusrengas on
- [x] `prefers-reduced-motion`: paneeli näkyy ilman animaatiota — **ei** 0.01 ms, joka
      päättyisi `opacity: 0`:aan ja hävittäisi koko ilmoituksen

## Toteutus

Mandala on HTML, heksat karttatasoja. Kumpikin siellä missä maksaa vähiten.

Paljastus ajetaan **yhdellä luvulla**: jokainen solu kantaa `delay`-arvon 0–1 (osuutensa
matkasta valtauksen keskeltä sen kauimmaiseen reunaan), ja taso interpoloi
`progress − delay` -erotuksen yli. Ei per-solu-tilaa, ei lähteen koskemista kesken
animaation — juuri silloin MapLibre rasteroi uusia heksoja muutenkin.

## Ei tässä

- Saavutusten tallennus tai lista. Maa itse on rekisteri.
- Mitä valtaus *antaa* rakentamisen kannalta — `BRDC-TERRAIN-001` ja sen jälkeen.

## Jatko — 2026-08-31

Tämä tiketti teki **lenkin sulkeutumisesta** tapahtuman. Kehityssuunnitelman §4 tekee
saman **yksittäiselle heksalle**: sumu hälvenee, kortti kääntyy, harvinaisuus hehkuu →
`BRDC-REVEAL-001`.

Ne ovat sama mekanismi kahdessa mittakaavassa, ja REVEAL-001 rakentaa tämän päälle
eikä ohi. Yksi lisäys on pakollinen: **paljastuksia niputetaan**, koska korttelin
varrella niitä tulee kymmenen peräkkäin ja kymmenen korttia on este eikä palkinto.

> *"Mitä valtaus antaa rakentamisen kannalta — `BRDC-TERRAIN-001` ja sen jälkeen."*

Sen jälkeen on nyt kirjoitettu: `BRDC-ECON-001` → `BRDC-BUILD-001`.
