# BRDC-UX-008 — Pienet: nauha, You, Tavernan valmiit, kylän laituri, Ledgerin välilehdet

| | |
|---|---|
| **Alue** | HUD-nauha, CharacterPanel, TaskBoard, TradePost, LandsPanel |
| **Vaihe** | 3 — Season 3 (haara `season-3`); yleiset korjaukset voidaan poimia `main`iin hotfixinä Infiniten luvalla |
| **Effort** | S–M |
| **Riippuvuudet** | — |
| **Lähde** | Käytettävyyskatselmus 2026-10-09 (27 ruutukaappausta 360 px, rikas valtakunta); Infinite: *"joo, tee tiketti ja jatka"* |
| **Status** | `todo` |

## 🔴 RED

Up next -nauha leikkautuu ("Store…") eikä kerro pyyhkäisystä. Ledgerin välilehdet ylivuotavat ("Anomalie", Routes ei näy). "1 d walked 12 d" on arvoitus. You-paneelin proosa ja saavutuslista pitkiä. Tavernan valmiit tehtävät jäävät tauluun ikuisesti. Kylän laiturilla kauppa, envoyt ja tehtävät yhdessä pitkässä kortissa.

## 🟢 GREEN

- [ ] Nauha: kaksi kohdetta + "+N" tai reunan häivytys
- [ ] Ledgerin välilehdet mahtuvat tai näyttävät vieritettävyyden
- [ ] Rivien aika selkokielellä ("walked 1 d ago · fades in 12 d")
- [ ] You: tasoproosa ja saavutukset togglen taakse (ansaitut + seuraava)
- [ ] Taverna: valmiit "Done (n)" -togglen taakse
- [ ] Kylän tehtävät togglen taakse
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build; e2e 360 px kuvakaappaus ennen/jälkeen

## Ei tässä

—
