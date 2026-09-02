# BRDC-EVENT-002 — Heksaan astuminen arpoo tapahtuman, ja kirjasto joka kestää kävelyn

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (moottori S–M, kirjasto on kirjoitustyötä) |
| **Riippuvuudet** | BRDC-EVENT-001, BRDC-REVEAL-001, BRDC-MAP-003 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"En saanut myöskään yhtään random encounteria tai yllätystä, vaikka kuljin
pitkän matkan."*

Pitkä kävely ulkona, eikä peli sanonut kertaakaan mitään yllättävää. Anomaliat ovat
olemassa (`BRDC-EVENT-001`), mutta ne ovat harvassa ja sidottu paikkaan; kävelijälle peli
on hiljainen. Se on suoraan vastoin sitä mitä tästä halutaan:

> *"Haluan siis, että pelaaja pitää kännykkää kädessä ja odottaa että illon se plingaa."*

Ilman kohtaamisia kävely on kirjanpitoa. Kirjanpito ei saa ketään ulos ovesta toista kertaa.

## 🟢 GREEN

- [ ] **`onEnterHex`-rutiini.** Yksi puhdas funktio: uusi heksa + pelaajan tila + kello →
      tapahtuma vai ei. Deterministinen hash (kuten `reveal.ts`, `anomaly.ts`), **ei
      `Math.random()`** — sama heksa samana päivänä antaa saman tuloksen joka puhelimella.
- [ ] **Taajuus on suunnittelupäätös, ei sattumaa.** Kirjaa `constants.ts`:ään: perustodennäköisyys
      per uusi heksa, katto per tunti ja per päivä. Kävely ei saa muuttua ponnahdusikkunoiden
      sarjaksi, eikä olla hiljainen tunti.
- [ ] **Kerran päivässä oma heittonsa.** Infinite: *"Kerran päivässä ruudulla voi tapahtua
      jollain prosentilla jotain."* Erillinen päiväkohtainen arpa, joka voi laueta myös
      kävelemättä — se on se pling jota odotetaan.
- [ ] **Tapahtumakirjasto `data/encounters.json`ina**, Cthulhu-hengessä. Ei koodia: teksti,
      puhuja, valinnat, ehdot, seuraukset — sama muoto kuin `adventures.json`, sama
      `parseX`-validointi latauksessa. Aloituserä vähintään 30 kohtaamista, jaoteltuna:
      löytö · ihminen · sää ja ääni · väärä paikka · pieni valinta.
- [ ] **Paikallinen kertoo vinkin.** Osa kohtaamisista antaa vihjeen esineen tai ihmeen
      sijainnista (*"lisätään maailman ihmeet ja esim voit saada kartasta vinkkejä"*).
      Vihje on suunta ja etäisyys, ei koordinaatti.
- [ ] Kohdattu tapahtuma kirjautuu History-lokiin ja avaa Guide-sivun (`BRDC-WIKI-002`).
- [ ] Testit: taajuuskatto pitää · sama heksa sama päivä = sama tulos · kirjasto validoituu
      latauksessa · jokainen kohtaaminen päättyy johonkin.

## Ei tässä

- Liikkuvat olennot kartalla. Nämä ovat hetkiä, eivät olioita.
- Ihmeiden mekaniikka (`BRDC-WONDER-001`) — tämä vain vihjaa niistä.
