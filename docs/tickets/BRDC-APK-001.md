# BRDC-APK-001 — Taskussa nauhoittava APK: latauslinkki pelistä, ja sen GPX playbackina

| | |
|---|---|
| **Alue** | `features/hud/` tai `features/vigil/` (latausdialogi), `features/playback/` (tuotantoon), `features/gpx/` |
| **Vaihe** | 2.6 / 4 — taskussa kävely |
| **Effort** | S–M |
| **Riippuvuudet** | BRDC-SIM-002 (playback), BRDC-GPX-001 (GPX-tuonti); APK rakennetaan erikseen toisella koneella (Infinite) |
| **Lähde** | Infinite 2026-10-13 (kysely, VIGIL-002): *"muistaakseni ääni pelkästään ei riitä pitämään ruutua auki.. haluan että käyttäjä saa myös linkin mistä voi ladata apk:n, rakennan sitä toisella koneella. Joko tarvitaan modaalinen dialogi tms.. mut siis kohta integroidaan erillinen apk, mikä tallentaa .gpx:n ja sen voi sit ajaa playbackinä"* |
| **Status** | `in-progress` — playback valmis v0.11.13 (2026-10-16); latauslinkki odottaa URL:ää |

## 🔴 RED

Selain ei pidä viivaa lukitussa puhelimessa (VIGIL-002: ääni yksin ei riitä). Infinite
rakentaa erillisen APK:n, joka nauhoittaa kävelyn GPX:ksi taskussa. Pelissä ei ole tapaa
ohjata pelaajaa sen luo, eikä APK:n tallentamaa GPX:ää voi toistaa: playback on vain
dev-tilassa (`PlaybackDev`, P-näppäin).

## 🟢 GREEN

- [ ] **Latauslinkki**: modaalinen dialogi (Vigilin vieressä, ja Oppaan *Vigil*-sivulta),
      joka kertoo miksi APK ja antaa linkin. Näkyy Androidilla; muualla sanoo ettei APK:ta
      ole sille alustalle
- [x] **APK:n GPX playbackina tuotannossa**: *Import a walk* lukee tiedoston ja tarjoaa
      *Play ×5 / ×20 / ×60* tai *Walk it in at once*. Play sulkee paneelin ja toistaa
      kävelyn kartalla (`usePlayback`): kartta seuraa, heksat paljastuvat ja valtautuvat
      kuin kävellen, samat suodattimet kuin elävälle GPS:lle. Toisto on itsenäinen kuten
      tuonti (GPX-005: ei vaadi omaa maata). Kartan yläpinossa soitin (`WalkPlayer`):
      edistyminen, Pause/Play, tahti ×5/×20/×60, Stop — lopussa *played through* ja Close
- [x] Virheellinen tiedosto sanoo vikansa heti valittaessa, ei vasta napista
- [~] e2e 360 px: GPX toistuu ×60 loppuun ja soitin sulkeutuu (`gpx.spec.ts`, +1) —
      latausdialogin osa odottaa URL:ää
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Kysymykset Infiniteltä

1. **Mistä APK ladataan?** GitHub Releases -sivu, Pages-polku vai muu URL? Linkki on
   konfiguraatio, ei salaisuus — mutta se tarvitaan ennen kuin dialogi voi luvata mitään.
2. ~~**Playback vai tuonti?**~~ **Päätetty 2026-10-16: molemmat, valinta tuodessa.**
   Infinite: *"haluan nähdä siis tän playback simulaationa.. käyttäjä painaa play, valitsee
   nopeuden ja kartta antaa playbackinä mitä tapahtuu pelissä.. eli käytännössä heksat
   paljastuvat"*. Alkuperäinen kysymys: GPX-001 tuo jo nauhoitetun kävelyn kerralla (valtaukset
   heti). *Playback* toistaa sen ajassa, kartta seuraa. Kumpi APK:n tiedostolle — vai
   molemmat, valinta tuodessa?
3. **Aikaleimat** (playback siirtää kävelyn nykyhetkeen kuten dev-playback; tuonti pitää
   alkuperäiset — kysymys koskee yhä tuontia): hyväksytäänkö menneisyydessä nauhoitettu kävely sellaisenaan (päivän
   vahvistukset osuvat nauhoituspäivään), vai siirretäänkö se nykyhetkeen kuten dev-playback?
