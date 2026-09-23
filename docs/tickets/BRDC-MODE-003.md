# BRDC-MODE-003 — Adventure mode forces a fresh kingdom, once

| | |
|---|---|
| **Alue** | `apps/game/src/app/App.tsx`, `packages/core/src/data/profileStore.ts`, `hallOfFameStore.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-MODE-001`, `BRDC-MODE-002`, `BRDC-HALL-003` (jaettu arkisto) |
| **Status** | `[ ]` ei aloitettu — kirjattu 2026-09-23, Infinite: *"tehdään isompia muutoksia
  ensiviikon alusta"* — tämä on sitä työtä, ei tätä sessiota |

## 🔴 RED

Infinite 2026-09-23: *"haluan, että seikkailu moodi pakottaa kaikki aloittamaan alusta,
ja saa valita merkitäänkö vanha kuningaskunta historiaan."*

`BRDC-MODE-001` lisäsi `profile.mode`in, mutta jokainen ennen tätä päivitystä luotu
tallennus on ilman sitä. `readProfile`in laiska oletus (`mode: GameMode = 'adventure'`)
tarkoittaa että olemassa oleva kuningaskunta jatkuu Seikkailumoodina huomaamatta —
pelaaja ei koskaan valinnut mitään, moodivalintaruutua ei koskaan näytetä uudelleen
koska `es3:mode`-merkki on jo olemassa (`nextView()`, `App.tsx`).

Infinite haluaa tämän sijaan pakotetun rajan: kun moodivalinta tunnistaa vanhan
(esi-jaon) tallennuksen, Seikkailumoodin valinta ei jatka sitä vaan aloittaa aina
uuden kuningaskunnan — ja tarjoaa (ei pakota) vanhan merkitsemisen historiaan ensin.

## 🟢 GREEN (luonnos — ei toteutettu)

- [ ] Tunnista "esi-jaon tallennus": profiili on olemassa JA `owned cells > 0` JA
      `es3:mode`-merkkiä ei ole koskaan kirjoitettu ennen tätä avausta — ei
      `SCHEMA_VERSION`in nosto (se tyhjentäisi kaiken erottelematta, väärä työkalu
      tähän)
- [ ] Tällaisella tallennuksella "Begin the Adventure" ei jatka suoraan — pakollinen
      dialogi: *"Your kingdom ends here. Add it to the Chronicles?"* [Yes] [No],
      ei "Keep walking" -pakoreittiä (tämä ei ole peruutettavissa, sama vakavuus kuin
      Delete progress -vahvistuksella, §14 "destructive actions get a confirmation")
- [ ] Yes → `retireKingdom` (+ `BRDC-HALL-003`in julkaisu, jos se on silloin olemassa;
      muuten pelkkä paikallinen arkisto kuten tänään) → uusi kuningaskunta
- [ ] No → sama pyyhkäisy kuin `resetAll`, ei arkistointia
- [ ] Reittimoodin valinta **ei laukaise tätä** — reittimoodilla ei ole
      "kuningaskuntaa" tässä mielessä (`BRDC-MODE-001`in oma rajaus)

## 🔴 Avoimet kysymykset ennen toteutusta

- **Koskeeko tämä JOKAISTA nykyistä tallennusta heti kun tämä julkaistaan?** Jokainen
  pelaaja, myös Infinite itse, näkisi pakkodialogin seuraavan avauksen yhteydessä.
  Vai vain uusia moodivalintoja eteenpäin (jolloin nykyiset tallennukset, joilla on jo
  `es3:mode`, eivät koskaan laukaise tätä — mikä tekisi tiketistä käytännössä
  merkityksettömän juuri niille kahdelle kuningaskunnalle jotka aloittivat pyynnön)?
  Tämä pitää ratkaista ensin, koska se muuttaa koko toteutuksen kohdetta
- Jos vastaus on "kaikki heti": tarvitaanko varoitus etukäteen (esim. changelog-rivi
  "seuraava avaus nollaa kuningaskuntasi, ellet arkistoi sitä") vai riittääkö itse
  dialogi selityksineen?

## Ei tässä

- **Ei koske reittimoodia.** Reittimoodin tallennus jatkuu normaalisti
- **Ei automaattista julkaisua ilman kysymistä** — pelaaja valitsee joka kerta, sama
  periaate kuin `BRDC-HALL-001`
