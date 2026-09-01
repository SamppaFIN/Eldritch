# BRDC-KEEP-002 — The Keep's own build menu: an altar, and Mana / Wisdom / Buildings tabs

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M–L (1–2 päivää) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-TECH-001, BRDC-BUILD-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-01: *"tee keeppiin valinta, rakenna alttari joka antaa manaa … tee manalle, tutkimukselle ja rakennuksille oma tabi … tuohon Rites Prehistory kontrollin tilalle, mistä voi napilla vaihtaa mana / wisdom / buildings ja train unit"* |

## 🔴 RED

Mana tulee nyt vain paikoista — Anchor ja pitkän oleskelun paljastamat temppelit
(BRDC-MANA-001). Keepillä ei ole omaa rakennusvalikkoa. HearthPanelin `ResearchPanel`
näyttää yhden otsikon *"Rites · Prehistory"* eikä siitä pääse muuhun kuin tutkimukseen.
Pelaaja ei voi Keepiltä käsin päättää mihin panostaa.

## 🟢 GREEN (luonnos — tarkennettava suunnitteluvaiheessa)

- [ ] Keepin (Hearth-solun) paneelissa **rakennusvalikko** — oma osio, ei sekoitu
      tavallisen solun `CellPanel`-rakentamiseen
- [ ] **Alttari**: rakennettava manalähde Keep-soluun. Maksaa resursseja (kiveä + kultaa),
      tuottaa manaa/h. **Päivitettävissä** rankilla (`expandTemple`-tyylinen porras:
      lisää kiveä + kultaa → enemmän manaa)
      - Huom: rikkoo tarkoituksella BRDC-BUILD-002:n periaatteen *"temppeliä ei voi ostaa,
        vain ansaita ajalla"* — **vain Keepin kohdalla**, koska Keep on erityinen
- [ ] **Mana → wisdom -vaihto** (ja myöhemmin taiat): manalla voi hankkia wisdomia.
      Kurssi ja rajat suunnittelussa
- [ ] **Välilehdet** `ResearchPanel`in *"Rites · Prehistory"* -kontrollin tilalle:
      **Mana** (alttari + vaihto) · **Wisdom** (nykyinen tutkimus/Rites) ·
      **Buildings** (mitä Keep-alueelle voi rakentaa) · **Train unit** (disabloitu,
      "tulossa" — joukot lisätään myöhemmin)
- [ ] Tabit toimivat yhdellä peukalolla, aktiivinen tab selvä, ei vaakascrollia (§14)
- [ ] Kaikki talouslogiikka `packages/core`:ssa puhtaana funktiona + Vitest

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
