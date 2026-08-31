# BRDC-INSPECT-001 — Maan tieto: heksan popup ja klikattava kotipesä

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WARD-001, BRDC-TERRAIN-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten pyyntö 2026-08-29 |

## 🔴 RED

Heksan napautus avasi paneelin joka kuvaili solua **kertomatta koskaan miksi kukaan
haluaisi sen**. Maasto luki "yields timber" eikä mikään sanonut paljonko, milloin, tai
mitä naapureille tapahtuu.

Ja kotipesä oli pelkkä merkki. Kartan ainoa solu joka koskee koko lääniä eikä itseään ei
vastannut napautukseen mitenkään, eikä oman alueen tilastoja päässyt katsomaan mistään.

## 🟢 GREEN

- [x] Solupaneeli kertoo **mitä omistaminen antaa**: pinta-ala, kertapalkkio, tuntituotto
- [x] …ja naapuribonuksen, joka on **näkymätön kaikkialla muualla** vaikka se on syy
      miksi alue on enemmän kuin osiensa summa
- [x] Kotipesä avaa **oman läänin näkymän**: solut, pinta-ala, vahvin, temppelit
- [x] Tuotanto lukuna — se selittää miksi yksi kävely oli arvokkaampi kuin toinen
- [x] Varoitus: montako solua haipuu vuorokaudessa ja milloin ensimmäinen
- [x] **Toiminto varoituksen vieressä:** "Show the first to fade" avaa juuri sen solun
- [x] **Wagerille ovi kartalta** — se korjaa `BRDC-WAGER-JSON-001`:n tiedossa olleen
      rajoitteen, jonka mukaan haasteen lähettäminen vaati kävelyn lopettamista
- [x] `dominionOf` on puhdas funktio, 7 testiä
- [x] Temppelit avaavat tavallisen solupaneelin — ne ovat yhä pelkkää maata

## Toteutus

**Ankkurimerkki kaappaa napautuksen soluruudulta**, koska se on pienempi ja
tarkoituksellisempi kohde: kuuntelija rekisteröidään myöhemmin ja tasoille jotka
piirtyvät päälle.

`dominionOf` on puhdas, koska useampi näistä luvuista on helppo saada hienovaraisesti
väärin — tuottoluku joka laskee mukaan tuottamattomat solut, tai "heikoin" joka valitsee
solun jonka Tyhjyys on jo ottanut. Väärä luku tässä luetaan pelin valheena.

**Heikoin ei ole heikoin vaan lähinnä menetystä.** Ne ovat eri kysymyksiä: vahva solu
jota kukaan ei ole kävellyt kolmeen viikkoon on lähempänä Tyhjyyttä kuin tuore heikko.

`MapView` ylitti 400 riviä, joten valinta ja sen paneelit ovat nyt `useSelection`.
Se on aito sauma: kaikki siinä vastaa kysymykseen *mistä solusta tässä on kyse*.

## Ei tässä

- Rakennukset. Paneeli kertoo mitä maa antaa; mitä sillä *rakennetaan* on oma tikettinsä.

## Jatko — 2026-08-31

> *"Ei tässä: Rakennukset. Paneeli kertoo mitä maa antaa; mitä sillä rakennetaan on
> oma tikettinsä."*

Se tiketti on `BRDC-BUILD-001`.

Solupaneeli on rakentamisen käyttöliittymä, joten se kasvaa kolmella:

- **Mitä tähän voi rakentaa** ja miksi ei muuta — `BRDC-BUILD-001`, `-002`
- **Heksan historia**: löytäjä, keneltä otettu, monenako päivänä omistettu — `BRDC-HEX-001`
- **Tuotantoennuste** eikä vain nykytila — `BRDC-STATS-001`

Tämän tiketin sääntö pätee jokaiseen niistä: *"Väärä luku tässä luetaan pelin valheena."*
