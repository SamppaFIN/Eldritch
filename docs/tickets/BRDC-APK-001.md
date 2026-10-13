# BRDC-APK-001 — Taskussa nauhoittava APK: latauslinkki pelistä, ja sen GPX playbackina

| | |
|---|---|
| **Alue** | `features/hud/` tai `features/vigil/` (latausdialogi), `features/playback/` (tuotantoon), `features/gpx/` |
| **Vaihe** | 2.6 / 4 — taskussa kävely |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-SIM-002 (playback), BRDC-GPX-001 (GPX-tuonti); APK rakennetaan erikseen toisella koneella (Infinite) |
| **Lähde** | Infinite 2026-10-13 (kysely, VIGIL-002): *"muistaakseni ääni pelkästään ei riitä pitämään ruutua auki.. haluan että käyttäjä saa myös linkin mistä voi ladata apk:n, rakennan sitä toisella koneella. Joko tarvitaan modaalinen dialogi tms.. mut siis kohta integroidaan erillinen apk, mikä tallentaa .gpx:n ja sen voi sit ajaa playbackinä"* |
| **Status** | `todo` |

## 🔴 RED

Selain ei pidä viivaa lukitussa puhelimessa (VIGIL-002: ääni yksin ei riitä). Infinite
rakentaa erillisen APK:n, joka nauhoittaa kävelyn GPX:ksi taskussa. Pelissä ei ole tapaa
ohjata pelaajaa sen luo, eikä APK:n tallentamaa GPX:ää voi toistaa: playback on vain
dev-tilassa (`PlaybackDev`, P-näppäin).

## 🟢 GREEN

- [ ] **Latauslinkki**: modaalinen dialogi (Vigilin vieressä, ja Oppaan *Vigil*-sivulta),
      joka kertoo miksi APK ja antaa linkin. Näkyy Androidilla; muualla sanoo ettei APK:ta
      ole sille alustalle
- [ ] **APK:n GPX playbackina tuotannossa**: tiedosto valitaan, reitti toistetaan pelissä
      (`usePlayback`), ja valtaukset tapahtuvat kuin kävellen — samat anti-cheat-säännöt
      kuin elävälle GPS:lle
- [ ] e2e 360 px: dialogi aukeaa ja linkki on oikea; GPX-fixture toistuu ja valtaa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Kysymykset Infiniteltä

1. **Mistä APK ladataan?** GitHub Releases -sivu, Pages-polku vai muu URL? Linkki on
   konfiguraatio, ei salaisuus — mutta se tarvitaan ennen kuin dialogi voi luvata mitään.
2. **Playback vai tuonti?** GPX-001 tuo jo nauhoitetun kävelyn kerralla (valtaukset
   heti). *Playback* toistaa sen ajassa, kartta seuraa. Kumpi APK:n tiedostolle — vai
   molemmat, valinta tuodessa?
3. **Aikaleimat**: hyväksytäänkö menneisyydessä nauhoitettu kävely sellaisenaan (päivän
   vahvistukset osuvat nauhoituspäivään), vai siirretäänkö se nykyhetkeen kuten dev-playback?
