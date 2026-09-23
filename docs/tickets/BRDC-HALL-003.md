# BRDC-HALL-003 — Chronicles: a shared Hall of Fame, tagged by era

| | |
|---|---|
| **Alue** | `packages/core/src/data/hallOfFameStore.ts`, `apps/worker/src/`, `apps/game/src/features/hall/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-HALL-001` (retiring), `BRDC-SHARE-003` (Worker) |
| **Status** | `[ ]` ei aloitettu — kirjattu 2026-09-23, Infinite: *"tehdään isompia muutoksia
  ensiviikon alusta"* — tämä on sitä työtä, ei tätä sessiota |

## 🔴 RED

Infinite 2026-09-23: *"Minulla on nyt lokaalina 2 highscore kuningaskuntaa, niin haluan
että nuo minulla ja muilla jää 'aikakirjoihin' high scoreen, mikä näkyy kaikille..
merkkaa se että aikakaudelle kivikausi vaikka.. tms.. saa olla luovakin."*

`retireKingdom` (`hallOfFameStore.ts`) jo tekee täsmälleen sen eleen tämä pyytää —
arkistoi luvut, pyyhkii pelin — mutta **täysin paikallisesti**: `HallOfFamePanel` lukee
vain oman laitteen `K.hallOfFame`-avainta. Infiniten kaksi retiroitua kuningaskuntaa
eivät näy kenellekään muulle eivätkä edes hänelle itselleen toisella laitteella. Sama
puute joka `world.json`illa oli ennen `BRDC-SHARE-001`ia, mutta arkistolle eikä elävälle
kartalle.

## Mitä puuttuu

- Retiroitu kuningaskunta ei koskaan lähde laitteelta
- `HallOfFameEntry`illä ei ole aikakautta — Infinite haluaa vapaan, luovan merkinnän
  ("kivikausi" -tyylinen), ei kiinteää enumia
- Ei jaettua listaa: mikään ei vastaa Codexia/Atlasta retiroiduille kuningaskunnille

## 🟢 GREEN (luonnos — ei toteutettu)

- [ ] `HallOfFameEntry.era?: string` — vapaa, pelaajan kirjoittama, valinnainen.
      Retire-dialogiin tekstikenttä ennen arkistointia (samaan tapaan kuin
      `retireKingdom`in kutsupaikka jo kysyy vahvistuksen)
- [ ] Uusi Worker-reitti `POST /chronicle` — julkaisee yhden retiroidun kuningaskunnan
      luvut + `era`, sama luottamusmalli kuin `/submit` (ei tiliä, ei avainta, checksum
      torjuu revenneen viestin). Oma KV-avain (esim. `chronicle:<playerId>:<retiredAt>`),
      ei ylikirjoita — kuningaskunta retiroituu kerran
- [ ] `GET /chronicles` — koko jaettu lista, sama kylmäkäynnistys-kuvio kuin
      `/demographics`/`/route-codex` (`cachedTable`-apufunktio uudelleenkäytettävissä)
- [ ] Client: `retireKingdom`in jälkeen best-effort `POST /chronicle` (sama
      "niele jokainen virhe" -periaate kuin `publishSubmission`illa — paikallinen
      arkisto on aina totuus, Worker on vain näyteikkuna)
- [ ] `HallOfFamePanel` saa toisen välilehden ("Every realm" / vastaava) joka lukee
      `/chronicles`ia samalla kolmen-tuloksen kuviolla kuin `useCodex`/`useRouteCodex`

## 🔴 Avoimet kysymykset ennen toteutusta

- Onko jaetun listan koolla katto (kuten `MAX_SHARD_CELLS`), vai kasvaako se
  rajattomasti? Retirointi on harvinainen teko, mutta ei koskaan nollaudu
- Näytetäänkö `era` vapaana tekstinä sellaisenaan (riski: pitkä/asiaton syöte
  jaetussa näkymässä) — sama `.trim().slice(0, 40)` -katkaisu kuin klaanin nimellä?
- Infiniten kaksi olemassa olevaa paikallista kuningaskuntaa: julkaistaanko ne
  taannehtivasti kun tämä ilmestyy, vai vain uudet retiroinnit eteenpäin?

## Ei tässä

- **Ei automaattista retirointia.** Yhä pelaajan oma, tarkoituksellinen teko
  (`BRDC-HALL-001`in periaate) — `BRDC-MODE-003` voi tehdä siitä *pakotetun* yhdessä
  tilanteessa, mutta se on eri tiketti
- **Ei aikakausien validointia tai listaa.** "Saa olla luovakin" — vapaa teksti, ei
  rajattu valikko
