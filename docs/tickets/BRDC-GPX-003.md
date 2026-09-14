# BRDC-GPX-003 — Tuonti kertoo nyt miksi maa jäi ottamatta

| | |
|---|---|
| **Alue** | `rules/growth.ts` (sääntö, ennallaan), `data/walkWriter.ts`, `geo/filter.ts`, `types/domain.ts`, `features/gpx/GpxPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `done` — 2026-09-15 (v0.5.94) |
| **Lähde** | Infinite 2026-09-15: *"importista tulleet heksat eivät tulleet mulle.. korjataan myöhemmin."* |

## 🔴 RED — ja mikä siinä oikeasti oli vialla

Raportti piti paikkansa: tuodusta `.gpx`-tiedostosta ei tullut yhtään heksaa.

**Mutta sääntö ei ollut rikki.** `growInto` (`rules/growth.ts:61`) vaatii, että jokainen
otettu solu koskettaa maata jota pelaaja jo omistaa — ainoa poikkeus on ensimmäinen solu
koskaan, ja fix pitkän katkon jälkeen. Kommentti sanoo miksi: *"a bad fix cannot found a
second colony halfway across town."* Tuonnilla **ei ole omaa valtauspolkua**
(`useGpxImport.ts`in oma docstring): se syöttää pisteet samaan `submitTrail`iin kuin elävä
GPS. Muualla nauhoitettu lenkki ei siis kosketa mitään mitä pelaaja omistaa — eikä ota
mitään. Juuri niin kuin on tarkoitus.

**Vialla oli se, mitä peli kertoi.** Paneeli lupasi yläreunassa *"the same ground is
taken"*, raportoi sitten **"38 points read · 38 walked · 1 240 m"** — jossa "walked"
tarkoittaa suodattimien hyväksymiä pisteitä, ei otettua maata — ja vaikeni lopusta:
`NewLands` palauttaa `null` tyhjällä listalla (`NewLands.tsx:102`). `growInto` tuottaa
`skipped: 'not-adjacent'`, mutta se pysähtyi `WalkStep`iin: `recordWalk` suodattaa
`outcome === null` pois, joten syy ei koskaan päässyt `TrailResult`iin asti.

Pelaaja luki "38 walked", näki nolla uutta heksaa, eikä saanut riviäkään selitystä. Se on
tismalleen sama vika kuin paneelin oma docstring sanoo haluavansa välttää: *"a track that
half-lands with no explanation is the kind of thing a player decides is broken."*

## 🟢 GREEN

- [x] **Sääntöön ei kosketa.** `claude.md` §15: anti-cheatia ei heikennetä pyytämättä, ja
      adjacency on se sääntö joka estää harhafixiä perustamasta siirtokuntaa
- [x] `TrailResult.outOfReach` — **eri heksoja**, ei fixejä: sekunnin välein kirjaava
      lokki seisoo samalla saavuttamattomalla heksalla viisikymmentä kertaa, ja
      "50 out of reach" olisi vale maasta
- [x] `GpxPanel` sanoo sen, ja sanoo säännön: *"Ground has to touch ground you already
      hold — the same rule your own feet follow, and what stops a stray fix founding a
      realm across town. A track that passes your own ground takes everything along it."*
- [x] Väri on `--accent-warm`, ei `--danger`: mikään ei epäonnistunut, sääntö päti
- [x] Portti: `lint:lines`, `tsc -b`, **1371** vitest (+4), `pnpm build`, e2e `gpx.spec.ts`

## Todennus

`gpx.repo.test.ts` +4, kirjoitettu raportin ympärille: sama kahdeksan pisteen lenkki
kahden kilometrin päässä valtakunnasta **ei ota mitään**, raportoi `outOfReach > 0`
hiljaisuuden sijaan, laskee **heksoja eikä fixejä**, ja on nolla kun lenkki alkaa omalta
maalta. Vanha testi ei ollut väärässä — se vain kävelee kotoa, eli oli vierekkäinen
ensimmäisestä askeleesta, mikä on syy ettei tämä näkynyt aiemmin.

**Todennettu rikkomalla:** heksalaskenta vaihdettuna fix-laskennaksi → *"counts hexes, not
fixes"* punaistui, sitten palautettu.

## ⚠️ Löytyi tätä todentaessa, ei korjattu — `BRDC-GPX-004`

`gpx.spec.ts` **epäonnistuu 4/6 mobile-360-projektissa** ja menee läpi desktopilla.
Kaatumiskohta on `importTrack`in `toContainText(/\d+ walked/, { timeout: 20_000 })` — eli
tuonnin tulos ei ilmesty kahteenkymmeneen sekuntiin 360 px:n emuloinnissa. Todennettu
`git stash`illa: **täsmälleen sama neljä kaatuu muuttamattomalla koodilla**, joten se ei
ole tämän tiketin aiheuttama.

Tämä ansaitsee oman tikettinsä eikä alaviitettä: `claude.md` §19 sanoo *"Run the 360px
mobile viewport first, not last"*, ja peli on mobiilipeli. Joko tuonti on oikeasti hidas
tai rikki puhelinkokoluokassa, tai speksi on epäluotettava juuri siellä missä sen pitäisi
olla luotettavin — kumpi tahansa on vastaus joka pitää tietää.

## Ei tässä

- **Tuonnin oma valtauspolku** (tuotu lenkki perustaisi maata mihin tahansa). Se olisi
  sääntömuutos, ei korjaus — ja se tekisi tuonnista tavan ohittaa koko adjacency-säännön.
  Jos peli sitä joskus haluaa, se on oma tikettinsä ja Infiniten päätös
- **Sama rivi elävälle kävelylle.** `outOfReach` on nyt jokaisessa `TrailResult`issa,
  myös elävän GPS:n, mutta HUD ei näytä sitä vielä. Kävelijä huomaa asian eri tavalla
  kuin tiedoston tuoja — hän näkee kartan — joten se odottaa kenttäraporttia
