# BRDC-MOBILE-001 — Mobiilikokemus täydelliseksi

| | |
|---|---|
| **Vaihe** | 2.6 — mobiili ja jaettu maailma |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | kaikki Vaiheen 2.5 tiketit |
| **Status** | `todo` — koodivalmistelu tehty 2026-09-01, ulkotesti ajamatta |
| **Valmius** | 10 % |
| **Lähde** | Infinite 2026-08-31: *"tällä hetkellä tärkeintä on saada mobiilikokemus täydelliseksi"* |

## 🔴 RED

Peli on todennettu **selaimessa ja simuloidulla GPS:llä**. Vaiheiden 1 ja 2 oikeat
hyväksymisportit — kävele ulkona 10 min lentokonetilassa, kävele kortteli ympäri —
ovat yhä ajamatta. 415 yksikkötestiä ei kerro mitään siitä, miltä peli tuntuu
kädessä kirkkaassa päivänvalossa yhdellä peukalolla.

Ja tämä on **mobiilipeli**. `BRDC-REGRESSION-000` #5 on v2:n P0-bugi: mobiililayout
oli rikki S23 Ultralla mobiilipelissä. Se testataan 360 px:n Playwright-viewportissa,
mikä on oikea suoja väärää layoutia vastaan — ja täysin sokea sille, onko peli
*pelattava* liikkeessä.

Tämä tiketti on portti kaiken 4X-sisällön edessä. 15 viikkoa sisältöä sellaisen
rungon päälle, jota kukaan ei ole vienyt ulos, on täsmälleen v2:n virhe.

## 🟢 GREEN

### Oikea ulkotesti — se mitä ei voi ajaa koneelta

- [ ] Kävele **10 min ulkona lentokonetilassa**. Jälki seuraa ja säilyy reloadin yli
- [ ] Kävele **kortteli ympäri**. Lenkki sulkeutuu ja sisus täyttyy — oikealla GPS:llä,
      ei fixturella
- [ ] Kävele **sama reitti seuraavana päivänä**. Vahvistuu, ei valtaudu uudestaan
- [ ] **Näyttö pois 5 min kesken kävelyn.** Kirjaa mitä katosi: `unobservedMs` on jo
      olemassa, nyt se luetaan oikeasta kävelystä
- [ ] Kirjaa jokainen havainto tähän tikettiin — myös se mikä toimi

### Peukalo, aurinko, liike

- [ ] **Jokainen ensisijainen toiminto yhden peukalon ulottuvilla.** Mitattuna: alin
      kolmannes 360×800:ssa. Nykyiset paneelit ja napit auditoidaan tätä vasten
- [ ] **Kontrasti kestää suoran auringon** — mitattu, ei arvioitu. WCAG 4.5:1 on lattia,
      ei tavoite; ulkona luettavuus vaatii enemmän. Kirjaa mitatut suhteet
- [ ] **Mikään ei vaadi tarkkuutta.** Kosketuskohteet ≥ 44 px, ja liikkeessä mieluummin 56
- [ ] **Karttaa ei tarvitse koskea kävellessä.** Seuraava kamera on oletus; käsin
      raahaus keskeyttää sen ja "keskitä minuun" palauttaa
- [ ] Yhden käden pystykäyttö toimii **ilman kahta kättä missään vaiheessa** —
      Wager-dialogi ja solupaneeli mukaan lukien

### Akku ja tausta

- [ ] **Akunkulutus mitattu**: %/tunti aktiivisessa seurannassa, näyttö pois.
      Luku kirjataan tänne — ilman sitä optimointi on arvailua
- [ ] `useKeepAlive` todennetaan oikealla laitteella, ei vain testissä
- [ ] Peli kertoo **rehellisesti** kun selain nukahti: `unobservedMs` näkyy HUDissa
      sanoina, ei piilotettuna lukuna
- [ ] Sivun palautuessa taustalta tila on ehyt — ei kadonnutta juoksua, ei tuplapisteitä

### Se mikä särkyy vain oikealla laitteella

- [ ] **Notch ja eleet**: `env(safe-area-inset-*)` joka reunalla. S23 Ultran
      eleiden palkki ei saa peittää mitään painettavaa
- [ ] **Tumma tila ja auto-kirkkaus** eivät muuta värejä tunnistamattomiksi
- [ ] Reduced motion todennetaan päälle kytkettynä, ei vain koodissa
- [ ] Ruudun kääntö kesken kävelyn ei kaada karttaa eikä keskeytä juoksua

## Koodivalmistelu 2026-09-01 (ennen ensimmäistä ulkotestiä)

Ei mittauksia — nämä ovat ilmiselviä korjauksia jotka tekisivät testistä hyödyttömän
jos ne löytyisivät vasta kentällä. Havainnot ja luvut kirjataan silti alle testin jälkeen.

- **`env(safe-area-inset-*)` solu- ja Hearth-paneeliin** (`cell-panel.css`,
  `hearth-panel.css`): olivat pelkällä `--space-3`:lla, joten S23 Ultran lovi olisi
  leikannut sulkunapin ja curved-reunat sisällön. `inset-block-start` ja `inset-inline`
  nyt `max(--space-3, env(...))`. HUD:lla oli jo (`hud.css:12`); `viewport-fit=cover` on
  `index.html`:ssä, joten inseti toimivat.
- **Hearth-paneeli voi vieriä** (`max-block-size: 75dvh; overflow-y: auto`): `BRDC-TECH-001`
  lisäsi siihen tutkimusrivit, jotka voivat työntää Wager-napin ja himmenemisvaroituksen
  näytön ulkopuolelle. Solupaneelilla oli jo tämä; nyt molemmilla.
- **Modaali vierii** (`modal.css`): natiivi `<dialog>` ei vieritä sisältöään, joten pitkä
  Wager-muster jätti alatunnisteen (Confirm/Cancel) ulottumattomiin. `overflow: auto` +
  `max-block-size` huomioi nyt safe-arean.

## Toteutus

**Mittaus ennen korjausta.** Jokainen kohta yllä tuottaa luvun tai havainnon, ja
havainnot kirjataan tähän tikettiin ennen kuin mitään korjataan. Ilman lähtölukemaa
"paransimme akunkulutusta" on mielipide.

Ulkotesti ajetaan **julkaistulla Pages-versiolla puhelimessa**, ei dev-serverillä.
Se on ainoa konfiguraatio, joka vastaa sitä millä peliä pelataan.

## Ei tässä

- Capacitor ja foreground service. Ne ovat Vaihe 5, ja ne ratkaisevat taustaseurannan
  oikeasti. Tämä tiketti selvittää **kuinka pitkälle selaimella pääsee** — se on tieto,
  jota Vaihe 5:n suunnittelu tarvitsee eikä sitä ole vielä kenelläkään
- Uudet ominaisuudet. Tämä on olemassaolevan viimeistely
