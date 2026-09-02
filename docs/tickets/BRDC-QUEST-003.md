# BRDC-QUEST-003 — Seikkailu etenee vain sillä heksalla jolla se tapahtuu

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-QUEST-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
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

- [ ] **`canAct` vaatii että pelaaja on heksalla.** `questCellInfo` saa `standingOn`-tiedon
      ja `canAct` on tosi vain kun `site === here && selected === standingOn`.
      `MapView`illa on `standingOn` jo valmiina.
- [ ] **Etäältä katsottu etappi kertoo miksi se ei aukea** — ei harmaa nappi ilman syytä,
      vaan rivi tyyliin *"Olet liian kaukana — kävele tänne."* (`claude.md` §14: virheet
      kertovat mitä tehdä, ei mikä meni rikki.)
- [ ] Sama sääntö koskee **aloitusta**: `fuming-lake` alkaa vain patsaan heksalla seisten.
- [ ] Testi `questCell.test.ts`:ään: sama etappi, sama vaihe, `standingOn` eri heksa →
      `canAct: false`; `standingOn` sama heksa → `canAct: true`.
- [ ] Todennus kentällä: avaa dialogi patsaalla, kävele järvelle, avaa siellä. Sohvalta
      ei pääse eteenpäin.

## Ei tässä

- GPS-tarkkuuden sietokyky heksan reunalla. Jos kentällä osoittautuu, että seisova
  pelaaja pomppii kahden heksan välillä, se on oma tikettinsä (vrt. `BRDC-DWELL-002`).
- Simulaatiotila desktopilla saa yhä kävellä WASD:lla heksalle — se *on* heksalla olemista.
