# BRDC-TUTOR-001 — Asteittainen opetus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-REVEAL-001, BRDC-WIKI-001 |
| **Status** | `done` — 2026-09-11 (v0.5.74) |
| **Valmius** | 100 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §3; priorisoitu 2026-09-06 |

## 🔴 RED

`FirstLook.tsx` opettaa ensimmäisen hetken ja sitten vaikenee. Kun tähän suunnitelmaan
tulee kymmenen resurssia, kuusitoista rakennusta, teknologiapuu, neljä loitsukoulukuntaa,
kaupunkivaltiot ja kaksitoista ihmettä, **vaikeneminen on sama kuin ei julkaisisi peliä**.

Ja tämä on ulkopeli: opetus luetaan kävellessä, kirkkaassa valossa, yhdellä peukalolla.
Kaikkea ei voi kertoa alussa, koska alussa ollaan menossa ulos.

> **Priorisoitu 2026-09-06 (Infinite):** *"Onboarding tehdään kans prioriteetilla."*
> Nousee Vaihe 3:n alkupäähän — sisältökerrosta (kaupungit, ihmeet, kauppa) ei rakenneta
> opetuksen varaan jota ei ole. Ajoittuu `BRDC-DETAIL-001`:n rinnalle: molemmat ovat
> "tieto perille käyttäjälle" -työtä.

## 🟢 GREEN

- [x] Kuusi mekaniikkaa avautuu kynnyksillä, **suunnitelman §3 järjestyksessä**.
      Luvut siirretty: taulukko kirjoitettiin ennen kuin Hearth alkoi luovuttaa koko
      seitsemän solun renkaan, joten "1./3./5. heksa" lasketaan nyt renkaan **yli**
      kävellyistä (`walked`). Muuten kolme oppituntia laukeaisi ensimmäisenä sekuntina
- [x] `siege` vaatii kävellyn heksan **ja** rivaalin maata näkyvissä. Pelkkä rivaalin maa
      ei riitä: mock-maailma siementää naapurit, joten valloitus opetettiin heti
      perustamisessa. `tutor.spec` nappasi tämän
- [x] Avautuminen on **tapahtuma**: elämänkukan siemen SVG:nä, `stroke-dasharray`illa
      piirtyvä, ympyrä kerrallaan (§12). Ei videota — se olisi lataus ja rasteri
- [x] **Palkinto:** `UNLOCK_REWARD` = 10 viisautta, maksettuna napin tekstissä lukien.
      Viisaus siksi, että mikään maasto ei tuota sitä, joten lahja oikeasti liikuttaa sitä
- [x] Linkki wikiin viidellä kuudesta. `neighbours` on null: kaupunkivaltioista ei ole
      sivua, ja linkki tyhjään olisi huonompi kuin ei linkkiä — se aukko on `BRDC-WIKI-001`:n
- [x] **"Not now"** ohittaa maksamatta, ja oppitunti palaa seuraavalla kävelyllä.
      ESC tekee saman. Vain nappi merkitsee opituksi
- [x] **Ei keskeytä:** odottaa että vauhti laskee (`QUIET_SPEED_MS` = 1 m/s) **ja** että
      kartta on tyhjä — ei minkään paneelin päälle
- [x] Taustaverho **päästää napautukset läpi**; vain kortti ottaa niitä
- [x] Edistyminen on `K.unlocksSeen` ja häviää resetissä
- [x] Kynnyslogiikka on puhdas funktio ilman selainta: 14 testiä `rules/unlock.test.ts`,
      6 maksun idempotenssista `data/unlock.repo.test.ts`, 3 e2e `tutor.spec.ts`

## Toteutus

**Kynnykset lasketaan tilasta, ei tapahtumista.** "Kolmas heksa" on kysymys, jonka
`getOwnedCells().length` vastaa milloin tahansa; tapahtumapohjainen laskuri hukkaa
tilanteen, jossa kolme heksaa tuli yhdessä lenkissä. Tämä on sama juurisyy kuin
`BRDC-REGRESSION-000` #3:ssa (v2:n boot-race) — johdettu tila kestää, emittoitu ei.

Suunnitelma lupaa *"lyhyt, tyylikäs opetusvideo/kuva"*. **Videoita ei tehdä.**
`claude.md` §12 antaa paremman ja halvemman keinon: pyhä geometria SVG:nä,
animoituna `stroke-dasharray`illa. Se on kevyt, terävä joka koossa ja jo tyyliä.

## Todennus

- `pnpm test` 1240, `tsc -b`, `check-line-limit`, `pnpm build` — vihreä
- desktop `map` + `tutor` 17/17, `opening` + `guide` + `tutor` 13/13,
  mobile-360 `standards` 8/8 (kosketuskoot, fokus, 200 % zoom, CLS, CWV)
- **Kaksi vikaa löytyi ajamalla, ei lukemalla.** Molemmat on kuvattu GREENissä:
  koko ruudun verho söi Build-napin (`opening.spec`, `guide.spec`), ja `siege` opetettiin
  ennen ensimmäistä askelta (`tutor.spec`)
- **Kolmas oli oma rakennevirhe.** Hookkina tämä asui `MapView`ssä, joten sen store-luku
  renderöi `MapView`in uudelleen heti bootin jälkeen — ja kamera asuu siellä.
  `map.spec`in "marker sits exactly on the camera centre" meni 2,5 px yli 1 px:n rajan.
  Todennettu ottamalla työ pois (`git stash` → 14/14 puhdas) ja palauttamalla se:
  komponenttina jokainen sen aiheuttama render pysyy omassa alipuussaan. 17/17.

## Ei tässä

- Wikin sisältö → `BRDC-WIKI-001`
- Automaattinen wikin päivitys avautumisesta. Se on wikin puoli samaa saumaa
