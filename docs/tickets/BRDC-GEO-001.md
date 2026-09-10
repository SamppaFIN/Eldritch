# BRDC-GEO-001 — Yksi vastaamaton selainkutsu jumitti koko pelin

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-MAP-006 (`useInitialPosition`), BRDC-HUD-004 (ilmoitukset) |
| **Status** | `done` — 2026-09-10 (v0.5.59) |
| **Valmius** | 100 % koodin osalta; kenttätesti kaverin iPhonella on ainoa lopullinen todiste |
| **Lähde** | Infinite 2026-09-10: *"kaverini iphone ei enää suostu löytämään lokaatiota, vaikka koittaisi uutta sessiota incognito moodissa"* |

## 🔴 RED

**`getCurrentPosition` saa jättää kutsumatta kumpaakin callbackia — ja peli oli sen varassa.**

`useInitialPosition` odotti selaimen vastausta, ja `settled` kääntyi todeksi vain
callbackissa. `MapView.tsx:220` odottaa `settled`iä ennen kuin kartta renderöityy, ja
`usePositionSource` on `enabled: settled`in takana. Eli:

> Jos selain ei vastaa, kartta ei koskaan avaudu **eikä seuranta koskaan käynnisty.**
> Ruudulla lukee *"Listening for the ground beneath you…"* loputtomiin, eikä siitä ole
> ulospääsyä.

Ja iOS tekee juuri sitä. Spesifikaation oma `timeout`-kello **ei käynnisty ennen kuin lupa
on myönnetty**, joten vastaamaton lupakysely, Safarilta pois kytketty Location Services tai
Lockdown Mode jättävät molemmat callbackit laukeamatta — pysyvästi. Selaimen oma timeout ei
pelasta, koska se ei ole vielä käynnissä.

Tämä selittää myös miksi incognito ei auttanut: **vika ei ollut tallennetussa tilassa.**

### Kaksi valhetta päälle

1. **`usePositionSource` kohteli TIMEOUTia rikkinäisyytenä.** `watchPosition`in
   virhecallback asetti kaiken paitsi PERMISSION_DENIEDin tilaan `unavailable` ja
   **nollasi `point`in**. Vahti jäi silti käyntiin, joten kyse oli vain "ei vielä fixiä" —
   sisällä, tunnelissa, kylmäkäynnistyksessä. Ruutu sanoi silti *"No location sensor on
   this device"*, mikä on iPhonesta kerta kaikkiaan väärin, ja viimeinen kelvollinen piste
   heitettiin menemään siinä samalla.
2. **Kumpikaan viesti ei kertonut mitä tehdä.** *"Location refused — the ground stays
   silent"* ja *"No location sensor on this device"* ovat molemmat umpikujia. iPhonella
   kytkin on kahdessa paikassa, ja **ulompaa niistä yksikään verkkosivu ei näe eikä osaa
   kysyä** — pelaaja joka on jo sallinut sivun Safarissa vannoo että lupa on päällä.

## 🟢 GREEN

- [x] **Oma takaraja.** `useInitialPosition` asettaa `setTimeout`in `timeoutMs + 1 s`
      kohdalle. Jos selain ei ole vastannut siihen mennessä, tila asettuu itse
      (`permission: 'timed-out'`, keskipiste fallback) ja **kartta avautuu**. Selaimen
      vastaus voittaa aina jos se tulee — takaraja on sekunnin myöhässä sitä varten.
- [x] **Kartan avauduttua seuranta käynnistyy**, koska se on `settled`in takana. Aiemmin
      jumi vei mukanaan senkin; nyt vahti saa yrittää vaikka avausfix epäonnistui.
- [x] **TIMEOUT ei ole rikki.** `watchPosition`in TIMEOUT jättää tilan `searching`iin
      **ja säilyttää viimeisen pisteen**. Vahti on yhä käynnissä; fix voi hyvin saapua.
