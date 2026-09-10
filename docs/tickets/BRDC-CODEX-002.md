# BRDC-CODEX-002 — "Ei yhtään realmia" oli väärä vastaus tavoittamattomuuteen

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-CODEX-001 |
| **Status** | `done` — 2026-09-10 (v0.5.58) |
| **Valmius** | 100 % koodin osalta; **Worker on yhä deployattava** (CODEX-001:n avoin kohta) |
| **Lähde** | Infinite 2026-09-10: *"saan viestin, että no realm has been published yet.. vaikka klikkasin raise your banner"* |

## 🔴 RED

**Peli kertoi pelaajalle että hänen julkaisunsa ei tapahtunut. Se tapahtui.**

`fetchDemographics` palautti `null` jokaisesta lopputuloksesta joka ei ollut onnistunut
haku, ja `useCodex` käänsi jokaisen `null`in tilaksi `empty`. Näyttö sanoi silloin
*"No realm has published yet."*

Mitattu tilanne julkaisuhetkellä:

```
GET https://eldritch-world.…workers.dev/            → 200
    {"endpoints":["POST /submit","GET /world/<res6>"]}
GET https://eldritch-world.…workers.dev/demographics → 404
```

Live-Worker oli vanhaa koodia — `/submit` oli olemassa, joten **julkaisu meni läpi ja
realm on tallessa `player:<id>`-avaimena**; `/demographics` ei ollut olemassa. Klientti
tulkitsi 404:n tyhjäksi maailmaksi ja kertoi pelaajalle vastakohdan siitä mitä oli juuri
tapahtunut.

Kaksi eri asiaa oli tiivistetty yhdeksi lauseeksi:

| Tilanne | Mitä se tarkoittaa | Mitä ruutu sanoi |
|---|---|---|
| `204` | Worker vastasi: ei vielä ketään | *"No realm has published yet"* ✅ |
| `404` / `5xx` / verkko poikki | En saanut kysyttyä | *"No realm has published yet"* ❌ |

**Deploy-vaje oli tiedossa** — se on `BRDC-CODEX-001`in Todennuksessa rastittamattomana
kohtana. Mitä ei ollut mietitty on se, **miltä odottaminen näyttää pelaajalle**: tiketin
rasti oli minun tehtävälistallani, ja siihen asti peli valehteli.

## 🟢 GREEN

- [x] **Kolme lopputulosta pysyvät erillään** klientin reunalta ruudulle asti.
      `CodexFetch` on `{ ok, text } | { ok: false, reason: 'empty' | 'unreachable' }`, ja
      `CodexState` sai `'unreachable'`in. **204 on ainoa asia joka tarkoittaa tyhjää** —
      se on Workerin oma "kysyin, ei ketään".
- [x] **Tavoittamattoman viesti kertoo sen mikä pelaajaa oikeasti huolettaa:**
      *"The Codex could not be reached. Your own realm is safe on this device — this is
      the shared world being quiet, not your ground."* Ja **Try again** -nappi.
- [x] **Rikkinäinen vastaus on tavoittamaton, ei tyhjä.** Taulukko joka saapui muttei
      jäsenny on Worker joka puhuu jotain mitä tämä klientti ei osaa lukea — ei poissaolo.
- [x] **Worker parantaa itsensä deployssa.** `GET /demographics` rakentaa taulukon kerran
      paikan päällä jos avainta ei ole, jo tallessa olevista pelaajatiedostoista.
      Ilman tätä pelaajan olisi pitänyt julkaista **uudestaan** nähdäkseen ruudun jonka
      oli jo ansainnut — huono ensivaikutelma ominaisuudesta jonka koko tehtävä on kertoa
      missä hän on. Nollan pelaajan tapauksessa se on yhä `204`.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1090**) + `pnpm build` vihreä.
- [x] e2e `dialogs.spec.ts` +1 ja yksi kiristetty, molemmat desktopilla 12/12:
      - `route.fulfill({ status: 404 })` → *"could not be reached"*, **eikä** *"No realm
        has published yet"*, ja Try again näkyy. Tämä on tasan se tilanne joka johti
        Infiniten harhaan, ja se on nyt testi.
      - Tyhjän maailman testi syöttää nyt **204**:n eikä nojaa siihen että verkkoa ei ole.
        Vanha versio olisi mennyt läpi myös rikkinäisellä koodilla.
- [ ] **Deploy** (`wrangler deploy` hakemistossa `apps/worker`). *(Infinite ajaa.)*
      Sen jälkeen `GET /demographics` vastaa 200:lla **ilman uutta julkaisua**.

## Opetus, kirjattuna

Kun kolme eri syytä tiivistetään yhdeksi käyttäjälle näkyväksi lauseeksi, se lause on
väärä ainakin kahdessa niistä. Tässä väärä tapaus osui ensimmäisenä avaajaan.

Ja tarkemmin: **ominaisuuden odottava deploy on tila, ei tyhjyys.** Se pitää suunnitella
näkyväksi silloin kun tiketti kirjoitetaan, ei silloin kun joku törmää siihen.

## Ei tässä

- **Workerin testit.** Sama arvio kuin CODEX-001:ssä; sen lisäys on tässä kuusi riviä.
- **Uudelleenyritys itsestään.** Try again riittää: Codex on ruutu jolla käydään, ei
  taustaprosessi, eikä sen kuulu jauhaa verkkoa auki toivoen.
