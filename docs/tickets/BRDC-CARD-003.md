# BRDC-CARD-003 — RESEARCH mallin mukaan

| | |
|---|---|
| **Alue** | `features/territory/ResearchPanel.tsx`, `rules/tech.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — aikakausipalkki ja punainen puute-huomautus tehty; riittien yhdistäminen auki |
| **Riippuvuudet** | — |
| **Lähde** | `Eldritch-Sigil.html` §06 — 05 · RESEARCH · Infinite 2026-09-16 (ks. `BRDC-CARD-001`) |

## 🔴 RED

`BRDC-TECH-003` (v0.5.90) poisti jargonin, **mallia ei rakennettu**. Mallin oma selitys:

> *"Both trees live here — Technology and Rites — under one era bar that says how far Prehistory runs.
> Every card answers the same four questions in the same order: what it is, what it costs, what it
> changes, what it opens. Cards you cannot afford name the missing thing in red instead of greying
> out silently."*

## Auditoi nykyinen tutkimusnäkymä mallia vasten — tehty 2026-09-16

Mallin oma HTML (`Eldritch-Sigil.html`, "05 · RESEARCH") luettu suoraan lähteestä ja
verrattu `ResearchPanel`in nykyiseen tuotokseen:

| Mallin osa | Peli tänään | Ero |
|---|---|---|
| Otsake + viisauslaskuri + ✕ | `hearth-panel__research-head`: "Research · Era · N/13 known", ei erillistä sirua eikä ✕:tä | Rakenne-ero: tämä on Hearthin alipaneeli, ei oma ikkuna — sama syy kuin `BRDC-KEEP-007`in Research-välilehden poisto |
| TECHNOLOGY · 2/13 / RITES · 0/9 -välilehdet | Vain teknologia täällä; riitit ovat oma, per-solu-komponenttinsa (`SpellPanel`) | ❌ **ei yhdistetä** — ks. alla |
| Aikakausipalkki "PREHISTORY · NEXT ERA AT 13" | Ei palkkia, vain tekstirivi | 🔶 **korjattu tässä kierroksessa** — mallin oma "13" on koko puun koko käytettynä paikkamerkkinä, ei todellinen kynnys tässä pelissä (kolme aikakautta, 3/4/6 teknologiaa) |
| Kortti: nimi+tarina, hinta, vaikutus korostettuna, UNLOCKS-sirut | `TechRow`: nimi+odotus, kuvaus, tuotto, "Unlocks X" -teksti, hinta-nappi | Sisältö vastaa, ulkoasu (kortti vs. rivi) ei — visuaalinen, ei toteutettu tässä kierroksessa |
| Puuttuva asia **punaisella**, ei harmaana | `shortNote(...)`-teksti oli jo olemassa (ei koskaan pelkkä harmaa nappi) mutta väritetty samalla `--text-dim`-harmaalla kuin kaikki muu | 🔶 **korjattu tässä kierroksessa** |

## 🟢 GREEN

- [x] **Auditoi nykyinen tutkimusnäkymä mallia vasten** — taulukko yllä
- [x] **Aikakausipalkki** (`rules/tech.ts`in uusi `eraProgress(researched)`, puhdas ja
      testattu): mittaa nykyisen aikakauden omia teknologioita vasten (`doneInEra`/
      `totalInEra`), ei koko puuta — mallin oma "13" on näytedatan paikkamerkki, ei tämän
      pelin todellinen kynnys (kolme aikakautta, 3/4/6 teknologiaa). `nextEraAt` on `null`
      viimeisessä aikakaudessa, koska sinne ei enää siirrytä
- [x] **Puuttuva resurssi nimetty punaisella** (`hearth-panel__research-missing`,
      `var(--danger)`): teksti oli jo olemassa (`shortNote`, ei koskaan hiljaa harmaa
      nappi), väri ei ollut — erotettu omaksi luokakseen niin että naapurissa oleva
      neutraali "~3 h" -ennuste ja "Locked"-teksti eivät väritys mukana punaistu
- [x] Testit: `tech.test.ts` (4 uutta `eraProgress`ille — nollasta, kesken aikakauden,
      aikakauden vaihtuessa, koko puu valmiina). Portti: 1567 testiä, `tsc -b`,
      `lint:lines`, tuotantobuild — kaikki vihreät
- [ ] Kortti-ulkoasu (laatikko rivin sijaan, hinta omana korostettuna laatikkonaan) —
      visuaalinen, ei toiminnallinen
- [ ] 360 px -kuvakaappaus mallin rinnalla — ei kuvakaappaustyökalua tässä istunnossa

## Ei tehdä — riittien yhdistäminen samaan näkymään

**Teknologia ja riitit eivät jaa yhtä listaa.** Ne eivät ole sama asia tässä pelissä:

- Teknologia on **tiedetty/ei-tiedetty** -tila koko realmille (`research.researched`)
- Riitti **castataan per solu** (`SpellPanel`, `via: 'home'`/`'own-cell'`/`'border-cell'`)
  ja kuudella riitillä on lisäksi oma **temppelin koulukunta** -porttinsa
  (`BRDC-TEMPLE-002`) — eri lukitusmalli kuin teknologialla
- `BRDC-KEEP-007`in oma kenttäraportti: kolmas välilehti (silloin Research Keepissä)
  kokeiltiin ja poistettiin koska sitä ei löydetty. Uuden RITES-välilehden lisääminen
  tähän kantaisi saman, jo mitatun riskin

Malli olettaa yhden puun jossa teknologia ja riitit ovat saman mekaniikan kaksi puolta.
Tässä pelissä ne eivät ole — sama päätös kuin `BRDC-CARD-001`in riittilistan tiivistys ja
`BRDC-CARD-002`in kolmas välilehti.

## Ei tässä

- Kortin visuaalinen uudelleenmuotoilu — jää auki, ei arvattu
