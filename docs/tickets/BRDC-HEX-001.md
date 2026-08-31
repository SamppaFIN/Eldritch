# BRDC-HEX-001 — Heksan muisti: löytäjä, omistushistoria, päivittäinen omistajuus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-003, BRDC-INSPECT-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
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

- [ ] `Cell` kantaa **löytäjän** ja **paljastushetken** — kirjoitetaan kerran, ei koskaan uudestaan
- [ ] Jokainen omistajuuden vaihdos kirjaa rivin: kuka, keneltä, milloin, millä voimalla
- [ ] Historia on **rajattu pituudeltaan** solua kohden ja raja on testattu — muuten
      kiistelty rajasolu kasvattaa tallennusta ilman kattoa
- [ ] **Päivittäinen omistajuus**: montako vuorokautta solu on ollut kenelläkin.
      Tämä on suunnitelman H2 ja se on myös uskollisuuden pohja
- [ ] `CellPanel` näyttää historian ihmisen kielellä ("Otettu Vieraalta 3 vrk sitten")
- [ ] Historia kulkee `world.json`issa mukana rajattuna (`BRDC-SHARE-001`)
- [ ] Puhtaat funktiot testattuina; ei kelloa ilman `now`-parametria

## Toteutus

Historia on **liite soluun, ei erillinen kokoelma**. `K.cell(h3)` on jo avain; rivit
elävät sen alla, jolloin ne katoavat solun mukana eikä orpoja jää.

Tämä tiketti on **`BRDC-CLAIM-003`:n ja `BRDC-INSPECT-001`:n jatke**, ei uusi järjestelmä.
`resolveCapture` tietää jo kaiken tarvittavan — `CaptureOutcome` kantaa `previousOwner`in
ja molemmat vahvuudet. Tieto heitetään tällä hetkellä pois heti kun paneeli on piirretty.

## Ei tässä

- Uskollisuusmekaniikka. Se lukee tätä dataa mutta on `BRDC-BUILD-003`
- Vaiheen 3 `cell_history`-taulu. Sama muoto, eri koti
