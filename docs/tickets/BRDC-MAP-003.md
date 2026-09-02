# BRDC-MAP-003 — Sumu peittää myös maaston

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-MAP-002, BRDC-REVEAL-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Fog of war antaa sinun silti nähdä mikä piilossa olevan heksan tyyppi on..
näytä silloin ohje ?, not explored tms."*

Sumu piilottaa omistajuuden mutta ei maastoa: paljastamattoman heksan ikoni kertoo yhä
onko se metsää, vettä vai vuorta. Pelaaja näkee siis kartalta mitä kannattaa vallata
kävelemättä sinne — ja koko sumun tarkoitus on juuri se, että sinne pitää kävellä.

Se on myös epärehellistä toiseen suuntaan: peli näyttää tietoa jota se väittää
piilottavansa.

## 🟢 GREEN

- [ ] **Paljastamaton heksa ei kerro maastoaan.** Ikoni on `?` (tai vastaava neutraali
      merkki), ei maastoglyfi. Väri on sumun neutraali sävy, ei maaston.
- [ ] **Se kertoo että se on tuntematon**, ei näytä tyhjältä: solupaneelissa rivi
      *"Not explored — walk here to see what it holds."* Väri ei koskaan yksin kanna
      tietoa (`claude.md` §14).
- [ ] Kerran kävelty heksa **pysyy paljastettuna**, vaikka se ei olisi omistuksessa.
      Se on muisti, ei omistajuus.
- [ ] Puhdas funktio: onko tämä solu paljastettu (`explored`), erillään siitä onko se
      omistettu tai naapuri. Testi kaikille kolmelle tilalle.
- [ ] Todennus: uusi peli, katso karttaa — mikään rengas ei paljasta maastoa ennen kävelyä.

## Ei tässä

- Paljastuskortti ja harvinaisuus (`BRDC-REVEAL-001`) — tämä tiketti vain lopettaa vuodon.
- Vartiotornin paljastus (`BRDC-BUILD-006`) rakentuu tämän päälle, ei tässä.
