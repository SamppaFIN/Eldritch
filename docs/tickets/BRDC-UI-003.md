# BRDC-UI-003 — Auditointi: jokainen nappi jokaisella pinnalla

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-UI-002 (`shortNote`, `shortOf`) |
| **Status** | `done` — 2026-09-10 (v0.5.63) |
| **Valmius** | 100 % — portti vihreä, desktop `opening` 7/7, mobile-360 axe 8/8 |
| **Lähde** | Infinite 2026-09-10: *"ok, jatketaan.. mikäs olis hyvä kohta?"* — ja tämän session neljä kenttävikaa, joista yksikään ei löytynyt tikettejä lukemalla |

## 🔴 RED

**Korjasin kolme mykkää nappia ja jätin loput arvaamatta montako niitä on.**

`BRDC-UI-002` korjasi Wardin, Consecraten ja Expandin, koska Infinite nimesi ne. Se on
vikaraportin mittainen korjaus, ei vian mittainen. Joten ajoin pelin ja **listasin joka
napin joka pinnalta**: HUD, ruutukortti, Keepin kolme välilehteä, Research, You.

Kaksi löytöä, ja ensimmäinen on nolo:

### 1. Research oli listalla jonka Infinite nimesi — ja minä ohitin sen

*"reveal ground, **tutki**, osta"*. Kolme teknologiaa oli harmaana hintansa kanssa
(`20 wisdom`), ja ainoa vihje oli ennuste pienellä otsikon vieressä (`· ~4 h`). Kumpikaan
ei sano sitä mitä nappi torjuu: **että viisautta on nolla kahdestakymmenestä.**

### 2. Keep ei sulkeutunut ESC:llä

Auditointi paljasti sen vahingossa: Research- ja You-osiot listasivat Keepin napit
(`Banner`, `Collect`, `MANA`, `BUILDINGS`, `The Wager`). Keep oli yhä auki niiden takana.

`HelpPanel`, `LogPanel`, `CharacterPanel` ja `CodexPanel` kasvattivat kukin oman
kuuntelijansa; **kaksi eniten avattua arkkia — ruutukortti ja Keep — eivät saaneet
sellaista koskaan.** Se on näppäimistöansa (claude.md §14, WCAG 2.2) ja kasa kontrolleja
jotka kuuluvat paneeliin josta pelaaja luuli lähteneensä.

## 🟢 GREEN

- [x] **`useEscape(active, onClose)`** — jaettu hookki, ei viidettä kopiota. `onClose`
      luetaan refin läpi, joten kutsuja joka antaa uuden nuolifunktion joka renderillä ei
      sido kuuntelijaa uudestaan joka framella. *Sama virheluokka joka teki
      `BRDC-ECON-009`:n silmukan.*
- [x] **ESC sulkee Keepin ja ruutukortin.**
- [x] **Research kertoo vajeen:** *"Short 20 wisdom."* napin vieressä. Ennuste jää
      otsikon viereen — se vastaa eri kysymykseen (*milloin*, ei *paljonko*).
- [x] **Kolme jäljellä ollutta porttia sai syynsä** (UI-002:n "Ei tässä" suljettu):
      `AnomalyPanel`in Investigate, Keepin *Light the Altar*, Keepin temppelilaajennus.
      Kaikki `shortNote(shortOf(...))`, yksi rivi kussakin.
- [x] Jäljelle jääneet harmaat napit **kaikki kertovat syynsä**: Riitit sanoivat sen jo
      (*"Locked — study Astronomy at its temple"*), muut sanovat sen nyt.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1113**) + `pnpm build` vihreä.
- [x] e2e `opening.spec.ts` +3, desktop **7/7**: Research sanoo `Short N wisdom` ·
      **ESC sulkee Keepin** · ESC sulkee ruutukortin.
- [x] mobile-360 `standards.spec.ts` (axe, WCAG 2.2 AA) 8/8.
- [x] **Auditointi ajettu uudestaan korjausten jälkeen**, ja se on se todennus joka
      merkitsee: Research ja You eivät enää listaa Keepin nappeja, eikä konsolissa ole
      virheitä.
- [x] Matkalla tuli **React #310** (hookki ehdollisen `return`in jälkeen `CellPanel`issa).
      Auditointi nappasi sen heti `pageerror`ina; hookki siirrettiin `if (!cell) return
      null`in yläpuolelle ja `active`-lippu kantaa ehdon.
- [ ] Kenttä: ESC ja Research puhelimella. *(Infinite ajaa.)*

## Miksi auditointi eikä seuraava ominaisuus

Tässä sessiossa löytyi neljä kenttävikaa — `GEO-001`, `REVEAL-002`, `ECON-009`, `UI-002` —
eikä yksikään niistä löytynyt tikettejä lukemalla. Kaikki löytyivät **ajamalla peliä ja
katsomalla mitä se tekee.** Kaksi niistä oli sellaisia joista oli olemassa läpimenevä
testi, joka kuvasi vian sopimukseksi.

Kun kolme vikaa peräkkäin on samaa muotoa, seuraavaa ei kannata odottaa raporttina.
Auditointi kesti kaksikymmentä minuuttia ja löysi kaksi lisää, joista toisen olin itse
juuri jättänyt tekemättä.

## Ei tässä

- **Fokusansa ja fokuksen palautus** arkeille. ESC on niistä kolmesta se joka puuttui
  kokonaan; loput kaksi ovat `BRDC-UI-001`in jaetun arkkipohjan työtä, jossa ne tehdään
  kerran kaikille eikä viidesti erikseen.
- **Wagerin, Guiden ja Changelogin napit.** Auditointi ei käynyt niitä läpi — se avasi
  ne pinnat joilla pelataan. Sama skripti laajenee niihin kun ne ovat vuorossa.
