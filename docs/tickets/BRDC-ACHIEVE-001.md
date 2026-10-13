# BRDC-ACHIEVE-001 — Saavutukset ja ilmoitukset

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-HEX-001, BRDC-WONDER-001 |
| **Status** | `done` — 2026-10-13: rakennettu jo BRDC-CHAR-001:n alla; tarkistettu |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §5.1, §6 (A1–A2) |

## 🔴 RED

Peli ei huomaa mitään. Ensimmäinen lenkki, ensimmäinen valtaus, ensimmäinen ihme,
sadas solu — kaikki ohitetaan samalla hiljaisuudella. Suunnitelma sanoo sen itse
esimerkissään: *"Löysit R'lyehin! Olet nyt Cthulhun palvoja."*

## 🟢 GREEN

- [~] `ACHIEVEMENTS`-taulukko: tunnus, ehto, nimi, lore-teksti — `rules/achievements.ts`: tunnus, nimi ja vihje (11 saavutusta); oma lore-teksti puuttuu, vihje kantaa sen paikan
- [x] Ehto on **puhdas predikaatti pelitilasta** — ei tapahtumakuuntelijaa. Näin
      taannehtiva saavutus laukeaa oikein, kun sääntö lisätään myöhemmin
- [x] Ansaittu saavutus **ei voi kadota** takaisin lukitsemattomaksi
- [x] Ilmoitus on hetki: pyhä geometria ja sanat, ei toast-laatikko — `MomentFx`, Metatronin kuutio
- [x] Ilmoitukset **jonottuvat eivätkä pinoudu** — kymmenen kerralla on virhetila
- [x] Ilmoitus **ei keskeytä kävelyä eikä peitä karttaa** kokonaan
- [x] Saavutukset näkyvät listana, myös ansaitsemattomat vihjeineen — You-paneeli (UX-008: ansaitut + seuraava, loput togglen takana)
- [x] Puhtaat ehdot testattuina; sama tila antaa saman tuloksen aina

## Toteutus

**Predikaatti, ei tapahtuma** — ja tässä se on halpaa: kaikki tarvittava on jo
tallennettu (`getOwnedCells`, `getPlaces`, historia `BRDC-HEX-001`:stä). Arviointi
tapahtuu luettaessa, samalla mallilla kuin rappeutuminen ja resurssien kertyminen.

Se ratkaisee myös sen ongelman, jonka tapahtumapohjainen versio tuo mukanaan viikkoa
myöhemmin: uusi saavutus lisätään taulukkoon, ja pelaaja, joka on jo täyttänyt sen
ehdon, saa sen — ei jää sitä ilman siksi, ettei kuuntelijaa ollut olemassa silloin.

## Ei tässä

- Pisteet, tasot tai rankinglista saavutuksista. Codex of Dominion on eri asia
- Jakaminen ulos. `BRDC-SHARE-001` kuljettaa sen, jos se joskus halutaan
