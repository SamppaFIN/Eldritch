# BRDC-HEARTH-001 — Seikkailu alkaa siitä että pelaaja hyväksyy kotipesänsä

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GROW-001, BRDC-DWELL-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten pyyntö 2026-08-28 |

## 🔴 RED

Peli alkaa tyhjästä. Painat "Begin the Awakening" ja päädyt kartalle jolla ei ole
mitään sinun — ensimmäinen ruutu tulee vasta kun kävelet. Mikään ei kysy mitään,
mikään ei ole *sinun* ennen kuin sattumalta on.

Ja sijainti otetaan kertakysymyksellä (`getCurrentPosition`). Selaimen ensimmäinen fix
tulee tukiasemasta tai wifistä: se on vakaa, itsevarma ja väärässä kilometrillä. Sillä
tarkkuudella jaettu kotipesä on väärässä paikassa pysyvästi.

## 🟢 GREEN

- [x] Aloitus on **hyväksyntä**: "tämä maa on minun" siinä missä pelaaja seisoo
- [x] Nappi on **estetty** kunnes puhelin oikeasti tietää missä ollaan
- [x] Kaksi ehtoa, ei yhtä: **tarkkuus** (laitteen väite) ja **hajonta** (mitä se on
      osoittanut) — laite voi raportoida ±8 m fixien heilahdellessa 40 m
- [x] Paras fix voittaa, ei uusin: satelliitin menetys ei siirrä pelaajaa
- [x] Ruudulla näkyy mitä tapahtuu: tarkkuus, hajonta, fixien määrä
- [x] 40 s jälkeen tarjotaan ulospääsy — sisätiloissa taivas ei koskaan tarkennu
- [x] Hyväksytty ruutu **valtautuu heti** ja pitää Ankkurikiveä
- [x] `placesWithHome`: dwell voi paljastaa temppeleitä, muttei viedä Ankkuria
- [x] Reset unohtaa kotipesän; paluu peliin ei kysy uudestaan
- [x] Puhdas `assess` testattu ilman selainta (7 testiä), repositorio erikseen (7)

## Toteutus

Näin liikuntasovellukset tekevät sen: ne eivät luota ensimmäiseen fixiin vaan
katsovat miten fixit käyttäytyvät ensimmäisen puolen minuutin aikana, ja kieltäytyvät
aloittamasta ennen kuin ne lakkaavat liikkumasta.

| Taso | Raja | Merkitys |
|---|---:|---|
| `sharp` | ≤ 10 m | GPS on lukittunut |
| `usable` | ≤ 25 m | riittää ruudun jakamiseen |
| `coarse` | > 25 m | tukiasema tai wifi — ei kelpaa |

Lukitus vaatii **sekä** tason `usable`/`sharp` **että** neljän tuoreen fixin
keskinäisen hajonnan ≤ 20 m.

Ankkurikivi on nyt **sovittu, ei löydetty**. Se on tietoinen muutos DWELL-001:een:
pitkä iltapäivä kahvilassa ei saa viedä titteliä paikalta josta pelaaja suostui
aloittamaan. Temppelit paljastuvat yhä ajasta.

## Ei tässä

- Kotipesän siirto pelin sisältä. `setHome` osaa sen; käyttöliittymässä sitä ei ole.
- Mitä kotipesä *antaa* rakentamisessa — `BRDC-TERRAIN-001`.
