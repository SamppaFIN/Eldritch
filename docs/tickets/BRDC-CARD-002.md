# BRDC-CARD-002 — KEEP mallin mukaan

| | |
|---|---|
| **Alue** | `features/keep/` (`HearthPanel`, `KeepRealm`, `KeepResources`, `KeepTemples`, välilehdet) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | — |
| **Lähde** | `Eldritch-Sigil.html` §06 — 04 · KEEP · Infinite 2026-09-16 (ks. `BRDC-CARD-001`) |

## 🔴 RED

`BRDC-KEEP-008` (v0.5.89) korjasi kaksi virhettä ja pinta-alan yksikön, **mallia ei rakennettu**.
Mallin oma selitys:

> *"The nation gets a header and four headline numbers. The resource list becomes a per-hour treasury
> strip in resource hues. Provinces, Works and Temples are three tabs over one scrollable list — each
> row carries its own iso art, so the Keep reads as a place, not a table."*

Malli: **NATION** · *The Nameless Reach* · *1 province · 280 souls* · neljä pääluvun ruutua ·
**TREASURY · PER HOUR** -nauha + COLLECT · **NEXT 72 HOURS · 2 FADING** · välilehdet
**PROVINCES / WORKS / TEMPLES** jokaisella rivillä iso-kuva · **LIGHT THE ALTAR · 6 MANA/H**.

## 🟢 GREEN

- [ ] Auditoi nykyinen Keep mallia vasten; ero listana tähän
- [ ] Kansakunnan otsake ja neljä pääluvua
- [ ] Aarreaitta tuntinauhana resurssien väreissä
- [ ] *Next 72 hours* -rappiolista (Linnoituksen suojaama maa ei näy, `BRDC-BUILD-012`)
- [ ] Kolme välilehteä yhden listan päällä, iso-kuva joka rivillä
- [ ] Alttarin sytytys -toiminto
- [ ] 360 px -kuvakaappaus mallin rinnalla
