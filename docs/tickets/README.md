# 🎫 Toteutustiketit — Eldritch Sanctuary v3

Lähde: `files/MASTERPLAN.md` · `files/CLAUDE.md` · `files/EXTRACTION.md` · `files/PROMPTS.md`
Luotu: 2026-08-26

**Tämä on tikettien totuuden lähde.** `claude.md` (repon juuri) on projektin
työskentelysääntöjen totuuden lähde. Ne on yhdistetty 2026-08-26 — ristiriitoja ei ole,
ja jos sellainen syntyy, se korjataan heti eikä kirjata muistiin.

---

## Rajaus: ensin GitHub-hostattava versio

Vaiheet **0–2** tuottavat pelattavan pelin, joka toimii **staattisena sivuna GitHub
Pagesissa ilman backendia**. Ei Supabasea, ei tilejä, ei verkkoa. Kaikki tila selaimessa
(IndexedDB + localStorage).

> **Vaiheen 2 hyväksymisportti on projektin tärkein hetki:**
> kävele korttelin ympäri → alue täyttyy. Kävele sama reitti huomenna → alue vahvistuu.
> Kelaa aikaa 20 vrk → alue vapautuu. **Peli on olemassa.**

Vaiheet 3–6 (Supabase, moninpeli, Wager, APK, lore) on listattu alla otsikkotasolla.
Niitä **ei kirjoiteta auki ennen kuin Vaihe 2 on läpi** — se on `files/CLAUDE.md`:n
sääntö 6 ja MASTERPLANin §4.

---

## Tiketit

### ⏸️ Jäissä

| ID | Nimi | Effort | Riippuvuudet | Huom |
|---|---|:---:|---|---|
| [BRDC-SEC-000](BRDC-SEC-000.md) | Vuotaneiden avainten rotaatio | S | — | ⏸️ **siirretty Vaiheeseen 3** — Vaiheet 0–2 eivät käytä yhtään avainta |

### 🧱 Vaihe 0 — Perustus (GitHub Pages pystyyn)

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-SETUP-001](BRDC-SETUP-001.md) | Monorepo, pnpm workspaces, TS strict | M | — |
| [BRDC-SETUP-002](BRDC-SETUP-002.md) | Design-tokenit ja fontit — yksi tiedosto | M | SETUP-001 |
| [BRDC-SETUP-003](BRDC-SETUP-003.md) | `GameRepository`-rajapinta ja tyypit | S | SETUP-001 |
| [BRDC-SETUP-004](BRDC-SETUP-004.md) | Aloitusnäkymä — "Begin the Awakening" | S | SETUP-002 |
| [BRDC-SETUP-005](BRDC-SETUP-005.md) | GitHub Pages -deploy (CI) | S | SETUP-004 |
| [BRDC-PERSIST-001](BRDC-PERSIST-001.md) | `es3:*`-nimiavaruus ja `SAVE_VERSION` | S | SETUP-003 |

**Portti V0:** ✅ **läpi** — https://samppafin.github.io/Eldritch/

### 🗺️ Vaihe 1 — Kartta ja ley-line

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-GEO-001](BRDC-GEO-001.md) | Geometriaydin: haversine, nopeus, suodatus | M | SETUP-001 |
| [BRDC-SIM-001](BRDC-SIM-001.md) | GPS-simulaattori ja reittifixturet | M | GEO-001 |
| [BRDC-MOCK-001](BRDC-MOCK-001.md) | `MockRepository` — IndexedDB + siemendata | M | SETUP-003, PERSIST-001 |
| [BRDC-MAP-001](BRDC-MAP-001.md) | MapLibre, tumma karttatyyli | M | SETUP-002 |
| [BRDC-TRAIL-001](BRDC-TRAIL-001.md) | Sijainnin seuranta ja jäljen tallennus | M | GEO-001, MOCK-001, MAP-001 |
| [BRDC-TRAIL-002](BRDC-TRAIL-002.md) | Ley-linen renderöinti hehkulla | S | TRAIL-001 |
| [BRDC-HUD-001](BRDC-HUD-001.md) | HUD: taso, XP, matka, GPS-tarkkuus | S | TRAIL-001 |

**Portti V1:** ⏳ **odottaa** — kävele ulkona 10 min **lentokonetilassa**. Jälki seuraa ja
säilyy reloadin yli. *Tätä ei voi ajaa koneelta: se vaatii puhelimen ja ulko-oven.*
Kaikki seitsemän tikettiä on koodattu ja todennettu siltä osin kuin selain voi todentaa.

### 🔷 Vaihe 2 — Aluevaltaus

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-CLAIM-001](BRDC-CLAIM-001.md) | Lenkin tunnistus (`loopDetection`) | L | GEO-001, SIM-001 |
| [BRDC-CLAIM-002](BRDC-CLAIM-002.md) | Polygoni → H3-solut (res 11) | S | CLAIM-001 |
| [BRDC-CLAIM-003](BRDC-CLAIM-003.md) | Valtaus ja piiritysmalli (`capture`) | L | CLAIM-002 |
| [BRDC-CLAIM-004](BRDC-CLAIM-004.md) | Rappeutuminen ja vapautuminen (`decay`) | M | CLAIM-003 |
| [BRDC-CLAIM-005](BRDC-CLAIM-005.md) | `MockRepository`: closeLoop, getCells, aikakelaus | M | CLAIM-004, MOCK-001 |
| [BRDC-CLAIM-006](BRDC-CLAIM-006.md) | Heksojen renderöinti kartalle | M | CLAIM-005, MAP-001 |
| [BRDC-HUD-002](BRDC-HUD-002.md) | HUD: omistetut solut, vahvin alue | S | CLAIM-006, HUD-001 |

