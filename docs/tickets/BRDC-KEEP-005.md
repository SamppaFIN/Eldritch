# BRDC-KEEP-005 — "Still no way to research new technologies"

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Riippuvuudet** | BRDC-TECH-001 |
| **Status** | `done` (v0.5.30) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttähavainto 2026-09-05: *"siltikääm ei ole tapaa tutkia uusia teknologioita.. lisää keep valikkoon researc kohta, kuten civilisaatio pelissä"* |

## 🔴 RED

Teknologiapuu on ollut olemassa, testattu ja pelattavissa `BRDC-TECH-001`:stä lähtien
(2026-08-31/09-01): 10 teknologiaa, kolme aikakautta, `ResearchPanel.tsx` Keepin
kolmannella välilehdellä. Silti kenttäraportti sanoo suoraan ettei tutkimiseen ole
tapaa — sama sanamuoto kuin aiemmin (*"siltikääm"* = *"vieläkin"*).

**Kaksi eri syytä, molemmat koodista vahvistettu, ei pääteltyjä:**

1. **Välilehti oli nimeltään "Rites".** Kukaan etsimässä "tapaa tutkia teknologioita" ei
   klikkaa välilehteä joka kuulostaa rituaalilta — varsinkin kun puun sisältö on
   puhtaasti maallista historiaa (Toolmaking, Masonry, Astronomy), ei mitään
   okkulttista. Sama ilmiö kuin `BRDC-KEEP-003`:ssa: ominaisuus on olemassa, reitti ei
   löydy — paitsi tällä kertaa jopa nimi villitsi harhaan.
2. **Napin painallus ei tehnyt mitään näkyvää 1–3 sekuntiin.** `researchTech` kutsuu
   `getOwnedCells`ia, joka on `BRDC-SCALE-001`:n tunnettu, tarkoituksella siirretty
   täysi skannaus. Napissa ei ollut minkäänlaista "kesken"-tilaa — hiljaisuus siltä
   ajalta on identtinen rikkinäisen napin kanssa. Todennettu suoraan: `page.evaluate`
   natiivilla klikkauksella `onResearch` kutsuttiin heti, mutta tulos saapui vasta
   ~1–3 s kuluttua eikä mikään ruudulla kertonut sen olevan matkalla.

## 🟢 GREEN

- [x] **Välilehti "Rites" → "Research"** (`HearthPanel.tsx#TABS`). Paneelin otsikko,
      kieltoviestit ("That technology is already known." jne.) ja Ohjekirjan "Rites"-
      aihe (`help.ts`, avain `rite` säilyy, otsikko ja teksti "Research") yhdenmukaiset.
      "Rite" tarkoittaa yhä yhtä asiaa: castattavaa loitsua (`SpellPanel.tsx`), joka on
      eri asia kuin koko teknologiapuu.
- [x] **Nappi vastaa heti.** Uusi `researching: TechId | null` `ResearchBinding`issa;
      nappi disabloituu ja näyttää "Researching…" heti klikkauksesta, ei vasta kun
      vastaus saapuu. Ei muutosta itse `getOwnedCells`in nopeuteen — se on
      `BRDC-SCALE-001`:n oma, isompi korjaus (`owned:`-indeksi).
- [x] **`useResearch.ts` (uusi hook).** Lisäys vei `useSelection.ts`n 410 riviin;
      tutkimus oli jo oma saumansa (oma `ResearchBinding`, oma paneeli) samaan tapaan
      kuin kauppareitit (`useTradeRoutes.ts`) — sama irrotus. `ResearchBinding` pysyy
      `useSelection.ts`ssa (sama kuvio kuin `TradeBinding`); `useResearch` tuo sen
      sieltä. `useSelection.ts` 378 riviä.
- [x] **`keepTabs.test.ts`** päivitetty odottamaan `'Research'`ia, perusteltuna.
- [x] **e2e** `research.spec.ts` (uusi, 2 × mobile-360 + desktop): välilehti löytyy
      nimeltä, klikkaus disabloi napin ja näyttää "Researching…" **heti**, tulos
      saapuu ja kirjautuu IndexedDB:hen.
- [x] `pnpm test` (934) · `pnpm typecheck` · `pnpm lint:lines` · `pnpm build` vihreät.

## Toteutus

Todennettu ennen korjausta: klikkaus KUTSUI `onResearch`in ja `researchTech` PALAUTTI
`{ok: true}`in ja kirjoitti IndexedDB:hen oikein — mekaniikka ei ollut rikki, vain
näkymätön. Konsoli-instrumentoinnilla varmistettu, ei arvattu.

## Ei tässä

- `getOwnedCells`in nopeuttaminen — `BRDC-SCALE-001`, oma iso tehtävänsä.
- Aikakausiseremonian selainvarmistus — jäi jo `BRDC-TECH-001`:n `[~]`ksi.
