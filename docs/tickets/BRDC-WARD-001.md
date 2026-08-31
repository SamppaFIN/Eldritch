# BRDC-WARD-001 — Resurssien ensimmäinen käyttö: solun vahvistaminen

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-TERRAIN-001, BRDC-CLAIM-004 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | `BRDC-TERRAIN-001` viimeinen GREEN-kohta |

## 🔴 RED

Resurssit kertyivät eivätkä tehneet mitään. Ainoa tapa pitää solu oli kävellä sinne —
mikä on oikein pelin **selkärankana** ja kurjaa sen ainoana verbinä. Ja heksan
napauttaminen ei tehnyt mitään, mikä on outoa kartalla joka koostuu heksoista.

## 🟢 GREEN

- [x] Solun napautus avaa paneelin: maasto, omistaja, vahvuus, aika Tyhjyyteen
- [x] `ward(cell, pool, me)` — puhdas funktio, ei kelloa parametrina lainkaan
- [x] Vahvistaminen maksaa `WARD_COST` ja antaa `WARD_STRENGTH`
- [x] **Vahvistaminen ei siirrä rappeutumiskelloa** — testattu sekä puhtaana että
      tallennuksen läpi
- [x] Kieltäytymiset ovat arvoja, eivät poikkeuksia: `not-yours`, `already-full`,
      `cannot-afford` — ja käyttöliittymä kertoo mitä tehdä, ei mikä epäonnistui
- [x] Kattoon asti, ei yli; täyttä solua ei voi vahvistaa
- [x] 15 yksikkötestiä + 4 repositoriotasolla

## Toteutus

**Tämä on koko mekaniikan tasapaino:** vahvuus nousee, `lastVisitedAt` ei liiku.
Resurssit ostavat solulle *lisää aikaa*, eivät koskaan koskemattomuutta. Pelaaja joka
lakkaa kävelemästä menettää karttansa yhä — hitaammin. Kellon siirtäminen tässä
muuttaisi kävelypelin hiljaa idle-peliksi, ja se on yksittäinen muutos joka
todennäköisimmin ontoksi tämän.

**Hinta on pelkkää puuta, ja se on korjaus.** Ensimmäinen versio vaati puuta *ja* vettä.
Testi joka kävelee oikeaa naapurustoa paljasti ettei 750 metrin säteellä ollut järveä —
eikä ole useimmissa naapurustoissa. Hinta joka vaatii maastoa jota pelaaja ei voi
hankkia ei ole vaikeuskäyrä vaan lukittu ovi. Maaston monipuolisuus ansaitsee paikkansa
rakennuksissa, joissa kaivo voi vaatia vettä ja tori kultaa.

## Tiedossa oleva puute

Heksan valinta on **osoitinele, eikä sille ole näppäimistövastinetta**. `claude.md` §14
vaatii näppäimistönavigoinnin, ja tämä ei täytä sitä. Paneeli itse on esteetön kun se on
auki — fokusrengas, ESC, kosketuskohteet ≥ 44 px — mutta avaaminen ei ole.

Korjaus kuuluu siihen tikettiin joka tuo "vahvista solu jossa seison" -toiminnon
HUDiin: se on sekä näppäimistöpolku että se mitä kävelevä pelaaja oikeasti haluaa.
Ei piiloteta — kirjataan.

## Puute korjattu — 2026-08-28

Näppäimistöpolku on nyt olemassa. HUDin **⬢ Here** avaa paneelin solusta jossa pelaaja
seisoo: se on samalla se mitä kävelevä pelaaja oikeasti haluaa, yhdellä peukalolla
karttaa katsomatta. Paneeli ottaa fokuksen auetessaan — ei fokusansaa, koska tämä ei ole
modaali vaan avattava paneeli.

Muiden solujen valinta on yhä osoitinele. Se on kartan luonne eikä sitä teeskennellä
korjatuksi: tärkein solu on saavutettavissa näppäimistöltä, muut eivät.

Lisäksi paneeli näyttää nyt **dwell-edistymän**: "stay longer and the ground learns you".
`revealProgress` oli kirjoitettu ja testattu `BRDC-DWELL-001`:ssä muttei koskaan
näkynyt missään — mekaniikka oli täysin näkymätön siihen asti kun se laukesi.

## Jatko — 2026-08-31

Vahvistaminen oli **ensimmäinen** tapa käyttää resursseja. Kehityssuunnitelma tuo
kuusitoista lisää (`BRDC-BUILD-001`…`-003`), ja tämä tiketti muuttuu niiden
erikoistapaukseksi — ei kilpailijaksi.

**Tämän tiketin tärkein rivi siirtyy sellaisenaan `BRDC-ECON-001`:een:**

> *"Advancing the clock here would quietly turn a walking game into an idle one, which
> is the single change most likely to hollow this out."*

Suunnitelmassa on ~20 rakennusta, ja lähes jokainen tuottaa "+X / tunti". Sama vaara,
kymmenkertaisena. `BRDC-ECON-001` lukitsee kaksi sääntöä sitä vastaan — varastokatto ja
48 tunnin lepotila — ja ne käyttävät tämän tiketin logiikkaa: resurssit ostavat aikaa,
eivät koskaan koskemattomuutta.

Ja `WARD_COST`in oppi (*"a locked door"*, ei järveä 750 metrissä) siirtyy kahteen
paikkaan, joissa se on vaarassa toistua: `BRDC-TERRAIN-002` ja `BRDC-WONDER-001`.
