# BRDC-WONDER-009 — The Ancient Löyly

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/decay.ts`, `data/profileStore.ts` (uusi kenttä), kutsujat |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`great_sauna`), `rules/harmalaWonder.ts`in `ancient-loyly` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"Decay pauses for 12 h after any walk. +4 culture/h."* Ensimmäinen puolisko
on **realmin laajuinen sääntö, ei yhden solun** — tarkkaan luettava, koska se eroaa
kaikesta muusta rappiomekaniikasta tässä pelissä:

- Jokainen tämänhetkinen rappiopoikkeus (`home`, `underFortress`, `loyalty`) on
  **solukohtainen**: se katsoo SITÄ heksaa. *"Any walk"* tarkoittaa jotain muuta —
  kävely YHDELLÄ heksalla pysäyttäisi rappion KAIKKIALLA 12 tunniksi
- Mitään "pelaajan viimeisin askel missä tahansa" -aikaleimaa **ei ole olemassa**.
  `PlayerProfile` (`types/domain.ts:213`) kantaa vain `{id, name, colorHue, level, xp}` —
  sama puuttuva-pysyvä-tila-havainto kuin `BRDC-CARD-004`in elinikäisillä luvuilla,
  eri kentän kohdalla
- `projectCell`in oma rakenne (peräkkäiset early-return-vartijat) on juuri oikea muoto
  tälle — mutta se tarvitsee sen aikaleiman parametrina, koska yksittäinen solu ei
  tiedä milloin pelaaja viimeksi käveli JOSSAIN

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+4 culture/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`in `wonderBonus`)
- [ ] Uusi kenttä pelaajan omaan tilaan, esim. `lastWalkAt: number` — kirjoitetaan aina
      kun `walkFlow`/`stepStore` käsittelee vähintään yhden hyväksytyn GPS-pisteen.
      Ei sekoiteta `cell.lastVisitedAt`iin, joka on jo per-solu-kenttä eri tarkoitukseen
- [ ] `projectCell`iin uusi valinnainen parametri, esim. `walkGraceUntil?: number` —
      kutsuja laskee `lastWalkAt + 12h` kun omistaja on löytänyt Ancient Löylyn, muuten
      `undefined`. Uusi vartija ennen rappiolaskentaa: `if (walkGraceUntil && now <
      walkGraceUntil) return cell;` — sama muoto kuin `home`/`underFortress`
- [ ] Testit: kävely yhdellä heksalla pysäyttää rappion TOISELLA, ei-kävelyn omistajan
      heksalla; 12h umpeuduttua rappio jatkuu normaalisti; ilman ihmettä ei vaikutusta

## Päätös Infiniteltä

- **Onko 12h "any walk" tarkoitettu jokaisesta hyväksytystä GPS-pisteestä (käytännössä
  lähes jatkuva suoja aktiiviselle pelaajalle) vai jokaisesta VALTAUKSESTA (harvinaisempi,
  todellinen "kiitos että kävelit" -palkinto)?** Ensimmäinen tulkinta tekisi tästä
  lähes rajattoman suojan aktiiviselle pelaajalle — dokumentin oma sana "any walk" ei
  erota näitä, ja ero on merkittävä pelitasapainolle
- Onko `lastWalkAt` koko pelaajan, vai vain sen realmin jolla ihme seisoo (yksi pelaaja,
  yksi realmi tänään — kysymys tulee ajankohtaiseksi vasta jos se muuttuu)

## Ei tässä

- Muiden ihmeiden tai rakennusten rappiovaikutukset — tämä on Ancient Löylyn oma
