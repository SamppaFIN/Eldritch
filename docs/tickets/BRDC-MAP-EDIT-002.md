# BRDC-MAP-EDIT-002 — Editori, jolla oikeasti voi piirtää

| | |
|---|---|
| **Vaihe** | 3 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-MAP-EDIT-001 |
| **Status** | `done` — 2026-09-11 (v0.5.70) |
| **Valmius** | 100 % — portti vihreä, editori ajettu läpi dev-palvelimella |
| **Lähde** | Infinite 2026-09-11: *"Tuo karttaeditori ei nyt oikeen toimi .. käytettävyys on kamala. haluan siis editoida maailmankarttaa.. paljasta koko ruudukko ja anna minulle työkaluja, millä voin maalata isomman alueen kerralla"*, *"poista pelin kontrollit map editin ajaksi"*, *"karttaa ei pysty liikuttamaan editori tilassa"* |

## 🔴 RED

**Ensimmäinen editori pyysi maalaamaan heksoja joita ei näe, yksi kerrallaan.**

Sumu on pelaajalle oikein: kartta piirtää omat solut ja niiden naapurirenkaan eikä muuta
(claude.md §13). Piirtäjälle se on koko ongelma — ruudukkoa ei ollut, sivellin oli yhden
heksan kokoinen, ja pelin omat kontrollit olivat tiellä. *"Käytettävyys on kamala"* on
oikea tuomio.

## 🟢 GREEN

- [x] **Ruudukko näkyviin.** Editorin omat kaksi tasoa: jokainen näkyvissä oleva heksa
      ääriviivoina, maalatut täytettyinä **sillä värillä jonka maasto oikeasti tuottaa** —
      sokkona maalaaminen ja jälkikäteen tarkistaminen on tapa saada piirroksesta
      hienovaraisesti väärä. Molemmat poistetaan sulkiessa.
- [x] **Sivellinkoot 1 · 7 · 19 · 37 heksaa.** Yksi kerrallaan on oikea työkalu
      rantaviivalle ja kamala metsälle.
- [x] **Maalaus vetämällä.**
- [x] **Paint / Move -tila.** Veto ei voi sekä maalata että panoroida, ja arvaaminen niiden
      välillä on huonompi kuin kumpikaan. Ensimmäinen versio kytki panoroinnin kokonaan
      pois ja jätti kartan tavoittamattomiin.
- [x] **Pelin kontrollit pois editorin ajaksi** — HUD, kamerakontrolli, vihjekortti,
      ilmoitukset, ☰. Piilotettu CSS:llä eikä irrotettu DOMista: mikään ei menetä tilaansa
      ja sulkeminen palauttaa kartan täsmälleen ennalleen.
- [x] **Napautus ei avaa solukorttia** editorin ollessa auki: kartta kuuluu siveltimelle.
- [x] **Kamera ei jahtaa pelaajaa** piirtäessä — se pysyy siellä minne se on viety.
- [x] **Footer pienenee kun mikä tahansa ruutu on auki** (Infiniten sivuhuomio):
      tilalukemat vastaavat kysymykseen *"miten menee kävellessä"*, ja paneelin ollessa
      auki pelaaja lukee paneelia — lukemat ovat vain korkeutta pois siitä mitä hän tuli
      lukemaan. Navigointinapit jäävät, koska ruudun vaihtaminen on ainoa asia jota vielä
      halutaan.

### Kaksi omaa vikaa jotka mittaus paljasti

- [x] **`cellsCoveringBBox` generoi ensin ja tarkisti katon vasta sitten.** Funktio joka on
      kirjoitettu estämään välilehden kaatuminen vei 20 km:n laatikolla **10,8 sekuntia**
      rakentaessaan kolme miljoonaa heksaa heittääkseen ne pois. Koko arvioidaan nyt
      **ennen kuin yhtäkään solua tehdään** — pinta-ala jaettuna solun nimellisellä koolla.
      Testitiedosto 3,8 s → 0,75 s.
- [x] **Veto maalasi vain yhden siveltimellisen.** Jokainen veto lähti samasta
      vanhentuneesta piirroksesta, joten viimeinen ylikirjoitti edelliset ja koko veto
      näytti yhdeltä napautukselta. Kaikki muutokset ovat nyt **funktioita nykyisestä
      piirroksesta** — mikään täällä ei saa olettaa tietävänsä sen hetkistä tilaa.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1189**) + `pnpm build` vihreä.
- [x] `cells.test.ts` +3: pieni laatikko kattaa heksansa · **iso palauttaa tyhjän eikä
      miljoonia** · kutsujan oma katto toimii.
- [x] `editor.test.ts` +2: sivellinkoot **ovat** heksarenkaat (1, 7, 19, 37) · koko on
      ulottuvuutta, ei merkitystä — sama sivellin sanoo saman joka koolla.
- [x] **Ajettu läpi dev-palvelimella:** ruudukko piirtyy (64 heksaa zoomilla 17) · veto
      maalaa 13 heksaa · Move-tila **ei maalaa** ja siirtää karttaa · HUD ja kamerakontrolli
      piilossa · solukortti ei aukea.

## Mitä bundlesta jää, tarkalleen

Tarkistin greppaamalla valmiista tuotantobundlesta, koska väitin tätä kerran väärin:

| | tuotantobundlessa |
|---|---|
| `Map editor`, `Scrub`, `Tap a hex to paint`, `Too far out to draw` | **ei** |
| `editor-grid-line` | **kyllä** |

Paneeli on poissa. **Ruudukkotaso ja maalaushook jäävät**, koska `MapCanvas` kutsuu hookia
ehdoitta — hookkia ei voi kutsua ehdollisesti. Ne ovat pelaajan buildissa **kuollutta
painoa eivätkä vaara:** `editor` on siellä `undefined`, jolloin jokainen efekti palaa heti,
eikä editoria pääse avaamaan koska valikkoriviä ei ole. Sen saisi pois dynaamisella
importilla efektin sisällä; en tehnyt sitä, koska se vaihtaisi muutaman kilotavun
siivousjärjestyksen hienovaraiseen bugiin.

## Tiedossa oleva rosoisuus

Editorin avaamisen jälkeen kamera **ajautuu kerran** noin kaksikymmentä metriä: se on
kesken jäänyt seurantasiirtymä joka ehti alkaa ennen kuin kamera pysäytettiin. Se päättyy
itsestään eikä toistu. Mitattu, ei arvattu — ja mainittu tässä koska se näyttää viasta.

## Ei tässä

- **Suorakaide- ja täyttötyökalut.** Sivellinrenkaat kattavat 37 heksaa kerralla; jos
  kokonaisen lahden täyttäminen on yhä liian hidasta, se on seuraava tiketti eikä arvaus.
- **Kumoamisen syvyys** on 50 askelta. Numero on arvaus.
- **Piirroksen lataaminen buildiin.** `loadDrawings` odottaa yhä ensimmäistä committoitua
  tiedostoa — se on Infiniten piirros, ei minun.
