# BRDC-LANDS-001 — Maakirja: mitä omistat ja mikä niistä kaipaa sinua

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-CLAIM-009 (`getRevealed`), BRDC-HEX-001 (`ownedDays`), BRDC-BUILD-009 |
| **Status** | `done` — 2026-09-10 (v0.5.64) |
| **Valmius** | 100 % — portti vihreä, desktop `lands` 3/3, mobile-360 axe 8/8 |
| **Lähde** | Infinite 2026-09-10: *"Haluan myös sivun mikä näyttää kaikki omistetut maat ja niiden statukset. Ensimmäisenä listattuna tutkimattomat maat"* + tarkennus *"niiden resurssit, rakennukset ja kaikki tiedot jotenkin nätisti"* |

## 🔴 RED

**Kartta vastaa kysymykseen "missä olen". Se ei vastaa kysymykseen "mitä minulla on".**

Muutamankymmenen heksan jälkeen se lakkaa yrittämästäkin. Infinitellä on **340 solua**, ja
ainoa tapa tarkastaa ne oli vierittää karttaa ja napauttaa yksi kerrallaan. Kukaan ei tee
niin. Käytännössä se tarkoitti, ettei näihin kysymyksiin ollut vastausta lainkaan:

- Mitkä ovat tutkimatta? (Tutkiminen on ilmaista ja maksaa joka kerta, `BRDC-REVEAL-002`.)
- Mikä on katoamassa?
- Missä rakennukset ovat?
- Mikä maa tuottaa mitäkin?

## 🟢 GREEN

- [x] **`rules/holdings.ts`** — puhdas. `holdingOf(cell, revealed, home)` kokoaa yhden
      heksan tilan: maasto, resurssi, vahvuus, **tunnit katoamiseen**, käyntipäivät, Work,
      tutkittu, Hearth. Ei omaa kelloa: solut ovat jo `getOwnedCells`in projisoimia.
- [x] **Järjestys on moduulin koko mielipide, joten se on sanottu kerran ja testattu.**
      **Tutkimattomat ensin** — Infiniten pyyntö, ja se on myös ainoa asia listalla johon
      voi tarttua kävelemättä minnekään. Sitten lähinnä katoamista, koska se on toinen
      asia jolla on takaraja. Katoamaton maa vajoaa pohjalle; sillä menee hyvin.
- [x] **Hearth ja tuotu maa eivät saa lähtölaskentaa** vaan lukeman `safe`. Lähtölaskenta
      maalle jota ei voi menettää on valhe jossa on numero.
- [x] **Otsikko kertoo summan** ilman että listaa tarvitsee lukea: *"7 held · 7 unrevealed ·
      0 Works"*, ja *"N fading within a day"* kun sellaisia on.
- [x] **Rivi vie kartalle.** Koko rivi on kohde — kävelevän peukalon ei pidä etsiä linkkiä.
- [x] Otsikkopalkki on `sticky`: kolmesataa riviä menee sen alta ohi.
- [x] Sama arkki kuin Codexilla ja Historyllä, **ESC sulkee** (`useEscape`, BRDC-UI-003).
- [x] Reitti sisään: **☰ → Your lands**.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1123**) + `pnpm build` vihreä.
- [x] `holdings.test.ts` (10): lukee maan, Workin ja tutkinnan · **katoamaton maa ei saa
      lähtölaskentaa** (Hearth ja tuotu) · Hearth on merkitty · **tutkimattomat ensin
      olipa tila mikä tahansa** · sitten lähin katoaminen · katoamaton pohjalle ·
      tasapeli ratkeaa samoin joka kerta · annettuun listaan ei kosketa · summa laskee
      oikein · tyhjästä ei lasketa mitään.
- [x] e2e `lands.spec.ts` (3, desktop): seitsemän riviä ja niiden sisältö ·
      **tutkimattomat ensin ja Hearth ei koskaan katoamassa** · rivi vie heksaan ja ESC
      sulkee.
- [x] mobile-360 `standards.spec.ts` (axe, WCAG 2.2 AA) 8/8 sarja-ajossa. Rinnakkaisajossa
      CLS-testi heitti kerran; yksin ja sarjassa vihreä — kuormitusheitto, ei muutos.
- [ ] Kenttä: avaa 340 solun listalla ja katso että se on luettava. *(Infinite ajaa.)*

## Tiedossa oleva rosoisuus

Lista täyttyy noin **kolmessa sekunnissa** heti käynnistyksen jälkeen, koska
`getOwnedCells` jonottaa käynnistyspurskeen takana — `BRDC-ECON-009` poisti silmukan, ei
purskeetta. Siihen asti lukee *"Counting your ground…"*, mikä on rehellinen tila eikä tyhjä
ruutu. 340 solulla se on mitattava uudestaan.

## Ei tässä

- **Suodattimet ja lajittelun vaihto.** Yksi mielipide järjestyksestä on parempi kuin kuusi
  säädintä ennen kuin tiedetään mitä listalta oikeasti haetaan. Kenttätesti kertoo sen.
- **Ryhmittely provinsseittain.** `provinceCount` on olemassa, mutta se on Atlaksen kysymys
  (*missä he ovat*), ei maakirjan (*mitä minulla on*).
- **Bonusresurssit** — Infiniten kolmas pyyntö samassa viestissä. Oma tikettinsä: se on
  mekaniikkamuutos maastotauluun, ei näkymä.
- **Seikkailun ankkurointi** — sama viesti, eri vika. Ks. diagnoosi: kohtaukset ovat
  kovakoodattuja Pyynikin koordinaatteja.
