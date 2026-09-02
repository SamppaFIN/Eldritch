# BRDC-WAGER-JSON-004 — Vastaanotettu kartta päivittää omistajuudet, ja näkyy tiedoissa

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001, BRDC-WAGER-JSON-002, BRDC-INSPECT-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Tee silleen, että kun pelaaja ottaa kartan vastaan, niin joka ruutu päivittyy
omistajuuksilla ja toisen lääneillä. Laita details dialogi näyttään kans tiedot."*

Wager tuo vastustajan maan mukanaan, mutta kartta ei kerro sitä kunnolla: vastaanotettu
alue jää puolittain näkymättömäksi, eikä solun tiedoista näe **kenen** se on tai **milloin
tieto on saatu**. Moninpeli ilman palvelinta seisoo tai kaatuu sen varassa, että
vastaanotettu tiedosto todella muuttaa karttaa näkyvästi.

Tämä on ainoa moninpeliin liittyvä kohta jonka Infinite piti mukana nyt — kaikki muu
backend ja moninpeli odottaa: *"Kaikki backend ja multiplayer asiat tehdään sit, kun
saadaan lokaali versio toimiin."* Tämä toimii ilman palvelinta, joten se kuuluu tähän.

## 🟢 GREEN

- [ ] **Vastaanotto päivittää jokaisen solun** jonka tiedosto kattaa: omistaja, vahvuus ja
      lääni. Sumu ei piilota vastaanotettua tietoa — se *on* paljastus.
- [ ] Vastaanotettu maa erottuu omasta ja tavallisesta vihollismaasta: se on tietoa, ei
      naapuruutta. `imported`-lippu on jo olemassa (`Cell.imported`) — käytä sitä.
- [ ] **Solun tiedot kertovat lähteen:** kenen maa, mistä viestistä ja **milloin tieto on
      saatu**. Vanha tieto sanoo olevansa vanhaa (*"as they saw it, 3 days ago"*) — se ei
      ole nykyhetki eikä saa esittää olevansa.
- [ ] Yhteenveto vastaanotettaessa: montako solua, kenen, miltä alueelta. Yksi kortti,
      ei lokirivi joka katoaa.
- [ ] Vastaanotettu maa **ei rappeudu** eikä osallistu tuotantoon (`projectCell` jättää jo
      `imported`in rauhaan) — todenna se testillä, älä oleta.
- [ ] Testit: vastaanotto päivittää kaikki solut · lähde ja aika säilyvät · toinen
      vastaanotto samalta pelaajalta korvaa vanhan tiedon eikä kahdenna sitä.

## Ei tässä

- Palvelin, tilit, realtime. Vaihe 5.
- `world.json`-cron (`BRDC-SHARE-001`) — sama data, eri kuljetin.
