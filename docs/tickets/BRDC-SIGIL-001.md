# BRDC-SIGIL-001 — Sigil-designjärjestelmä: perusta

| | |
|---|---|
| **Alue** | `packages/ui/src/styles/tokens.css`, `features/territory/territoryFeatures.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L kokonaisuutena; **tässä tiketissä perusta (S–M)** |
| **Status** | `in_progress` — perusta tehty 2026-09-14 (v0.5.83) |
| **Lähde** | Infiniten tilaama designdokumentti *"Eldritch Sigil"*, 2026-09-13 |

## 🔴 RED

Infinite toimitti valmiin visuaalisen järjestelmän: värilaki, nestemäinen lasi, isometrinen
heksakirjasto, 20 valtakuntamerkkiä, 20 avataria, seitsemän uudelleenpiirrettyä ruutua ja
luovutusohjeet.

**Se on viikkojen työ, ei yhden session.** Kahdestakymmenestä avatarista ja seitsemästä
ruudusta ei tule puolikkaita: puoliksi tehty ruutu on huonompi kuin koskematon.

Dokumentti kuitenkin nimeää itse oman perustansa luovutusosiossa, ja se perusta on se osa
joka **muuttaa jokaisen ruudun kerralla ilman että yhtäkään piirretään uudelleen**:

1. *"Resource colour is a lookup, not a decision. A grey resource number is a bug."*
2. *"One `<GlassPane>` component… nothing else in the app writes `backdrop-filter`."*
3. *"`[data-daylight]` drops L1 and L2 and swaps the tint for `--plate`… It is a token
   flip, not a second design."*

## 🟢 GREEN — tässä tiketissä

- [x] **Värilaki tokeneina.** `--r-timber … --r-token` `tokens.css`:ään dokumentin omilla
      OKLCH-arvoilla. `RESOURCE_COLOUR` lukee nyt tokenit eikä toista heksoja
- [x] **Ei uusia värejä §13:n tarkoittamassa mielessä:** gold *on* `--sacred-gold` ja
      mana *on* `--mystic-cyan`; loput ovat se asteikko jonka nuo kaksi jo lupasivat.
      Nimeäminen on se mikä tekee `RESOURCE_COLOUR`ista haun eikä päätöksen
- [x] **`MAP_RESOURCE_COLOUR`**, sama laki literaaleina. MapLibre jäsentää maaliarvot itse
      eikä ole kuullutkaan custom propertyistä. Pidetty tokeniparinsa vieressä ja samassa
      järjestyksessä — kaksi väritaulua kahdessa tiedostossa on se tapa jolla laki lakkaa
      hiljaa olemasta yksi. Testi vaatii avaimet täsmäämään
- [x] **Lasi neljäksi kerrokseksi:** sumennus + saturaatio, oma runkoväri, spekulaarinen
      kulmakukinta `::before`-elementtinä ja sisäreunan hiusviiva. Sisältö on **sisar
      lasin yläpuolella** täydellä opasiteetilla — se on auringonvaloklausuuli
- [x] **`.es-glass--deep`** kaikelle mikä pitää *lukea* eikä nähdä läpi
- [x] **Päivävalotila:** `[data-daylight]` juuressa, kytkin asetuksissa, ja
      `prefers-reduced-transparency` osuu samaan sääntöön. Yksi rivi CSS:ää, ja mikään muu
      sovelluksessa ei tiedä sen olemassaolosta — myös paneeli jota ei ole vielä mountattu
- [x] Todennus: `standards` 9/9 mobiilissa **mukaan lukien kontrasti** — lasi ei rikkonut
      AA:ta. Uusi e2e todentaa että kytkin oikeasti vaihtaa `backdrop-filter`in pois

## 🔴 Tekemättä — ja tämä on lista, ei lupaus

Dokumentin loput, karkeasti työmäärän mukaan:

| Osa | Miksi ei nyt |
|---|---|
| ~~**Isometrinen maastokirjasto**~~ | ✅ **Tehty `BRDC-SIGIL-002`:ssa** (v0.5.84) — seitsemän maastolaattaa kartalla |
| ~~**Bonusresurssien spritet**~~ | ✅ **Tehty `BRDC-SIGIL-003`:ssa** (v0.5.85) — kymmenen ikonia, kartalle paljastuksen jälkeen |
| ~~**Valtakuntamerkit**~~ | ✅ **Tehty `BRDC-SIGIL-004`:ssä** (v0.5.86) — 18 generoitua merkkiä, kääntäjän pakottama täydellisyys |
| ~~**20 avataria**~~ | ✅ **Tehty `BRDC-SIGIL-005`:ssä** (v0.5.87) — oma kasvo You-ruudulla |
| ~~**Seitsemän ruutua**~~ | ✅ **Käyty läpi 2026-09-15** (v0.5.88–0.5.93) — ks. taulukko alla |
| **Refraktiokerros** (L1) | `feTurbulence` + `feDisplacementMap`, yksi GPU-pass per pane. Tätä peliä pelataan puhelimella tunti kerrallaan; se on päätös jonka takana pitää olla akkumittaus |

**Lasibudjetti dokumentista, ei vielä valvottu:** enintään kolme elävää
`backdrop-filter`-pintaa per ruutu. Kirjattu tähän ettei se unohdu kun ruudut tehdään.

### Seitsemän ruutua — mitä kustakin löytyi (2026-09-15)

Infiniten päätöksellä edettiin suoraan dokumentin mukaan ilman erillistä läpikäyntiä.
Jokainen ruutu **auditoitiin koodia vasten** ennen koskemista, ja kolmessa tapauksessa
vanha suunnitelma osoittautui vanhentuneeksi — se on tulos siinä missä korjauskin.

| Ruutu | Tulos |
|---|---|
| **Here / soludetail** | `BRDC-DETAIL-001` (v0.5.88) — omistus ja "täällä" omiksi merkeikseen, tuotto väritetty, kaksi kahdentumaa pois, `CellHeader.tsx` suunniteltuna jakona |
| **Keep** | `BRDC-KEEP-008` (v0.5.89) — kaksi virhettä (valheellinen yksityisyyslupaus, väärään kysymykseen vastaava rivi) + `formatArea` kolmesta yhteen |
| **Research** | `BRDC-TECH-003` (v0.5.90) — "schoolless"-jargon pois, `titleCase` oikeasta moduulista |
| **You** | `BRDC-CHAR-002` (v0.5.91) — ruutu on "You", kuten nappi joka sen avaa |
| **Asetukset / navigointi** | `BRDC-NAV-001` (v0.5.92) — avaaminen ja lopettaminen erotettu, `Empty the pouch` merkitty tuhoavaksi |
| **Codex** | `BRDC-CODEX-003` (v0.5.93) — väli seuraavaan sijaan, tasapelit mukaan lukien |
| **Kartan chrome** | **Ei tehtävää.** `BRDC-HUD-004` oli jo korjannut päällekkäin piirtyvät ilmoitukset pinoksi, ja `--dev`-luokalla on sääntö. Vanha RED oli vanhentunut — todennettu tiedostosta, ei oletettu |

**Kartan heksa itse (dokumentin "03 · The Hex")** ei ole yksi seitsemästä ruudusta, ja se
tarkistettiin erikseen: dokumentin omat neljä *"ilman napautusta"* -faktaa ovat kaikki jo
kartalla — omistajan veto, bonusresurssi maassa (`BRDC-SIGIL-003`), rakennus, ja temppeli
/ Anchor Stone (`PlaceMarkers.ts`, halo + nimi). Puuttuvat osat (naapurilaskuri,
vahvuuskaari, isometriset rakennukset) ovat dokumentin **oman** määrittelyn mukaan
*"second tier and may be quiet"* — ja kartta on jo kerran siivottu glyfiseinästä
(v0.5.84). Ei rakennettu; jos kentältä tulee raportti, se on oma tikettinsä.

## Todennus

`pnpm test` 1326, `tsc -b`, `check-line-limit`, `pnpm build`, desktop `opening` 8/8,
mobile-360 `standards` 9/9.
