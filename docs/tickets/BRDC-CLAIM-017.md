# BRDC-CLAIM-017 — Last visitor owns it: a different ruleset than the siege model

| | |
|---|---|
| **Alue** | `packages/core/src/rules/decay.ts`, `capture.ts`, `apps/worker/src/index.ts` (merge), `claude.md` §11 |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | XL — muuttaa pelin ydinsäännön, ei yhtä tikettiä |
| **Riippuvuudet** | — |
| **Status** | `[ ]` ei aloitettu, **ei suunniteltu vielä** — kirjattu sanasta sanaan
  2026-09-23. Infinite: *"tärkein... otetaan nyt sääntösetiksi"*, mutta samassa
  viestissä: *"tehdään isompia muutoksia ensiviikon alusta"* — luen nämä yhdessä
  päätökseksi jonka Infinite on tehnyt, mutta jonka toteutus alkaa ensi viikolla |

## 🔴 RED

Infinite 2026-09-23, sanatarkasti: *"tärkein, on että otetaan nyt sääntösetiksi niin
että se, joka on viimeisenä käynyt alueella omistaa sen.. viimeisin kellonaika
ratkaisee, uudet resurssit saa vain päivittää sen mukaan kuka omistaa maan. Vanha
kartta tiedosto voi olla pohjana, mutta kulkija omistaa heti vanhan kuningaskunnan
maat."*

Luen tämän kolmena osana:

1. **Omistus ei enää ole piiritys/vahvuus vaan viimeisin käynti.** Se joka viimeksi
   asteli heksalle omistaa sen — ei väliä kuinka vahva edellinen omistaja oli
2. **Resurssien päivitys seuraa omistajuutta.** Uudet resurssit (tuotanto,
   varastokatto — `ECON-001`in koko malli) kertyvät vain sille kellä on omistus
   sillä hetkellä
3. **Vanha `world.json` on pohja, ei totuus.** Kun tämä otetaan käyttöön, kukaan ei
   automaattisesti omista mitään vanhan datan perusteella — ensimmäinen kulkija
   jonka heksalle astuu, omistaa sen heti, vanha kartta vain kertoo mitä siellä on
   (maasto, resurssit)

## ⚠️ Tämä on ristiriidassa `claude.md` §11:n kanssa, kirjaimellisesti

> *"Siege model, not instant flip... Enemy cells take `strength -= attackPower`; they
> only change owner when strength reaches 0... Taking someone's established home
> block should require two or three separate walks on separate days. **Do not
> "simplify" this back to a single comparison.**"*

Tämä tiketti pyytää täsmälleen sitä minkä §11 nimeltä kieltää. En ole muuttanut
`claude.md`ia — se on totuuden lähde kunnes Infinite vahvistaa muutoksen kirjallisesti
(`claude.md`in oma sääntö: "jos tämä tiedosto on eri mieltä [tikettien] kanssa, korjaa
se tässä heti"). Tämä RED on se korjaus odottamassa vahvistusta, ei hiljainen ohitus.

## 🔴 Avoimet kysymykset — nämä on ratkaistava ennen kuin GREEN voidaan kirjoittaa

- **Korvaako tämä piiritysmallin kokonaan, vai vain uudella maalla / tietyssä
  tilanteessa?** Jos korvaa kokonaan: `decay.ts` (rappio), koko `capture.ts`
  (`attackPower`, `BASE_STRENGTH`/`MAX_STRENGTH`), `NEIGHBOUR_BONUS`, `ANCHOR_BONUS` —
  suuri osa §11:n vakioista muuttuu merkityksettömäksi
- **Mitä tapahtuu Wagerille** (`WAGER-JSON`/`WAGER-BATTLE`-sarja)? Se koko mekaniikka
  on rakennettu piiritys/puolustus-mallin päälle (`Combatant`, `Defence`,
  `wagerBattle.ts`). Jos omistus on aina "viimeisin käynti", mitä kaksintaistelu
  enää ratkaisee?
- **Koskeeko tämä myös reittimoodia?** `BRDC-MODE-002` (juuri pushattu tässä
  sessiossa) rakensi täsmälleen päinvastaisen lupauksen reittimoodille: pelaajan oma
  heksa ei koskaan rapaudu eikä sitä voi viedä *keneltäkään*, ei edes seikkailumoodin
  rivaalilta. "Viimeisin käynti omistaa" kumoaisi tämän suoraan jos sitä sovelletaan
  reittimoodiinkin. Oma tulkintani: tämä sääntö koskee vain Seikkailumoodia, koska
  reittimoodin koko pointti on ettei sillä ole taistelua — mutta tämä pitää vahvistaa
  ääneen, ei olettaa
- **Anti-cheat-vaikutus** (§15): jos yksi askel riittää omistukseen, nopea
  kävely/pyöräily rajan yli (jo rajoitettu `MAX_SPEED_MS`illa) muuttuu ainoaksi
  hyökkäysvektoriksi — koko siirto-nopeuden validointi kantaa nyt koko
  anti-cheatin painon, ei enää vain yhden kerroksen niistä monesta
- **Mitä "uudet resurssit saa vain päivittää sen mukaan kuka omistaa maan"
  tarkoittaa tarkkaan?** Tuoko tämä muuta muutosta `ECON-001`in tuotantomalliin kuin
  sen mikä on jo totta (omistaja kerää oman maansa tuoton)? Vai onko kyse siitä että
  edellisen omistajan varastoitunut tuotanto/rakennukset nollautuvat vaihdossa?

## Ei tässä (kunnes vahvistettu)

- **Ei koodia tässä sessiossa.** Tämä on RED-tason kirjaus, ei suunnitelma —
  Infiniten oma sana: isommat muutokset alkavat ensi viikolla
- **Ei `claude.md` §11:n muokkausta ennen kuin yllä olevat kysymykset on käyty läpi**
  Infiniten kanssa ja toteutuksen laajuus on selvä
