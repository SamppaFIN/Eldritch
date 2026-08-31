# BRDC-TECH-001 — Teknologiapuu ja aikakaudet

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-ECON-001 |
| **Status** | `in_progress` — puu, säännöt ja repo-mekanismi tehty; tutkimusnäyttö + aikakausiseremonia `BUILD-001`:n kanssa |
| **Valmius** | 80 % |
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
- [~] Aikakauden vaihtuminen **tapahtumana** — data on paikallaan (`researchTech` palauttaa
      `era`, `eraChanged`), mutta UI:ssa ei ole vielä tutkimustoimintoa josta se laukeaa.
      Kytketään `BRDC-BUILD-001`:n tutkimusnäyttöön
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