- [x] **`permissionFor`** eriyttää DENIED / TIMEOUT / UNAVAILABLE puhtaana funktiona.
      Tuntematon koodi on `unavailable`, ei `denied`: arvaus "evätty" lähettäisi pelaajan
      muuttamaan asetusta joka on kunnossa.
- [x] **Neuvo joka kelpaa toimintaohjeeksi.** Uusi tarttuva karttailmoitus nimeää
      **molemmat** iOS-kytkimet: `Settings → Privacy & Security → Location Services →
      Safari Websites` **ja** osoiterivin `ⓐA → Website Settings → Location`. Tarttuva,
      koska ilman sijaintia ei ole peliä — se ei saa liukua ohi seitsemässä sekunnissa.
- [x] **`geoTrouble` vaikenee kun taivas on vain hidas.** Avausfix aikakatkeaa rutiinisti
      sisätiloissa ja vahti onnistuu hetkeä myöhemmin. Sivu joka huutaa asetuksista joka
      kerta on sivu jonka varoituksia kukaan ei enää lue silloin kun jokin on oikeasti
      vialla.
- [x] HUD:n rivit korjattu: *"Location refused — check your browser settings"* ja
      *"No location available from this browser"*. Jälkimmäinen ei enää väitä mitään
      laitteen sensorista.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1099**) + `pnpm build` vihreä.
- [x] **e2e todistaa jumin** (`map.spec.ts`, uusi describe): geolocation korvataan
      versiolla joka ei kutsu kumpaakaan callbackia, ja kartta on silti näkyvissä 25 s
      sisällä eikä `.mapview--waiting` ole jäljellä. Toinen tapaus: evätty lupa antaa
      ilmoituksen jossa lukee "Location Services".
- [x] **Todennettu että testi nappaa vian:** oma takaraja poistettiin väliaikaisesti,
      `pnpm build`, ja testi **kaatui**. Palautettiin, ja se menee läpi. Testi joka menee
      läpi sekä ennen että jälkeen ei todista mitään.
- [x] `geoPermission.test.ts` (3): evätty on evätty, **timeout ei ole puuttuva sensori**,
      tuntematon koodi ei ole eväys.
- [x] `notices.test.ts` +6: eväyksen neuvo on tarttuva ja nimeää Location Servicesin,
      vastaamaton selain saa oman lauseensa, `geoTrouble` vaikenee hitaudesta,
      **vaikenee myös avaustimeoutista jonka seuranta korjasi**, puhuu kun molemmat
      luovuttivat, ja eväys kummasta puolesta tahansa.
- [x] `map.spec.ts` desktopilla 14/14.
- [ ] **Kenttä: kaverin iPhone.** Tämä on ainoa lopullinen todiste. *(Infinite ajaa.)*

## Mitä tämä ei todista

En ole nähnyt sitä puhelinta enkä sen konsolia. Korjattu on **luokka vikoja johon oire
kuuluu**: peli jumittui jos selain ei vastannut, ja kertoi väärää tarinaa kun se vastasi
huonosti. Jos kaverin iPhonella on jokin muu syy, esimerkiksi Location Services kokonaan
pois, peli **kertoo nyt sen** sen sijaan että jäisi kuuntelemaan maata ikuisesti. Se on
korjauksen tarkistettava lupaus, ei se että lokaatio alkaa löytyä.

## Ei tässä

- **`permissions.query({ name: 'geolocation' })`.** Kertoisi eväyksestä ennen kysymistä,
  mutta Safari ei tue sitä geolocationille — eli juuri sillä alustalla jolla tämä vika on,
  se ei auta.
- **Uudelleenkysely napista.** Selain ei näytä kehotetta toista kertaa kun se on kerran
  evätty, joten nappi joka ei voi onnistua olisi julmempi kuin ohje.
- **Sijainnin syöttäminen käsin.** Aito varatie, mutta oma tikettinsä ja iso päätös:
  koko anti-cheat-malli nojaa siihen ettei sijaintia voi kirjoittaa.
