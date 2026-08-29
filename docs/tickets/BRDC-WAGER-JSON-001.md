# BRDC-WAGER-JSON-001 — Haasta kaveri: moninpeli ilman palvelinta

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-005, BRDC-HEARTH-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | `files/pelin-suunnittelumuistiinpanot.md` · `PIVOT-2026-08-27.md` |

## 🔴 RED

Peli on yksinpeli eikä siitä pääse mihinkään ennen Vaihetta 3. Kartalla on kolme
siemennettyä vastustajaa jotka eivät ole kenenkään, eikä oman läänin näyttäminen
kaverille onnistu millään.

## 🟢 GREEN

- [x] Oman pyhäkön vienti **tekstinä**: solut, vahvuudet, nimi, taso, Ankkurikivi
- [x] Tuonti: kaverin maa ilmestyy kartalle vastustajan omistamana
- [x] **Tarkistussumma** — repaleinen viesti tunnistetaan, ja se sanotaan ääneen
      *mitä se on*: torso-tunnistin, ei tietoturva
- [x] Oma vienti hylätään omassa pelissä (`yourself`) — muuten olisit oma vastustajasi
- [x] **Tuonti ei koskaan vie pelaajan omaa maata.** Viesti kaverilta ei ole valtaus
- [x] Tuotu maa rappeutuu **tuontihetkestä**, ei lähettäjän kellosta
- [x] Kaikki hylkäykset ovat nimettyjä syitä, ei poikkeuksia — jokaisesta tulee lause
- [x] Katto 2 000 solua; ylivuoto pudottaa heikoimmat, ei satunnaisia
- [x] 18 yksikkötestiä, 7 repositoriotasolla, 3 e2e:tä kahden selainkontekstin välillä

## Toteutus

Muoto on `data/challenge.ts` — puhdas, ei tallennusta. Tallennuspuoli on `data/wager.ts`.
`CHALLENGE_VERSION` on erillinen `SAVE_VERSION`:sta: tallennus ja kahden puhelimen
välinen viesti muuttuvat eri syistä.

**Mukana kulkee vain se mitä toisen pelaajan täytyy nähdä.** Ei jälkiä, ei dwell-aikaa,
ei resurssipussia — eikä mitään millä haaste voisi kirjoittaa vastaanottajan tallennuksen
uusiksi.

**Tarkistussummasta rehellisesti:** se nappaa viestin jonka chat-sovellus katkaisi, ei
ihmistä joka muokkaa vahvuutensa isommaksi. Clientillä ei voi tehdä jälkimmäistä, ja
teeskentely olisi pahempaa kuin myöntäminen. Auktoriteetti asuu Vaiheen 3 palvelimella.

Haaste asuu nimikkoruudulla, ei HUDissa: sen lähettäminen tehdään istuen, ja kävelyn
HUDilla on mitattu 30 %:n budjetti jonka viides painike rikkoisi.

## Tiedossa oleva rajoite

~~Wageriin pääsee vain kävelyn jälkeen.~~ **Korjattu `BRDC-INSPECT-001`:ssä:** oman
kotipesän napauttaminen avaa läänin näkymän, ja Wagerin ovi on siellä. Seisominen omalla
ankkurikivellään on parempi paikka tulla kysytyksi kuin nimikkoruutu.

## Ei tässä

- Taistelun ratkaisu. Päätetty 2026-08-29 ja tehty: `BRDC-WAGER-BATTLE-001`.
  Tulosta ei palauteta lainkaan — molemmat laskevat sen samoista syötteistä.
