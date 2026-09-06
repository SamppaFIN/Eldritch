# BRDC-DETAIL-001 — Detail-ruudut: tieto nätissä paketissa

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WIKI-003, BRDC-WIKI-004 (tehty), BRDC-MOBILE-001 (portti) |
| **Status** | `todo` — RED kirjoitettu, GREEN tarkennetaan Infiniten kanssa |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-06: *"eri detail ruudut vaativat hiomista, että tieto on nätissä paketissa ja parhaiten saatavissa."* |

## 🔴 RED

Detail-ruudut kasvoivat ominaisuus kerrallaan. Solupaneeliin tuli maan arvo, vahvuuspalkki,
rappioennuste, omistusdonitsi, rakennuslista, käyntilaskuri, maasto ja historiarivi — kukin
sovitettuna siihen kohtaan mihin se mahtui, ei sävellettynä. `cell-panel.css` on osunut
400 rivin rajaan kahdesti ja jaettu paineen alla (`spell-panel.css`, `CellWorth.tsx`), ei
suunnitellusti. Sama koskee rakennusten Guide-sivuja, Wager-rivaalin paneelia ja You-näkymää.

Tieto on **läsnä mutta ei järjestyksessä**: tärkein rivi (kenen tämä on, kuinka vahva, mitä
päällä) kilpailee samasta tilasta vähäisimmän kanssa (ennusteen desimaalit). Ruudusta
toiseen rakenne vaihtuu, joten käyttäjä opettelee jokaisen erikseen — kävellessä, yhdellä
peukalolla, kirkkaassa valossa.

## 🟢 GREEN

> Luonnos. Käydään läpi Infiniten kanssa ennen toteutusta — mitkä ruudut, missä
> järjestyksessä, mikä on kunkin "tärkein rivi".

- [ ] Jokaisella detail-ruudulla on **sama tietohierarkia**: tärkein ensin, yksityiskohta
      sitten, harvinaisin viimeisenä tai taitettuna
- [ ] Rakenne **toistuu ruudusta toiseen** — solu, rakennus, Wager-rivaali, hahmo — niin
      että sen oppii kerran
- [ ] Resurssit ja tilat **merkkeineen ja väreineen** (`renderEffect`-väritys, ei paljasta
      lukua ilman yksikköä)
- [ ] Mitään ei tarvitse arvata: jokainen luku sanoo mitä se on
- [ ] 360 px, yksi peukalo, footerin yläpuolella — `BRDC-MOBILE-001`:n portti pätee tähän
- [ ] Ei uutta CSS-tiedostoa hätäjaolla: jos raja täyttyy, jako on osa suunnitelmaa
- [ ] Ei uutta tekstiä — sisältö tulee samoista tauluista kuin Guide (`BRDC-WIKI-003`)

## Toteutus

**Ei uutta dataa, ei uusia paneeleja — järjestys ja typografia.** Sama sisältö, luettavampi
paketti. Aloitetaan solupaneelista, koska se on eniten kentällä nähty ja se, jonka Infinite
nimesi. Guide-sivut ovat jo johdettuja (`BRDC-WIKI-003`); tämä tuo niiden rakenteen myös
paneeleihin.

Ajoittuu `BRDC-TUTOR-001`:n rinnalle: molemmat ovat "tieto perille käyttäjälle" -työtä ja
jakavat saman portin (`BRDC-MOBILE-001`).

## Ei tässä

- Uudet tiedot detail-ruutuihin. Jos jokin puuttuu, se on oma tikettinsä
- Karttafiltterit ja -tasot (`BRDC-ART-003` jatkoineen)
- Wager-rivaalin näkyvyysmoodit — ne ovat jo `BRDC-WAGER-JSON-007`
