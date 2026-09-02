# BRDC-KEEP-003 — Keep löytyy, ja Rites sen mukana

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-KEEP-002, BRDC-CASTLE-002, BRDC-TECH-001, BRDC-MANA-001 |
| **Status** | `done` — 2026-09-02 (v0.5.10), kenttätodennus `[~]` |
| **Valmius** | 85 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä, kaksi kertaa: *"mistä voi tutkia teknologioita ja mistä löytää riittejä?"* ja
*"Keep details dialogissa ei ole nyt tabirakennetta"*, ja lopuksi *"nyt tosiaan on
mahdoton tutkia teknologioita ja saada manaa"*.

Tarkistettu koodista: **välilehdet ovat olemassa.** `HearthPanel.tsx` rakentaa
`TABS = [Mana · Rites · Buildings · Train]` ja `BRDC-KEEP-002` on `done` 100 %. Ne eivät
siis puutu — **niitä ei löydä.** Paneeli aukeaa `inspect.sanctum`ista, ja pelaaja joka
napauttaa kartalla näkyvää Keep-merkkiä päätyy johonkin muuhun.

Tämä ei ole puuttuva ominaisuus vaan reitti, jota kukaan ei löydä. Se on pahempi:
teknologiapuu, mana ja rakennusvalikko ovat kaikki valmiina ja pelin kannalta
näkymättömiä. Kokonainen Vaihe 3:n osa on olemassa ilman ovea.

## 🟢 GREEN

- [x] **Keep-merkin napautus vie välilehdelliseen paneeliin** — toimi jo `BRDC-CASTLE-002`:sta
      (`onCastleTap` → `inspect.sanctum` → `HearthPanel`, jossa Mana / Rites / Buildings / Train).
- [x] **Reitti löytyy ilman karttamerkkiä.** Footerissa `⌂ Keep` -nappi (`Hud.tsx`
      `hud__actions`, `⬢ Here` ja `◇ You` vieressä), kutsuu samaa `inspect.onCastleTap`ia.
      Näkyy kun `castle !== null` (pelaajalla on Hearth). `MapView` gettaa sen.
- [~] Ensimmäinen avaus: jokaisella välilehden sisällöllä on jo oma johdantorivi
      (`ManaPanel`, `ResearchPanel`, `KeepBuildingsPanel`). Erillistä välilehti-vihjettä ei
      lisätty — turhaa toistoa. **Linkki kirjaan (`rite`, `mana`) jää `BRDC-WIKI-002` /
      `BRDC-KEEP-004`:ään** (siellä rakennus→Guide-linkit muutenkin).
- [x] Testi: `keepTabs.test.ts` — neljä osiota oikeassa järjestyksessä, jokaisella label,
      tutkimus = "Rites". 858 vihreää. (Renderöintitestiä ei — repo testaa paneelien
      puhtaita apureita, ei JSX:ää.)
- [~] **Todennus on kysymys:** anna peli jollekulle, pyydä tutkimaan Riitti. Ajetaan
      seuraavana testipäivänä.

## Ei tässä

- Teknologiapuun sisältö tai tasapaino — `BRDC-TECH-001`.
- Uusi rakennusvalikko. Se on olemassa; tämä tiketti tekee siitä löydettävän.
