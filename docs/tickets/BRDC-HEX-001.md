# BRDC-HEX-001 — Heksan muisti: löytäjä, omistushistoria, päivittäinen omistajuus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-003, BRDC-INSPECT-001 |
| **Status** | `done` — 2026-08-31 (world.json-vienti `[~]`, ks. GREEN 6) |
| **Valmius** | 90 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (H1–H2) |

## 🔴 RED

`Cell` muistaa `ownerId`, `strength`, `lastVisitedAt` ja `visitDays`. Se ei muista
**kuka sen löysi**, keneltä se otettiin, tai monenako päivänä se on vaihtanut omistajaa.

`claude.md` §15 vaatii jo `cell_history`-rivin jokaisesta omistajuuden muutoksesta —
Vaiheessa 3, palvelimella. Mutta pelillisesti historia on tarpeen aiemmin: suunnitelman
uskollisuus, achievementit, tilastot ja wiki lukevat kaikki samaa tietoa, jota ei
kerätä.

Ja **löytäjä on lore.** Solu, jonka *sinä* paljastit ensimmäisenä, on eri asia kuin solu,
jonka valtasit joltakulta. Peli ei tällä hetkellä erota niitä.

## 🟢 GREEN

- [x] `Cell.finder` + `Cell.revealedAt` — asetetaan `resolveCapture`:n `claimed`-haarassa
      `cell.finder ?? attacker.id`, ei koskaan ylikirjoiteta (`taken` säilyttää alkuperäisen)
- [x] Jokainen omistajuuden vaihdos kirjaa `OwnershipChange`-rivin: `to, from, at, power`
      (`claimed` ja `taken` -haarat, `appendChange`)
- [x] Historia **rajattu** `MAX_CELL_HISTORY = 20`:een, `appendChange` pudottaa vanhimman;
      testattu `history.test.ts`:ssä
- [x] **Päivittäinen omistajuus** `Cell.ownedDays` — kasvaa joka uuden päivän
      `reinforced`-haarassa. **Harkinta:** lasketaan *päiviä käyty omistaessa*, ei
      kalenteripäiviä (hylätty solu ei kerää uskollisuutta, eikä päiväjoukkoa tallenneta
      rajattomasti). Kumulatiivinen omistajien yli
- [x] `CellPanel` näyttää historian lauseena ("Taken from another wanderer 3 days ago",
      "You revealed this") + "walked on N days". `from`:lla ei ole nimeä clientillä →
      "another wanderer", `null` → "the Void"
- [~] Historia `world.json`issa — **siirretty jatkoon.** `WorldShard`/`WorldSubmission`:n
      solut ovat `{ h3, strength }`; `finder`+`history` vaatisi `buildShards`:n sisäisen
      litistyksen levennyksen + checksum-katteen + validoinnin, ja tuotu solu on jäädytetty
      tuontihetkellä (ei rappeudu, ei vaihda omistajaa paikallisesti) → arvo pieni,
      niputetaan world.json-passiin
- [x] Puhtaat funktiot testattuina (`history.test.ts` 3, `capture.test.ts` +4); `now` aina
      parametri

## Toteutettu 2026-08-31

- `types/domain.ts`: `OwnershipChange` + `Cell.finder?/revealedAt?/ownedDays?/history?`,
  kaikki optionaalisia → **ei skeemanostoa** (kuten `imported`, `terrain`).
- `rules/history.ts` (uusi): `appendChange` (litistä + slice `-MAX_CELL_HISTORY`).
- `rules/capture.ts`: `claimed`/`taken`/`reinforced`-haarat kirjaavat. `applySpoils` ei
  koskenut — se ei käännä omistajaa ja säilyttää kentät `{...cell}`:llä.
- `CellPanel.tsx` + `cell-panel.css`: `historyLine`-apuri.
- **Ei `MockRepository`-muutosta** — historia ratsastaa soluilla jotka `planClaim`/
  `planWalk`/`growth` jo tuottavat ja repo jo tallentaa. 495 testiä vihreää.

## Toteutus

Historia on **liite soluun, ei erillinen kokoelma**. `K.cell(h3)` on jo avain; rivit
elävät sen alla, jolloin ne katoavat solun mukana eikä orpoja jää.

Tämä tiketti on **`BRDC-CLAIM-003`:n ja `BRDC-INSPECT-001`:n jatke**, ei uusi järjestelmä.
`resolveCapture` tietää jo kaiken tarvittavan — `CaptureOutcome` kantaa `previousOwner`in
ja molemmat vahvuudet. Tieto heitetään tällä hetkellä pois heti kun paneeli on piirretty.

## Ei tässä

- Uskollisuusmekaniikka. Se lukee tätä dataa mutta on `BRDC-BUILD-003`
- Vaiheen 3 `cell_history`-taulu. Sama muoto, eri koti
