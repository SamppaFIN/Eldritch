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

## Korjattu jälkikäteen — 2026-08-28

Kuvakaappaus pelistä: tyhjä kartta, 0 vallattua ruutua, eikä kotipesää kysytty.

`App`:n paluulogiikka vei suoraan kartalle heti kun `session` löytyi tallennuksesta.
Kuka tahansa jolla oli sessio *ennen kuin* kotipesä oli olemassa ei siis koskaan
ehtinyt hyväksyä sellaista — täsmälleen se vanha kokemus jonka tämä tiketti poisti.
Paluu tarkistaa nyt kotipesämerkin, ei pelkkää sessiota.

## Korjattu jälkikäteen — 2026-08-28 (toinen)

Kuvakaappaus: **Waiting for the ground…**, ±87 m, Agreement —, Fixes 2. Jumissa.

Työpöytäselain antaa sijainnin wifistä: ±87 m, kaksi fixiä, sitten hiljaisuus.
Vakausikkuna (4 fixiä) ei täyty koskaan, joten `ready` ei voi muuttua todeksi eikä
mikään muukaan enää muutu. Ulospääsy 30 s jälkeen oli olemassa — mutta nappi **säilytti
tekstin "Waiting for the ground…"** vaikka se aktivoitui, mikä on käyttäjälle sama asia
kuin ettei se aktivoituisi.

- Napin teksti kertoo nyt mitä se tekee: `Accept this ground · ±87 m`
- Odottaessa näkyy kauanko: "You can accept a rougher fix in 12 s"
- Jos yhtään fixiä ei tule, ruutu neuvoo sijaintiluvat ja avoimen taivaan — nappia ei
  ole, koska mitään ei ole hyväksyttävissä
- Päätös irrotettiin puhtaaksi funktioksi `acceptance()` ja juuri tämä wifi-tapaus on
  nyt regressiotesti

Samalla konsolin 404: `/favicon.ico`. Sivulla ei ollut kuvaketta lainkaan. Nyt on
SVG-sigil (heksa, sisäheksa, piste) joka kestää 16 pikseliä, ja se on myös manifestin
ikoni — kotivalikkoon lisääminen ulkotestiä varten toimii nyt.
