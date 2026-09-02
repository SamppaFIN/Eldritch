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
omistajuuksilla ja toisen lääneillä. Laita details dialogi näyttään kans tiedot."* ja
*"päivitä json että kun import exporttaa, niin ruudut jaetaan uusilla tiedoilla. tarvitaan
siis soluille lisää metadataa jsoniin myös."*

Wager tuo vastustajan maan mukanaan, mutta kartta ei kerro sitä kunnolla: vastaanotettu
alue jää puolittain näkymättömäksi, eikä solun tiedoista näe **kenen** se on tai **milloin
tieto on saatu**. Ja nykyinen `exportChallenge`-JSON kantaa solusta vain h3:n, omistajan
ja vahvuuden — ei maastoa, ei rakennuksia, ei lääniä, ei valtion nimeä eikä lippua.
Vastaanotettu kartta näyttää siis harmailta laatikoilta, ei toisen pelaajan
sivilisaatiolta.

Tämä on ainoa moninpeliin liittyvä kohta jonka Infinite piti mukana nyt — kaikki muu
backend ja moninpeli odottaa: *"Kaikki backend ja multiplayer asiat tehdään sit, kun
saadaan lokaali versio toimiin."* Tämä toimii ilman palvelinta, joten se kuuluu tähän.

## Laajennettu solun metadata JSONissa

`challenge.ts`:n solu­sarjallistus (ja sama `world.ts`:ssä) kasvaa. Uudet kentät ovat
**kaikki valinnaisia** — vanha viesti ilman niitä luetaan yhä (`CHALLENGE_VERSION` nousee
vain jos vanha ei ole luettavissa). Taulukkomuoto pysyy tiiviinä (SHARE-001: 39 tavua/solu).

| Kenttä | Mistä | Miksi jaetaan |
|---|---|---|
| `terrain` | `Cell.terrain` / hash | vastaanotettu kartta näyttää metsän metsänä, ei laatikkona |
| `building` | `Cell.building` | rakennusmerkki piirtyy rajalle — intel (`BRDC-ART-002`) |
| `region` (lääni) | `regionOf(h3)` | "toisen läänit" — Infiniten sanoin |
| `nation` | `es3:nation.name` (`BRDC-NATION-001`) | kenen sivilisaatio tämä on |
| `banner` | `es3:nation.bannerId` (`BRDC-BANNER-001`) | lippu detail-dialogissa |
| `seenAt` | vientihetki | "as they saw it, 3 days ago" — ei esitä nykyhetkeä |
| `castle` | `getCastle()` | julkinen sijainti, **ei koskaan Hearth** (`BRDC-CASTLE-001`) |

Ei mukana: XP, pouch, tekniikkapuu, dwell — ne ovat pelaajan omaa tilaa, eivät kartan.

## 🟢 GREEN

- [ ] **Vienti kirjoittaa laajennetun metadatan** yllä olevan taulukon mukaan; `buildChallenge` /
      `exportChallenge` ja `world.ts#buildShards` jakavat saman solunserialisoijan.
- [ ] **Tuonti lukee sen takaisin** ja täyttää `Cell`in additiiviset kentät (`terrain`,
      `building`, `imported`, ja uusi `importedFrom?: { nation, banner, seenAt }`).
      Tuntematon/puuttuva kenttä → oletus, ei kaatuminen.
- [ ] **Vastaanotto päivittää jokaisen solun** jonka viesti kattaa: omistaja, vahvuus,
      lääni, maasto, rakennus. Sumu ei piilota vastaanotettua tietoa — se *on* paljastus.
- [ ] Vastaanotettu maa erottuu omasta ja tavallisesta vihollismaasta: se on tietoa, ei
      naapuruutta. `imported`-lippu on jo olemassa (`Cell.imported`) — käytä sitä.
- [ ] **Detail-dialogi kertoo lähteen:** valtion nimi + lippu, mistä viestistä, ja
      **milloin tieto on saatu** (`importedFrom.seenAt` → *"as they saw it, 3 days ago"*).
- [ ] Yhteenveto vastaanotettaessa: montako solua, kenen, miltä alueelta. Yksi kortti.
- [ ] Vastaanotettu maa **ei rappeudu** eikä osallistu tuotantoon (`projectCell` jättää jo
      `imported`in rauhaan) — todenna se testillä, älä oleta.
- [ ] Checksum kattaa uudet kentät — `parseChallenge` torjuu `damaged`in samalla FNV-1a:lla.
- [ ] Testit: vienti↔tuonti round-trip säilyttää jokaisen kentän · vanha (metadataton)
      viesti luetaan yhä · lähde ja aika säilyvät · toinen vastaanotto korvaa eikä kahdenna.

## Ei tässä

- Palvelin, tilit, realtime. Vaihe 5.
- `world.json`-cron (`BRDC-SHARE-001`) — **sama laajennettu solunserialisoija, eri
  kuljetin.** SHARE-001:n `WorldShard` saa samat kentät samalla muutoksella.
- Väestön / XP:n / tekniikan jakaminen — pelaajan omaa tilaa, ei karttaa.
