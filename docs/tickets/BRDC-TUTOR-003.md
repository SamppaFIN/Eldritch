# BRDC-TUTOR-003 — Vihje on kortti kartan reunassa, ei juliste sen päällä

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-TUTOR-002 (`steps.ts`, `FirstLook`) |
| **Status** | `done` — 2026-09-10 (v0.5.55, sijainti korjattu v0.5.56) |
| **Valmius** | 100 % — portti vihreä, mobile-360 e2e 15/15 neljä kertaa peräkkäin |
| **Lähde** | Infinite 2026-09-10, kuvakaappaus localhostista: *"tuo teksti jää tohon tielle"* |

## 🔴 RED

**Opastusteksti peitti kartan, ja siitä ei päässyt eroon.**

`FirstLook` oli `position: fixed`, keskitetty, **26 merkin mitalla** — eli sen kolme
virkettä levisivät kuudeksi riviksi noin 240 pikselin korkuiseksi lohkoksi keskelle
karttaa. `pointer-events: none` esti sitä nappaamasta klikkauksia, mutta *näkyvästi* se
peitti juuri sen alueen jolla pelaaja on.

Ja se **ei ollut suljettavissa**. Se piirtyi suoraan tilasta (`nextStep`), joten se katosi
vasta kun porras vaihtui — eli vasta kun pelaaja oli tehnyt sen mitä siinä luki. Luetun
vihjeen ei pitäisi enää olla vihje.

Sivuseikka joka paljastui vasta mittaamalla: **kaista HUD:n yläpuolella oli jo varattu.**
Attribuutio-nappi (vasen alakulma) ja `camera-control` (44 px oikeassa alakulmassa,
`hud-height + 2rem`) ovat molemmat siinä. Koko levyinen kortti peitti ne kummatkin —
WCAG 2.2 `target-size` -rikkomus, ja puhelimella yksinkertaisesti nappi jota ei voi
painaa. Tätä ei huomannut kukaan ennen kuin axe mittasi sen.

## 🟢 GREEN

- [x] **Kortti, ei juliste.** Sama lasipinta kuin `.mapview__warning`illa: reunus, tausta,
      blur, `--touch-min` minimikorkeus. Mitta 26ch → **30rem**, joten samat sanat mahtuvat
      kolmelle riville kuuden sijaan.
- [x] **Napautus vie sen pois.** Koko kortti on `<button>`, `aria-label="Dismiss: …"`,
      näkyvä fokusrengas. Ohitus muistetaan **portaan tunnisteella**, joten `walk`-vihjeen
      viuhtominen ei vaienna `build`-vihjettä.
- [x] **Kortti on ruudun yläreunassa**, valikkorivin alapuolella. Se on ainoa kaista
      kartalla jota mikään ei omista. Alakaista oli kaksi kertaa väärä vastaus, ks. alla.
- [x] `VesicaDivider` poistettu kortista: se oli koriste joka maksoi korkeutta kaistalla
      jossa korkeus on koko ongelma.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1063**) + `pnpm build` vihreä.
- [x] Uusi e2e `trail-detail.spec.ts` — mitattu, ei arvattu: kortti **< 20 %** ruudun
      korkeudesta, **kortin alareuna ruudun puolivälin yläpuolella**, ja
      `click()` → `toHaveCount(0)`.
- [x] `guide.spec.ts` desktopilla — se testi klikkaa karttaa **keskeltä**, ja se oli
      kolmas todiste siitä ettei kortti kuulu keskelle.
- [x] `trail-detail`in HUD-budjettitesti kertoo nyt mitatun prosentin viestissään.
      Se kaatui matkalla kahdesti rinnakkaisajossa ja meni yksin läpi; siirron jälkeen
      neljä peräkkäistä rinnakkaisajoa vihreänä. **En väitä todistaneeni syy-yhteyttä** —
      kirjaan sen tähän siltä varalta että se palaa.
- [x] `standards.spec.ts` (axe, WCAG 2.2 AA) mobile-360 vihreä. **Se oli punainen kahdesti
      matkalla** ja molemmat olivat aitoja: ensin kortti peitti recenter-napin, sitten
      attribuution. Vasta toinen korjaus (siirto kontrollien yläpuolelle) ratkaisi sen.
- [x] mobile-360 `standards` + `trail-detail` 15/15.
- [ ] Kenttä: uusi peli puhelimella → vihje näkyy, mahtuu, ja lähtee napautuksella.
      *(Infinite ajaa.)*

## Kolme yritystä, ja miksi kaksi ensimmäistä eivät kelvanneet

Tämä on tiketin opetus, ei sen sivuhuomautus.

1. **Kortti kiinni HUD:issa.** axe kaatui: kortti peitti recenter-napin (`target-size`).
2. **Kortti kiinni HUD:issa, oikea laita varattuna.** axe kaatui uudestaan: sama kortti
   peitti nyt kartan attribuutio-napin vasemmassa alakulmassa.
3. **Kortti kontrollien yläpuolelle.** axe vihreä — mutta `guide.spec.ts` kaatui, koska
   kortti otti vastaan klikkauksen kartan keskeltä. Ja se on koko juttu: **kortti joka
   ottaa napautuksia ei saa olla siellä minne napautukset on tarkoitettu.** Puhelimella
   se kohta on pelaajan oma sijaintimerkki.

Vasta yläreuna kelpaa. HUD:n yläpuolinen kaista on varattu kahdelle pysyvälle
kontrollille, ja kaikki mikä mahtuu niiden ohi kelluu takaisin kartan keskelle.

## Huomio joka kannattaa muistaa

`pnpm preview` tarjoili **vanhaa `dist/`iä**, joten ensimmäinen e2e-ajo epäonnistui
vanhaan markupiin eikä uuteen. Playwright ei rakenna itse. Jos e2e väittää muutosta
olemattomaksi, `pnpm build` ennen syyttämistä.

## Ei tässä

- **Kartan kelluvan kerroksen omistajuus** — `BRDC-MAP-005`. Tämä tiketti todisti että
  ongelma on oikea (kolme komponenttia laskee paikkansa erikseen ja kaksi niistä osui
  päällekkäin), mutta korjasi vain oman osuutensa.
- Vihjeen vaihtumisen korostaminen välähdyksellä — `BRDC-TUTOR-002`in "Ei tässä" pätee yhä.
- Ohituksen säilyminen sivun latauksen yli. Nyt se on `useState`, eli uusi lataus tuo
  vihjeen takaisin. Se on tarkoituksellista niin kauan kuin avaus on kesken.
