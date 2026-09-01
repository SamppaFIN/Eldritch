# BRDC-KEEP-002 — The Keep's own build menu: an altar, and Mana / Wisdom / Buildings tabs

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L (1–2 päivää) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-TECH-001, BRDC-BUILD-002 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infinite 2026-09-01: *"tee keeppiin valinta, rakenna alttari joka antaa manaa … tee manalle, tutkimukselle ja rakennuksille oma tabi … tuohon Rites Prehistory kontrollin tilalle, mistä voi napilla vaihtaa mana / wisdom / buildings ja train unit"* |

## 🔴 RED

Mana tulee nyt vain paikoista — Anchor ja pitkän oleskelun paljastamat temppelit
(BRDC-MANA-001). Keepillä ei ole omaa rakennusvalikkoa. HearthPanelin `ResearchPanel`
näyttää yhden otsikon *"Rites · Prehistory"* eikä siitä pääse muuhun kuin tutkimukseen.
Pelaaja ei voi Keepiltä käsin päättää mihin panostaa.

## 🟢 GREEN

- [x] Keepin paneelissa **välilehdet** — `HearthPanel` sai tab-rivin, ei sekoitu
      `CellPanel`-rakentamiseen. Domain-yhteenveto pysyy tabien yläpuolella.
- [x] **Alttari = Anchor sytytettynä** (Infiniten vahvistus): level 0 = uinuva Anchor
      Stone (6 mana/h), `raiseAltar` nostaa `K.expansions[home]` temppelin
      expand-käyrällä (40 kiveä / 30 kultaa × taso) → 1–3 = 9 / 12 / 15 mana/h.
      `expandTemple`-puhdas sääntö uudelleenkäytetty; `data/keepStore.ts` on seam.
      - Rikkoo BRDC-BUILD-002:n *"ei voi ostaa, vain ansaita ajalla"* — **vain Keep**.
- [x] **Mana → wisdom** — `channelMana` (puhdas, `rules/mana.ts`): 25 manaa → 5 wisdom,
      kiinteä kurssi `MANA_TO_WISDOM_RATE`. Kieltäytyy jos manaa liian vähän tai wisdom
      olisi yli storage-katon. Taiat viittauksena, oma tikettinsä.
- [x] **Välilehdet** *"Rites · Prehistory"* -otsikon tilalle: **Mana** (`ManaPanel`) ·
      **Wisdom** (`ResearchPanel` ennallaan) · **Buildings** (`KeepBuildingsPanel`,
      read-only katalogi) · **Train** (disabloitu, "Troops come later").
- [~] Yhdellä peukalolla: 44 px kohteet, `overflow-x:auto` neljälle tabille, näkyvä
      fokus. **Nuolinäppäinvieritys jätetty pois** — tabit ovat `aria-pressed`-nappeja,
      ei `role=tablist` (AI-Koulu: "no ARIA is better than bad ARIA").
- [x] Talouslogiikka `packages/core`:ssa puhtaana + Vitest — `mana.test.ts` (`channelMana`),
      `data/keep.repo.test.ts` (`raiseAltar` + `channelMana` repon läpi). 777 vihreää.

## Auki (suunnittelu)

- Onko alttari **place** (kuten temppeli, `RevealedPlace.kind`) vai **building**
  (`BuildingId`)? Place sopii `expandTemple`-päivitykseen suoraan; building sopii
  "rakennusvalikkoon". Todennäköisesti uusi place-kind `'altar'` jonka `placesWithHome`
  tuottaa kun se on rakennettu, ja `expandTempleAt` osaa jo rankata.
- Anchor + alttari samassa solussa — kaksi manalähdettä. `dominionOf` / `placesWithMana`
  laskenta pitää tarkistaa ettei tuplaa väärin.
- Mana→wisdom: kertaluontoinen vaihto vai jatkuva "jalostus"? Kurssi (esim. 10 mana → 1
  wisdom)? Rajoittaako storage-katto?
- `HearthPanel` on 208 riviä; tabit + alttari-osio vievät sen yli. `ResearchPanel`
  pysyy omana tiedostonaan (Wisdom-tab), Mana- ja Buildings-tabit omiin tiedostoihinsa,
  `HearthPanel` vain kehys + tab-tila.

## Ei tässä

- Joukkojen koulutus (Train unit) — vain disabloitu tab nyt
- Taikojen osto manalla — viittaus riittää, oma tikettinsä
