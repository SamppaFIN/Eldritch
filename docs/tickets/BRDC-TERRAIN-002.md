# BRDC-TERRAIN-002 — Maastokirjo: neljästä yhdeksään, ja oikea data tiilistä

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001, BRDC-ECON-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.2, §5 |

## 🔴 RED

`TerrainKind` on `water | forest | market | plain`. Kehityssuunnitelma sijoittaa
rakennuksia **vuorille, mäille, rannikolle, tasangolle ja järville**, ja ihmeitä
lisäksi **valtamerelle, tundralle ja aavikolle**. Kaivosta ei voi rakentaa vuorelle,
jota ei ole olemassa.

Ja `BRDC-TERRAIN-001` sanoi itsestään suoraan, ettei se ole oikeaa maastoa:

> *"The data source here is a placeholder and that is said out loud."*

Nyt maasto ratkaisee, mitä pelaaja voi rakentaa siihen paikkaan jossa hän oikeasti asuu.
Hash-arvonta kelpasi silloin, kun se päätti onko solu +10 puuta vai ei. Se ei kelpaa
enää, kun se päättää onko kotikadullasi vuori.

## 🟢 GREEN

- [ ] `TerrainKind` kattaa suunnitelman maastot: metsä, vuori, mäki, tasanko, järvi,
      rannikko, tori, ja se mitä §5 vaatii ihmeille
- [ ] Jokaisella maastolla on **resurssi ja rakennuspaikat**, ja ne on yhdessä taulukossa
- [ ] **Oikea maasto ladatuista vektoritiilistä**: `queryRenderedFeatures` lukee veden,
      puiston, rakennukset ja maankäytön kartalta, joka on jo ruudulla
- [ ] Solukohtainen ratkaisu **tehdään kerran ja tallennetaan** — sama solu ei saa
      vastata eri tavalla eri zoom-tasolla
- [ ] Hash jää **varajärjestelmäksi** sinne, missä tiilillä ei ole mitään sanottavaa
- [ ] Ratkaistun ja arvatun maaston ero **näkyy datassa** (`source: 'tiles' | 'hash'`) —
      Vaiheessa 3 SQL:n on tiedettävä kumpaa se vertaa
- [ ] Klusterointi säilyy: maasto muodostaa metsiä ja järviä, ei solukohtaista kohinaa

## Toteutus

Tämä on **`BRDC-TERRAIN-001`:n oma lupaus lunastettuna** — `PIVOT-2026-08-27.md` §3.1
kirjoitti sen jo auki: rajapinta `terrainOf(h3) → Terrain` pysyy, toteutus vaihtuu.
Vektoritiilet ovat oikeaa OSM-dataa ilman uutta rajapintaa, ilman avainta ja ilman
verkkopyyntöä — ne ovat jo ladattu, koska kartta piirretään niistä.

`queryRenderedFeatures` vastaa vain siitä, mikä on ruudulla juuri nyt. Siksi maasto
ratkaistaan **sitä mukaa kun pelaaja liikkuu** ja tallennetaan; ratkaisematon solu on
laillinen tila, ei virhe.

## 🔴 Ratkaistava: maastoa, jota ei ole missään lähellä

`BRDC-WARD-001` oppi tämän jo kerran, ja sen dokumentaatio kertoo miten:

> *"a test walked a real neighbourhood and found no lake within 750 m of it — and that
> is most neighbourhoods. A cost that demands terrain the player has no way to acquire
> is not a difficulty curve, it is a locked door."*

Suunnitelma toistaa saman virheen isompana. **Tampereella ei ole valtamerta, tundraa
eikä aavikkoa.** Ne ovat kolmen ihmeen ainoa sijainti (`R'lyeh`, `Hyperborea`,
`The Nameless City`) — eli kolme viidestä legendaarisesta ihmeestä olisi
saavuttamattomissa sille pelaajalle, jolle peli rakennetaan.

Kaksi kelvollista ratkaisua:

1. **Vastineet.** Iso järvi ajaa valtameren virkaa, suo tundran, sorakuoppa aavikon.
   Lovecraftilaisesti perusteltavissa: Fuming Lake on jo Tampereella
2. **Ihmeet eivät sido maastoa** vaan harvinaisuutta — maasto sävyttää nimen, ei estä

Suositus: **1**, ja kirjataan `BRDC-WONDER-001`:een.

## Ei tässä

- Overpass tai Google Places. Molemmat vaativat backendin tai avaimen; vektoritiilet
  eivät. Vasta jos tiilet eivät riitä (`PIVOT-2026-08-27.md` §3.1, kolmas rivi)
- Korkeusdata. "Vuori" ja "mäki" ratkaistaan OSM:n `natural`- ja `landuse`-tageista,
  ei korkeusmallista, jota ei ole tiilissä
