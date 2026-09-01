# BRDC-TECH-001 — Teknologiapuu ja aikakaudet

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001 |
| **Status** | `done` — 2026-09-01 (tutkimusnäyttö Hearth-paneelissa, `[~]` selaimessa todentamatta) |
| **Valmius** | 95 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1 (Avausteknologia-sarake), §2.1, §2.2 |

## 🔴 RED

Suunnitelman jokaisessa rakennustaulukossa on sarake **Avausteknologia** — Varhainen
maanviljely, Metsätalous, Kaivostekniikka, Linnoitustekniikka, Merenkulku. Yhtäkään
niistä ei ole olemassa. Ilman puuta kaikki 16 rakennusta ovat auki ensimmäisestä
minuutista, eikä pelissä ole mitään opittavaa.

Ja `claude.md` §10 rajaa tason 20:een hyvästä syystä (v2:n taso 118 korruptoi tallennuksen).
Taso on tällä hetkellä ainoa etenemisen mitta, ja se mittaa vain XP:tä.

## 🟢 GREEN

- [x] **`TECHS`-taulukko**: tunnus, hinta viisaudessa, edeltäjät, aikakausi (`rules/tech.ts`,
      10 teknologiaa, haarautuva DAG — ei `unlocks`-kenttää, ks. seuraava kohta)
- [x] Teknologia maksaa **viisautta** — `research(researched, id, pool)` maksaa
      `terrain.ts#spend`:llä, `researchWith` (`pouch.ts`, `wardWith`:n pari) siirtää
      viisauden storessa. Toinen etenemisakseli
- [x] Puu on **DAG ja testataan** — `tech.test.ts` ajaa DFS:n, todentaa ettei sykliä ole,
      että jokainen `requires` on olemassa ja aikakausiltaan ≤ riippuvansa
- [x] Rakennuksen avaava teknologia **ei kirjoiteta tänne** — `BUILDINGS[x].tech` on
      `BRDC-BUILD-001`:n, `hasTech(researched, id)` on valmis sen luettavaksi
- [x] **Aikakaudet johdetaan** — `eraOf(researched)` etenee vasta kun edellinen aikakausi
      on kokonaan tutkittu, ei laskuria
- [x] Aikakauden vaihtuminen **tapahtumana** — `ResearchPanel` näyttää "You have entered
      {era}" + Metatronin kuutio, kun `researchTech` palauttaa ei-null `era`n. `[~]` selain
- [x] Puu **katettu** — `ERAS` päättyy `medieval`:iin, `eraOf` ei etene sen yli
- [x] Lukitun rakennuksen paneeli nimeää avaavan teknologian — tehty `BRDC-BUILD-001`:n
      committi 3:ssa: `BuildPanel.reason('locked', id)` → `Needs ${titleCase(BUILDINGS[id].tech)}`

## Toteutettu 2026-08-31

- `rules/tech.ts`: `Era`/`ERAS`, `TechId` (10), `TECHS`, `hasTech`, `canResearch`,
  `researchable`, `research`, `eraOf`, `eraChanged`. Malli `ward.ts`:stä — puhdas,
  `{ ok } | { refused }`, ei `now`:ta.
- `data/pouch.ts`: `researchWith` `wardWith`:n rinnalle. `data/techStore.ts` (uusi):
  `readResearched` + `researchTech` — omistaa `K.researched`-listan ja aikakausirajan,
  jotta `MockRepository` ei kasva neljättä verbiä sisäänsä (jäi 390 riviin).
- `GameRepository`: `getResearched`, `researchTech(id, now) → TechResult` (`era: Era | null`).
- Testit: `tech.test.ts` (13, DAG-portti mukana), `tech.repo.test.ts` (6). **514 vihreää.**
- **Ei UI:ta** — tutkimusnäyttö ja seremonia landaavat `BUILD-001`:n kanssa, koska siellä
  pelaaja näkee lukitun rakennuksen.

## Tutkimusnäyttö 2026-09-01

Tutkimus on läänin­laajuinen toiminto, joten se asuu **Hearth-paneelissa** ("mitä olen
oppinut", ei "mitä on jalkojeni alla").

- `ResearchPanel.tsx` (peili `SpellPanel`/`TradeControls`:lle): nykyinen aikakausi +
  `researched.length/10`, `researchable(researched)`-rintama riveinä (`researchCost`
  viisaudessa, nappi disabloitu jos wisdom ei riitä), aikakausi-ilmoitus + Metatronin
  kuutio kun `onResearch` palauttaa `era`n. Kiellot nimeltä.
- `useSelection`: `research`-bindaus (`era`, `options`, `lastEra`, `onResearch`).
- **`useSelection` ylitti 400 riviä** → kauppareitti­logiikka omaan hookkiinsa
  `useTradeRoutes.ts` (`interceptTap` antaa napautuksen linkitystilassa hookille).
  `useSelection` 382, uusi hook 89.
- `HearthPanel` + `MapView`. **636 vihreää.**

## Toteutus

Puu on dataa, ja **`canBuild` kysyy siltä yhden kysymyksen**. Se on ainoa kytkös
`BRDC-BUILD-001`:een, ja siksi nämä kaksi voidaan tehdä kummassa järjestyksessä
tahansa: ilman puuta `hasTech` palauttaa aina `true`.

Humankindin **erikoistuminen** (kauppias, soturi, tutkija) on sama taulukko eri
juurella. Sitä ei rakenneta nyt, mutta puun muoto ei saa estää sitä — yksi juuri
per haara, ei yhtä lineaarista listaa.

## Ei tässä

- Kulttuurillinen erikoistuminen valintana. Rakenne sallii sen, tiketti ei toteuta
- Tutkimusloitsu, joka nopeuttaa puuta → `BRDC-SPELL-001`