**Portti V2:** ✅ **läpi selaimessa** — kortteli täyttyy (`claim.spec.ts`), huominen
vahvistaa ja 16 vrk vapauttaa (`decay.spec.ts`, kellon kelauksella). **Peli on olemassa.**
Ulkona kävelty todennus on yhä tekemättä, kuten V1:kin.

### 🧪 Läpileikkaava

| ID | Nimi | Effort | Riippuvuudet |
|---|---|:---:|---|
| [BRDC-REGRESSION-000](BRDC-REGRESSION-000.md) | v2:n bugit regressiotesteiksi | M | SETUP-001 |

**Sääntö:** REGRESSION-000 ei ole erillinen työvaihe vaan **rekisteri**. Sen 12 testiä
kirjoitetaan niissä tiketeissä, jotka rekisteri nimeää — **ennen** vastaavaa ominaisuutta,
ei jälkeen.

---

## Vaiheet 3–6 — ei vielä auki kirjoitettuna

| Vaihe | Sisältö | Tiketti | Avataan kun |
|---|---|---|---|
| **3** | Supabase, RPC:t, golden fixture -testit, realtime, chat | `BRDC-MULTI-003` | V2-portti läpi |
| **4** | The Wager — haastekoodi, arena, tulossivu | `BRDC-WAGER-004` | V3-portti läpi |
| **5** | Capacitor, foreground service, allekirjoitettu APK, `version.json` | `BRDC-ANDROID-005` | V4-portti läpi |
| **6** | Lore takaisin: codex, löydöt, Fuming Lake, Anchor, teemat, audio | `docs/backlog/` | V5 tuotannossa |

Vaiheen 6 sisältö on **jäissä**, ei peruttu. Se on `docs/backlog/`issa datana valmiina.
Tämä on ainoa asia, joka erottaa v3:n v2:sta rakenteellisesti.

---

## Edistyminen 2026-08-27

| Vaihe | Tila | Tikettejä |
|---|---|---|
| **0** Perustus | ✅ portti läpi | 6/6 |
| **1** Kartta ja ley-line | 🔨 koodattu, portti odottaa | 7/7 |
| **2** Aluevaltaus | ⬜ ei aloitettu — **V1-portti ensin** | 0/7 |

Testejä: **220 yksikkö** + **73 Playwright** (360 px ajetaan ensin, 3 vaatii dev-serverin).
Sääntö `claude.md` §5: jos portti ei mene läpi, seuraava vaihe ei ala.

---

## Yhteenveto

```
Yhteensä 22 tikettiä — kaikki tuottavat GitHub-hostattavan version
  Jäissä:         1   (SEC-000, Vaihe 3)
  Vaihe 0:        6   (S×4, M×2)
  Vaihe 1:        7   (S×2, M×5)
  Vaihe 2:        7   (S×2, M×3, L×2)
  Läpileikkaava:  1   (M, jaettuna muihin tiketteihin)
Arvio: 6–9 työpäivää (MASTERPLAN §6: 1 + 2–3 + 3–5 pv)
```

**Kriittinen polku** — lyhin reitti "peli on olemassa" -hetkeen:

```
SETUP-001 → SETUP-003 → PERSIST-001 → MOCK-001 ─┐
                    → SETUP-002 → MAP-001 ────────────────┤
                    → GEO-001 → SIM-001 ──────────────────┤
                                                          ▼
                                     TRAIL-001 → CLAIM-001 → CLAIM-002
                                                → CLAIM-003 → CLAIM-004
                                                → CLAIM-005 → CLAIM-006
```

`SETUP-004`, `SETUP-005`, `TRAIL-002`, `HUD-001` ja `HUD-002` ovat polun ulkopuolella,
mutta `SETUP-005` (Pages-deploy) kannattaa tehdä aikaisin: ilman julkista HTTPS-osoitetta
yhtäkään hyväksymisporttia ei voi ajaa, koska ne kaikki vaativat puhelinta ja ulkona
kävelemistä.

**Effort:** S = tunteja · M = päivä · L = 2–3 päivää

---

## Suhde muihin dokumentteihin

| Tiedosto | Rooli |
|---|---|
| `claude.md` | Työskentelysäännöt, stack, vakiot, design-tokenit, UI/UX-standardi |
| `docs/tickets/` | **Toteutussuunnitelma** — tämä hakemisto |
| `files/MASTERPLAN.md` | Strategia ja lukitut päätökset |
| `files/EXTRACTION.md` | Mitä v2:sta poimitaan ja mitä ei |
| `ANALYSIS.md` | v2:n mitattu tila — lähdeviite, ei suunnitelma |

Uusia status- tai yhteenvetodokumentteja **ei luoda**. Edistyminen merkitään tikettien
`Status`- ja `Valmius`-kenttiin.
