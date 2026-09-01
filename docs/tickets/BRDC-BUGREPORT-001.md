# BRDC-BUGREPORT-001 — "Report a bug or improvement" from inside the game

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus (työkalu, ei peliä) |
| **Effort** | M (päivä) |
| **Riippuvuudet** | — |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-01: *"report a bug or improvement.. ottaa ruudunkaappauksen, käyttäjä voi kirjoittaa tai puhua ongelman.. ohjelma tekee transcriptin ja lähettää sen mun whatsappiin"* |

## 🔴 RED

Kentältä tulevat havainnot kulkevat nyt käsin: Infinite kirjoittaa ne muistiin ja
välittää chatissa. Kävelyn aikana, yhdellä peukalolla, se on liikaa vaivaa — havainto
katoaa ennen kuin se on kirjattu.

## 🟢 GREEN (luonnos)

- [ ] HUD-valikossa **"Report a bug or improvement"**
- [ ] Napautus **kaappaa ruudun** (kartta + paneelit) — `html2canvas` tai
      `getDisplayMedia`; MapLibre-canvas on eri konteksti, se on selvitettävä
- [ ] Käyttäjä **kirjoittaa TAI puhuu** ongelman. Puhe → transcript
      (`SpeechRecognition`, on Chrome/Androidilla; iOS ei → vain kirjoitus siellä)
- [ ] Ohjelma kokoaa: kuva + teksti + konteksti (versio, sijainti karkeasti, viimeiset
      lokirivit BRDC-LOG-001:stä)
- [ ] **Lähetetään Infiniten Whatsappiin** — `https://wa.me/<numero>?text=<enkoodattu>`
      avaa valmiin viestin; kuva liitetään käsin (wa.me ei kanna liitettä), tai kuva
      ladataan johonkin ja linkki viestiin
- [ ] Ei tiliä, ei palvelinta ennen Vaihe 5 (§9 sääntö 9). Jos kuva vaatii hostauksen,
      se odottaa — tekstiraportti + "screenshot talletettu laitteelle" riittää v1:ssä

## Auki

- Kuvan kulku ilman palvelinta: `wa.me` ei liitä tiedostoa. Vaihtoehdot: (a) kuva vain
  laitteelle + käyttäjä liittää itse, (b) `navigator.share()` jakaa kuvan + tekstin
  natiivijakoon (Android tukee), josta Whatsapp valittavissa — **tämä on todennäköisesti
  oikea**: yksi jako, kuva mukana, ei numeroa koodiin
- WhatsApp-numero konfiguraatioon vai `navigator.share` ilman kohdetta?

## Ei tässä

- Kaksisuuntainen — vain lähetys. Vastaukset tulevat chatissa kuten ennen.
