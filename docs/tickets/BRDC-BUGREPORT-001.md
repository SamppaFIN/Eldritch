# BRDC-BUGREPORT-001 — "Report a bug or improvement" from inside the game

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus (työkalu, ei peliä) |
| **Effort** | M (päivä) |
| **Riippuvuudet** | — |
| **Status** | `done` |
| **Valmius** | 85 % — teksti + puhe + jako valmiit, ruudunkaappaus siirtyi jatkoon |
| **Lähde** | Infinite 2026-09-01: *"report a bug or improvement.. ottaa ruudunkaappauksen, käyttäjä voi kirjoittaa tai puhua ongelman.. ohjelma tekee transcriptin ja lähettää sen mun whatsappiin"* |

## 🔴 RED

Kentältä tulevat havainnot kulkevat nyt käsin: Infinite kirjoittaa ne muistiin ja
välittää chatissa. Kävelyn aikana, yhdellä peukalolla, se on liikaa vaivaa — havainto
katoaa ennen kuin se on kirjattu.

## 🟢 GREEN

- [x] HUD-valikossa **"Report a bug or improvement"** — `SettingsMenu` uusi rivi
- [~] Napautus **kaappaa ruudun** — **siirtyi jatkoon.** Tikketin oma "Ei tässä" salli
      tekstiversion v1:ksi; kaappaus vaatii `preserveDrawingBuffer`:n ja map-instanssin
      läpiviennin (ks. Jatkoon)
- [x] Käyttäjä **kirjoittaa TAI puhuu** — `<textarea>` + `useDictation.ts`
      (`webkitSpeechRecognition`, feature-detect; iOS:llä vain kirjoitus)
- [x] Ohjelma kokoaa: teksti + konteksti (versio, sijainti 3 desimaaliin ≈110 m,
      5 viimeistä lokiriviä) — `report.ts` `buildReport`, testattu
- [x] **Lähetetään** — `navigator.share({ text })` avaa natiivijaon (Android → WhatsApp
      yhdellä napautuksella); ei numeroa koodiin. Desktopilla → leikepöytä
- [x] Ei tiliä, ei palvelinta ennen Vaihe 5 — täysin selain

## Auki

- Kuvan kulku ilman palvelinta: `wa.me` ei liitä tiedostoa. Vaihtoehdot: (a) kuva vain
  laitteelle + käyttäjä liittää itse, (b) `navigator.share()` jakaa kuvan + tekstin
  natiivijakoon (Android tukee), josta Whatsapp valittavissa — **tämä on todennäköisesti
  oikea**: yksi jako, kuva mukana, ei numeroa koodiin
- WhatsApp-numero konfiguraatioon vai `navigator.share` ilman kohdetta?

## Jatkoon

- **Ruudunkaappaus.** `useMap.ts` → `preserveDrawingBuffer: true` (pieni akkuhinta),
  `MapCanvas` tarjoaa `map.getCanvas().toDataURL('image/png')`:n ylös callbackillä,
  `BugReport` liittää PNG:n `navigator.share({ files })`:iin kun `canShare` sallii.
  Vain kartta-canvas v1:ssä; HTML-paneelit kuvataan tekstillä.

## Ei tässä

- Kaksisuuntainen — vain lähetys. Vastaukset tulevat chatissa kuten ennen.
