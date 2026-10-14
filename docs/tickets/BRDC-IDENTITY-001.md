# BRDC-IDENTITY-001 — Palautuskoodi: sama julkinen nimi ja klaani uudella laitteella

| | |
|---|---|
| **Alue** | `apps/worker/src/index.ts`, `apps/game/src/features/identity/` (uusi) |
| **Vaihe** | 3 — Sivilisaatio (multiplayer-sarja) |
| **Effort** | S |
| **Riippuvuudet** | ei mitään pakollista — voi rakentaa itsenäisesti `BRDC-CLAN-*`-sarjasta, hyötyy siitä kun klaanijäsenyys on olemassa palautettavaksi |
| **Status** | `done` — 2026-10-14 (v0.11.9); Workerin julkaisu Infiniteltä |

## 🔴 RED

Infinite 2026-09-17: *"voidaanko me ton cloudflaren kautta tehdä myös kirjautumiset
ilman tietokantaa."* Pelaajan identiteetti on tänään satunnainen UUID paikallisesti
(`profileStore.ts`), ilman mitään tapaa todistaa "tämä olen minä" toiselta laitteelta.
Jos puhelin vaihtuu tai peli asennetaan uudelleen, entinen nimi/klaani ei seuraa
mukana — vain uusi, tyhjä identiteetti syntyy.

**Rajaus joka on sanottava ääneen ennen mitään muuta:** tämä EI palauta pelaajan
kuningaskuntaa (omistetut heksat, XP, rakennukset). Se elää yhä vain sen laitteen
IndexedDB:ssä eikä ole siirtymässä minnekään — se olisi oma, paljon isompi
ominaisuutensa (käytännössä sitä mitä Vaihe 5 / Supabase on varattu tekemään
`CLAUDE.md`in oman vaihetaulukon mukaan). Tämä ratkaisee vain: sama **julkinen** nimi
ja klaanijäsenyys tunnistetaan uudella laitteella, koska ne ovat jo Workerin KV:ssä
jokaisen `player:<id>`-tiedoston mukana.

## 🟢 GREEN

- [x] Worker: kun pelaaja julkaisee ensimmäistä kertaa (ei vielä palautuskoodia
      olemassa), generoidaan lyhyt, ihmisen kirjoitettavissa oleva koodi (esim. kolme
      tavallista sanaa + kaksi numeroa) ja talletetaan `recovery:<koodi> -> playerId`
      KV:hen. Koodi palautetaan `/submit`in vastauksessa **kerran**, asiakas tallettaa
      sen paikallisesti ja näyttää sen pelaajalle kertaalleen ("kirjoita tämä muistiin")
- [x] Worker: uusi `POST /recover {code}` — jos koodi löytyy, palauttaa
      `{playerId, name, nation, banner, clanId}` (kaikki jo julkisesti tallennettu
      `player:<id>`-tiedostossa, ei mitään uutta arkaluontoista)
- [x] Asiakas: asetuksiin/otsikkoruutuun "Minulla on jo identiteetti" -kenttä.
      Syötetty koodi → paikallinen `profile.id`, nimi, kansallisuus, lippu ja
      klaanitila korvataan palautetuilla arvoilla. **Paikallinen peliaineisto
      (heksat, XP, rakennukset) koskematon** — tämä muuttaa vain sitä keneksi
      seuraava julkaisu tunnistautuu
- [x] UI sanoo rajauksen suoraan: *"Tämä palauttaa nimesi ja klaanisi tälle
      laitteelle. Aiempi kuningaskuntasi pysyy sillä laitteella jolla se on."*
- [x] Ei salasanaa, ei sähköpostia, ei ulkoista tiliä — yksi KV-avain per koodi.
      Sama rehellinen luottamusmalli kuin kaikkialla muualla pelissä: koodin tietävä
      *on* se pelaaja pelin silmissä, aivan kuten id:n tietävä jo tänään voi julkaista
      sen alla (`CLAUDE.md` §9: oikea todennus on varattu Vaiheeseen 5)
- [~] Portti: `lint:lines`, `tsc -b`, vitest (2115), `pnpm build` vihreänä; e2e `identity.spec.ts`
      360 px vihreä (`/recover` korvattu reitityksellä). `/recover` Workerissa käsin todentamatta —
      vaatii Infiniten `wrangler deploy`n

## Todennus

Suunnitelmavaihe. Toteutusvaiheessa: tuntematon koodi → `404`, ei tietovuotoa
(vastaus ei paljasta onko koodi koskaan olemassakaan ollut vs. väärin kirjoitettu);
oikea koodi palauttaa täsmälleen sen mitä `player:<id>` kantaa; paikallinen
peliaineisto (testattu esim. omistettujen solujen määrä) ei muutu palautuksen
yhteydessä — vain profiili- ja klaanikentät.

## Ei tässä

- **Oikea autentikointi.** `CLAUDE.md` §9 varaa tilit ja palvelinvahvistetun
  omistuksen nimenomaan Vaiheelle 5 — tämä ei yritä olla sitä, eikä sitä pidä
  markkinoida pelaajille sellaisena
- **Kuningaskunnan siirto laitteiden välillä.** Rajattu pois yllä, tarkoituksella —
  oma, isompi ominaisuutensa jos siihen joskus mennään
- **Koodin uudelleengenerointi / vanheneminen.** MVP:ssä koodi on pysyvä niin kauan
  kuin `player:<id>` on olemassa KV:ssä (sama 30 vrk TTL kuin muullakin dataa) —
  ei "unohdin koodini" -palautuspolkua, koska mitään toista todennuskeinoa ei ole
  jolla sen voisi korvata ilman oikeaa tiliä

## Päätös 2026-10-13 (kysely)

Rakennetaan sellaisenaan (S): palautuskoodi tuo julkisen nimen ja klaanin uudelle laitteelle. Valtakunta ei siirry (Vaihe 5).

## Tehty 2026-10-14

- Worker `recovery.ts`: koodi (kolme sanaa + kaksi numeroa) annetaan ensimmäisestä `/submit`ista
  kerran (`recovery:<koodi>`, `recovery-of:<id>`); `/recover` palauttaa id:n, nimen, kansan,
  lipun ja klaanin nimen; viisi yritystä minuutissa per osoite. `recovery.test.ts` (3).
- **Rajauksen tarkennus:** profiilin id vaihtuu, joten **omat solut kirjataan uudelle id:lle**
  (`adoptIdentity`) — muuten oma maa muuttuisi rivaalin maaksi. Heksat, rakennukset, XP ja pussi
  pysyvät ennallaan. `identity.repo.test.ts` (2).
- You-ruutu: *Your identity* — koodi näkyy kun se on saatu; *I already have an identity*
  -kenttä palauttaa ja lataa sivun uudelleen.
