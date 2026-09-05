# BRDC-KEEP-007 — Research on oma näyttö, footer-napista

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-KEEP-006, BRDC-TEMPLE-002 |
| **Status** | `done` (2026-09-05) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-05: *"poista tuo keep valikosta ja tee sille oma nappi footeriin, mikä avaa tutkimussivun eri dialogii"* |

## 🔴 RED

`KEEP-005` → `KEEP-006` yritti tehdä Keepin Research-välilehdestä löydettävän (nimeäminen,
sitten sticky-palkki). Kolmas kenttähavainto: välilehti *ei kuulu Keepin sisään* lainkaan.
Infinite: irrota se omaksi napiksi HUD:n footeriin (`Here · Keep · You` -rivi), joka avaa
tutkimuksen omassa dialogissa — kuten `The Wager` on oma dialoginsa, ei Keepin osio.

Nykytila: `HearthPanel.tsx` `TABS` = `mana · wisdom(Research) · buildings`; `wisdom`-
välilehti renderöi `<ResearchPanel research={inspect.research} pool={resources}
wisdomPerHour={forecast?.perHour.wisdom} />`. Footerissa (`Hud.tsx` `hud__actions`) on
Vigil · Here · Keep · You.

## 🟢 GREEN

- [x] **Research pois Keepistä.** `HearthPanel.tsx`: `TABS`ista poistuu `{ id: 'wisdom',
      label: 'Research' }` → `[mana, buildings]`. `KeepTab`-tyyppi menettää `'wisdom'`in.
      `{tab === 'wisdom' ? <ResearchPanel .../> : null}` -lohko poistuu. `HearthPanel`in
      `research`-propsi poistuu (vain wisdom-välilehti käytti sitä); `MapView` lopettaa
      `research={inspect.research}`n välittämisen `<HearthPanel>`ille. `forecast` jää
      (`KeepResources` käyttää sitä).
- [x] **`ResearchDialog.tsx` (uusi).** `@es3/ui` `Modal` + `ResearchPanel`-sisältö. Propsit
      `{ open, research, pool, wisdomPerHour, onClose }`. ESC sulkee, footer-nappi palauttaa
      fokuksen (Modalin oma käytös). Otsikko "Research".
- [x] **Avaustila `useSelection`iin.** `researchOpen` + `openResearch()` + `closeResearch()`
      — sama kuvio kuin `wager`/`openWager`/`closeWager`. `useSelection` omistaa jo
      `research`-bindingin.
- [x] **Footer-nappi.** `Hud.tsx`: uusi `onOpenResearch?: () => void`. `hud__actions`-riviin
      `<RitualButton variant="ghost" className="hud__here" onClick={onOpenResearch}>✷ Research
      </RitualButton>` `You`n perään. `hud.css`-kommentti "Four controls" → "Five"; rivi
      saa rivittyä (`flex-wrap: wrap` on jo, "last resort").
- [x] **`MapView`.** `<ResearchDialog open={inspect.researchOpen} research={inspect.research}
      pool={resources} wisdomPerHour={forecast?.perHour.wisdom ?? 0}
      onClose={inspect.closeResearch} />`; `<Hud ... onOpenResearch={inspect.openResearch} />`.
      MapView 399/400 → trimmaa yksi kommentti (kuten edellisissä).
- [x] **Testit.** `keepTabs.test.ts`: `TABS.map(t=>t.id)` = `['mana','buildings']`; poista
      "wisdom label is Research". `research.spec.ts`: reitti `Keep → Research-välilehti` →
      `footer "Research" -nappi → dialogi → tutki` — muuten samat assertit (nappi vastaa
      heti, tutkimus laskeutuu).
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines && pnpm build` vihreät; `research.spec.ts`
      + `temple.spec.ts` molemmilla projekteilla.

## Vaikutus

- **`BRDC-KEEP-006`** sticky-välilehtipalkki jää — `Mana · Buildings` hyötyvät siitä yhä.
  Research-signpost (`nextResearchStep` temppelipaneelissa, wisdom-lähderivi) jää, mutta
  wisdom-lähderivi elää nyt `ResearchDialog`issa `ResearchPanel`in mukana.

## Ei tässä

- Temppelin riittitutkimus (`TempleSchoolPanel` `CellPanel`issa) — ei muutu, koulukunnalliset
  riitit opitaan yhä temppelistä.
- Riittien tuominen samaan `ResearchDialog`iin — erikseen jos pyydetään.
- Wisdom-talouden numerot.
