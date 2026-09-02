# BRDC-QUEST-003 — Seikkailu etenee vain sillä heksalla jolla se tapahtuu

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-QUEST-002 |
| **Status** | `done` — 2026-09-02 (v0.5.9), kenttätodennus `[~]` |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"seikkailua voi edistää vain olemalla seikkailun aloitusheksalla ja niin
edelleen, nyt pystyin menemään koko seikkailudialogin läpi käymättä seuraavassa kohdassa."*

`BRDC-QUEST-002` lupaa juuri tämän — *"jokainen etappi on toiminto sillä heksalla"* — ja
se on merkitty `done` 100 %. Lupaus ei pidä.

Syy on luettavissa koodista: `questCellInfo(h3, …)` saa **valitun** heksan, ei sitä jolla
pelaaja seisoo. `MapView` antaa sille `inspect.selected`, ja kartalla voi napauttaa mitä
tahansa heksaa mistä tahansa. Kun `site === STAGE_SITE[stageId]`, se palauttaa
`canAct: true` — riippumatta siitä missä pelaaja on. Koko tarinan voi siis klikata läpi
sohvalta.

Tämä on kävelypelin ydinlupaus. Jos sen voi ohittaa napauttamalla karttaa, ei tästä
mekaniikasta jää mitään jäljelle.

## 🟢 GREEN

- [x] **`canAct` vaatii että pelaaja on heksalla.** `questCellInfo(h3, fuming, finds,
      standingOn = h3)` — `canAct` tosi vain kun `h3 === standingOn` *ja* etappi on
      toiminnallinen. `useFumingLake` antaa `standingOn`in (jonka DWELL-002 teki
      sticky-vakaaksi). Oletus `= h3` pitää olemassa olevat `questCell.test.ts`-tapaukset
      vihreinä.
- [x] **Etäältä katsottu etappi kertoo mitä tehdä** — `history`-rivi *"Walk here to take
      this step."* / *"Walk to the statue to begin."*; `label` näkyy maamerkkinä, ei
      nappina (`claude.md` §14).
- [x] **Aloitus:** `fuming-lake` alkaa vain patsaan heksalla seisten — `questCellInfo`n
      "Begin"-haara **ja** `openQuestHex`in `h3 === standingOn` -vartija.
- [x] **Jälkikäteen kävely pois:** dialogi jää luettavaksi, mutta valinnat lukkiutuvat.
      `atStageHex(fuming, standingOn)` (uusi puhdas funktio), `AdventureDialog` saa
      `onHex`-propin → `disabled` + rivi *"Walk to where this happens to choose."*
- [x] Testit `questCell.test.ts`: eri `standingOn` → `canAct: false` + oikea history;
      `atStageHex` true/false/loop/available/undefined. 855 vihreää.
- [~] **Kenttätodennus:** avaa dialogi patsaalla, kävele järvelle, avaa siellä; sohvalta
      ei pääse eteenpäin. Ajetaan seuraavana testipäivänä.

## Ei tässä

- GPS-tarkkuuden sietokyky heksan reunalla. Jos kentällä osoittautuu, että seisova
  pelaaja pomppii kahden heksan välillä, se on oma tikettinsä (vrt. `BRDC-DWELL-002`).
- Simulaatiotila desktopilla saa yhä kävellä WASD:lla heksalle — se *on* heksalla olemista.
