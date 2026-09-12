# BRDC-LANDS-002 — Maat paljastetaan siitä ruudusta jossa ne on

| | |
|---|---|
| **Alue** | `apps/game/src/features/lands/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | done |
| **Edeltäjä** | BRDC-LANDS-001, BRDC-UI-002 |
| **Lähde** | Infinite 2026-09-12 |

## 🔴 RED

Infinite: *"parannetaan your lands valikkoa.. ainoastaan omat maat.. klikkaamalla pääsee
maan kortille ja kartta fokusoituu tuohon alueeseen.. reveal napilla saa palkinnon ja
notifikaation mitä löytyi.. mutta painamisen jälkeen omat maat sivu pysyy aktiivisena,
joten pelaaja voi paljastaa kaikki maat helposti samasta ruudusta."*

**Lista lajittelee paljastamattomat ensimmäiseksi eikä anna mitään tapaa paljastaa niitä.**
`LandsPanel` avautuu järjestyksessä jonka koko mielipide on *"nämä kannattaa paljastaa"* —
ja ainoa tapa tehdä se on napauttaa riviä, jolloin **sivu sulkeutuu**
(`useMapAside.tsx:136`: `setLandsOpen(false)`), etsiä heksa kartalta, painaa Reveal, avata
valikko uudelleen ja vierittää takaisin.

Kolmellasadalla neljälläkymmenellä solulla se on satoja napautuksia työhön joka on ilmaista
ja maksaa joka kerta. Kirjanpito tietää mitä pitäisi tehdä eikä anna tehdä sitä.

**"Ainoastaan omat maat" on jo totta** — `getOwnedCells` suodattaa `ownerId === me.id`
(`MockRepository.ts:297`). Ei muutosta, mutta kirjattu tähän koska sitä pyydettiin: jos
kentällä näkyy vierasta maata tällä sivulla, se on eri vika kuin tämä.

## 🟢 GREEN

- [x] **Reveal-nappi jokaisella paljastamattomalla rivillä.** Painaminen ei sulje sivua
- [x] Palkinto ja **mitä löytyi** rivillä itsellään: taso, resurssit ja bounty nimeltä
- [x] Sama toast ja sama pling kuin kartalta paljastaessa — `latestGain` niputtaa nyt
      kolme lähdettä yhdeksi (§14: sama teko, sama ulkoasu)
- [x] Rivi päivittyy paikallaan: `unrevealed`-merkki katoaa, yhteenvedon luku laskee.
      Ei uudelleenlatausta, koska lista on lajiteltu ja sen alta ei saa vetää mattoa kesken
- [x] Kahta kertaa ei makseta: nappi katoaa heti painettaessa, ja `revealCell` on
      idempotentti joka tapauksessa
- [x] Rivin napautus vie yhä kortille ja tarkentaa kartan — se on eri teko kuin paljastus,
      ja siksi eri nappi
- [x] Kosketuskohde ≥ 44 px, oma fokusrengas, ja `aria-label` joka nimeää maan
- [x] Portti: `check-line-limit`, `tsc -b`, `vitest run`, `pnpm build`, e2e

## Todennus

`lands.spec.ts`: paljastamaton maa listalla → Reveal → **sivu on yhä auki**, rivi on
päivittynyt, yhteenveto on laskenut, ja saman ruudun seuraava maa on paljastettavissa
ilman navigointia. Se viimeinen on tiketin koko pointti.

## Ei tässä

- Massapaljastus yhdellä napilla. Infinite pyysi että *jokainen* on helppo samasta
  ruudusta, ei että ne kaikki katoavat kerralla — paljastus on hetki jossa jotain löytyy,
  ja kolmesataa niistä kerralla ei ole kolmesataa hetkeä vaan yksi rivi tekstiä.
