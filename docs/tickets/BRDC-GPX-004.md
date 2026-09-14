# BRDC-GPX-004 — Tuonti ei tule perille 360 px:llä

| | |
|---|---|
| **Alue** | `e2e/gpx.spec.ts`, `features/gpx/GpxPanel.tsx`, `useGpxImport.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `todo` — mitattu, ei diagnosoitu |
| **Lähde** | Löytyi `BRDC-GPX-003`:a todentaessa, 2026-09-15 |

## 🔴 RED

`gpx.spec.ts` menee läpi desktopilla ja **kaatuu neljästi kuudesta `mobile-360`:ssa**.
Kaikki neljä samassa kohdassa, `importTrack`in sisällä:

```
await expect(panel).toContainText(/\d+ walked/, { timeout: 20_000 });
```

Eli tiedosto valitaan, mutta tuonnin tulosrivi ei ilmesty kahteenkymmeneen sekuntiin
360 px:n emuloinnissa. Desktopilla sama tuonti valmistuu sekunneissa.

Mitattu, ei arvattu: sama neljä kaatuu identtisesti myös muuttamattomalla koodilla
(`git stash`), joten se ei liity `BRDC-GPX-003`:n muutoksiin eikä ole uusi.

## Miksi tämä ei ole alaviite

`claude.md` §19: *"Run the 360px mobile viewport first, not last. v2:n mobiililayout oli
P0-bugi mobiilipelissä."* Tämä peli **on** mobiilipeli, ja tuonti on ominaisuus jonka
Infinite pyysi. Kaksi mahdollista totuutta, molemmat tärkeitä tietää:

1. **Tuonti on oikeasti rikki tai hidas puhelinkokoluokassa** — silloin kukaan ei ole
   voinut käyttää sitä puhelimella, ja se on P0
2. **Speksi on epäluotettava juuri 360 px:llä** — silloin portti valehtelee siellä missä
   sen pitäisi olla tiukin, ja jokainen tuleva mobiiliajo on kohinaa

## Ensin katsottava

- Kaatuuko se tiedoston lukemiseen, `submitTrail`iin vai renderöintiin? `state.status`
  on `'reading'` → `'done'`; kumpaan se jää?
- Onko `mobile-360`-projektin hitaus (Pixel 5 -emulointi, 360×780) vs. 20 s aito raja
  vai vain tiukka?
- Häiritseekö `BRDC-TUTOR-004`in "unlock"-dialogi tässäkin, kuten se häiritsee kolmea
  muuta speksiä?
