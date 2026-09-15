# BRDC-MAP-005 — Kartan päällä kelluva kerros: yksi omistaja ruudun reunoille

| | |
|---|---|
| **Alue** | `hud/MapNotices.tsx`, `hud/FirstLook.tsx`, Guide-ilmoitus, `ClaimBurst`, `PouchGain`, `CameraControl`, `tutor/UnlockMoment.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Status** | `todo` — suunniteltu 2026-09-09 (UI-viilaussuunnitelma, kohta 3), kirjattu tiketiksi 2026-09-15 |
| **Lähde** | Infinite 2026-09-09: *"nyt tuossa kartan päällä esim näkyy notifikaatio"* · 2026-09-15: *"laita joku malli millä tiedot ei rendaa päällekkäin"* |

## 🔴 RED

Kartan päällä kelluvilla DOM-elementeillä ei ole omistajaa. Jokainen laskee oman
paikkansa (`position: fixed`, oma `inset`), eikä mikään tiedä muista.

- `MapNotices` pinoaa jo omat ilmoituksensa (BRDC-HUD-004), mutta vain keskenään
- **Havaittu 2026-09-15, 360×780** (`BRDC-SIGIL-006`:n kuvakaappaukset):
  - **FirstLook-vihje** *"Walk into the hex beside yours."* piirtyy **solupaneelin otsikon
    päälle** — *"A place of trade (surveyed) · Yours"* on lukukelvoton sen alla
  - **Guide-ilmoitus** *"The Guide has a new page · The Hearth"* samassa kohdassa
  - **Opastusdialogin "Not now" jää tilapaneelin alle** — ks. `BRDC-TUTOR-004`, sama
    z-taso (`--z-hud`) kuin HUD

Karttamerkkien puoli samasta pyynnöstä on `BRDC-SIGIL-006` (slottitaulu). Tämä on DOM-puoli.

## 🟢 GREEN

- [ ] Yksi kelluva kerros omistaa ruudun yläreunan: vihjeet ja ilmoitukset **pinoutuvat**
      yhteen sarakkeeseen, eivät laske omaa paikkaansa
- [ ] Avoin paneeli (solu, Keep) **ohittaa** yläreunan vihjeet — ne väistyvät tai odottavat,
      eivät piirry otsikon päälle
- [ ] Kuvakaappaus 360×780: solupaneeli auki + FirstLook + Guide-ilmoitus → ei päällekkäisyyttä
- [ ] `--hud-height`in fallbackit yhdeksi arvoksi

## Ei tässä

- `UnlockMoment`in modaalisuuspäätös — `BRDC-TUTOR-004`
