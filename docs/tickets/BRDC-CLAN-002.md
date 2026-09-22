# BRDC-CLAN-002 — Klaani-Codex: klaanit keskenään

| | |
|---|---|
| **Alue** | `packages/core/src/data/demographics.ts`, uusi `clanDemographics.ts`, `apps/worker/src/index.ts`, `apps/game/src/features/clan/` |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-CLAN-001` (`clanId` olemassa julkaisussa) |
| **Status** | `done` — 2026-09-22 (v0.6.48) |

## 🔴 RED

Infinite: *"laitetaan kanssa klaanit vs keskenään."* `BRDC-CLAN-001` kantaa `clanId`:n,
mutta mikään ei vielä laske klaaneja yhteen. `demographics.ts`in `demographicsOf` on jo
geneerinen minkä tahansa `Measurable[]`:n yli (jokainen alkio: id, nimi, solut, taso,
leyM) — se EI tiedä ryhmittelystä mitään, se vain mittaa sille annetut rivit. Klaani-liiga
tarvitsee yhden uuden asian: joukon jäsenten yhdistämisen **yhdeksi** synteettiseksi
`Measurable`iksi per klaani, ennen kuin sama, jo testattu funktio ajetaan.

## 🟢 GREEN

- [x] `packages/core/src/data/clanDemographics.ts` (uusi) — `clanMeasurables(sources:
      readonly WorldSource[]): Measurable[]`. Ryhmittelee `clanId`:n mukaan (sivuuttaa
      `clanId === undefined`), summaa jäsenten `cells`, käyttää klaanin **suurimman
      jäsenen tasoa** (ei summaa), summaa `leyM`. `name` on tässä vielä `clanId` itse
      — Worker korvaa sen oikealla nimellä, koska puhdas funktio näkee vain
      `WorldSource`in, ei koskaan klaanin oikeaa nimeä
- [x] Worker: uusi `clanCodexOf()`-apuri kutsuu `clanMeasurables()`in tuloksen läpi
      olemassa olevan `demographicsOf()`in ja korvaa jokaisen rivin `name`-kentän
      `clan:<id>`in oikealla nimellä (yksi KV-luku per läsnä oleva klaani). `rebuild()`
      kirjoittaa tuloksen `clan-codex`-avaimeen samassa ajossa kuin pelaaja-Codexin
- [x] Worker: `GET /clan-codex` — sama kylmäkäynnistys-pelastus kuin `/demographics`illa
- [x] **Skoopin laajennus workerin sisällä:** `index.ts` oli jo 407 riviä ennen tätä
      tikettiä. Erotettu `chronicle.ts` (BRDC-HALL-002:n AI-tarinalogiikka, ~70 riviä,
      täysin oma huolensa) omaksi tiedostokseen ennen `clan-codex`in lisäämistä — ei
      REDiä jonka pelaaja tuntisi, mutta rivibudjetin vapautus oli pakollinen ehto
- [x] Asiakas: `useCodex`in signatuuri laajeni `(open, path = '/demographics')`iksi
      (`fetchDemographics` → yleinen `fetchTable(path)`). Yksi rivi muuttui, ei uutta
      hookia
- [x] `ClanCodexPanel.tsx` (uusi, `features/clan/`) — sama arkkipohja kuin
      `CodexPanel.tsx`, lukee `../codex/codex-panel.css`in ja `figures.ts`in
      uudelleenkäyttäen; ei banneria/kansallisuutta (klaaneilla ei ole niitä)
- [x] Oman klaanin rivi korostuu `codex__row--titled`-tyylillä täsmälleen samalla
      logiikalla kuin pelaaja-Codexissa, `myClanId`illa (`useClan()`in `clan.clanId`)
      pelaajan `id`:n sijaan
- [x] ☰-valikkoon uusi kohde "Clan Codex", Clan-kohdan viereen
- [x] Portti: `lint:lines`, `tsc -b`, **1632** vitest (+7: `clanDemographics.test.ts`),
      `pnpm build`, `e2e/clan-codex.spec.ts` (uusi, 2/2). Workerin `/clan-codex`
      todennettu käsin `wrangler dev`illä: kaksi klaania, eri jäsenmäärä ja taso,
      oikea nimi (ei koodi) jokaisella rivillä, oikea järjestys jokaisella mittarilla

## Todennus

`clanDemographics.test.ts`: kaksi klaania joilla eri määrä jäseniä ja soluja →
`clanMeasurables`in tulos summaa solut ja ley-linjan oikein, käyttää suurinta tasoa
(ei summaa), floorii puuttuvan tason 1:een samoin kuin `demographicsOf` tekisi
yksittäiselle pelaajalle; pelaaja ilman `clanId`:tä ei näy kummassakaan klaanissa;
tyhjä syöte → tyhjä tulos, ei virhettä. Kokonaisketju (`clanMeasurables` →
`demographicsOf`) tuottaa saman `Metric`-muodon kuin pelaaja-Codex, todennettu
suoraan: kuusisoluinen klaani voittaa yksisoluisen `land`-mittarissa.
`e2e/clan-codex.spec.ts`: tyhjä maailma sanoo niin selkeästi; täytetty taulukko näyttää
klaanien **nimet**, ei koskaan niiden raakaa koodia.

**Käsin, oikeaa Workeria vasten:** kaksi klaania luotu, kaksi jäsentä eri klaaneista
julkaissut eri määrän soluja ja eri tasoilla, `/clan-codex` palauttaa oikeat nimet
(`"The Rook Guard"`, `"The Pale March"`, ei `"822J9N"`/`"2KDSEU"`) ja oikean
järjestyksen jokaisella mittarilla.

## Ei tässä

- **Klaanihallinta** — `BRDC-CLAN-003`
- **Klaanin oma sivu jäsenlistalla.** Tämä tiketti näyttää vain klaanien keskinäisen
  sijoituksen (liiga), ei jäsenten omaa listaa klaanin sisällä — se on luonnollinen
  lisäys `BRDC-CLAN-003`in hallintanäkymään, koska sielläkin tarvitaan jäsenlista
- **Historiaseuranta / kausittainen liiga.** Klaani-Codex on aina "nyt"-tilanne, sama
  30 vrk TTL kuin pelaaja-Codexilla (`WORLD_PLAYER_TTL_MS`) — ei kausia, ei arkistoa
