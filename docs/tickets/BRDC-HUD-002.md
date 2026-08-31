# BRDC-HUD-002 — HUD: omistetut solut ja vahvin alue

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-CLAIM-006, BRDC-HUD-001 |
| **Status** | `done` — 2026-08-27 (1 kohta auki) |
| **Valmius** | 90 % |

## 🔴 RED

Pelaaja ei näe montako solua omistaa, kuinka suuri alue on, eikä mitä lenkin
sulkeutuminen juuri teki. Ilman palautetta mekaniikka jää näkymättömäksi.

## 🟢 GREEN

- [x] HUD näyttää: **omistetut solut**, pinta-ala (m² / km²), vahvin alue
- [x] Lenkin sulkeutuessa näytetään tulos lore-sävyisenä:
      *"12 cells awakened · 3 corrupted · 1 reinforced"*
- [x] Vapautuvista soluista tulee tapahtuma **"The Void reclaims"**
- [x] Rappeutumisvaroitus: **48 h ennen vapautumista** HUD sanoo montako solua hiipuu
      ja milloin ensimmäinen menee ("2 cells fade in 2 days — walk them")
- [x] Käyttöliittymän sanasto on lore-sanastoa, ei koodisanastoa
- [x] 360 px viewportilla HUD mahtuu ilman vieritystä

## Toteutus

**Sanasto** (`files/CLAUDE.md` §Domain model) — käytä käyttöliittymässä johdonmukaisesti:

| Koodi | Käyttöliittymä |
|---|---|
| trail | Ley-line |
| claim / loop closure | Awakening the Ground |
| steal | Corruption |
| cell | Warded Cell |
| level | Consciousness Level |
| leaderboard | Codex of Dominion |

**Rappeutumisvaroitus on tärkeämpi kuin miltä kuulostaa.** Pelin ydinsilmukka on
"kävele säännöllisesti samoja reittejä". Jos pelaaja ei näe alueensa hiipuvan, hän
huomaa menetyksen vasta kun se on tapahtunut — eikä palaa.

Pinta-ala: **mitattu `h3.cellArea`lla**, ei kerrottu nimellisarvolla — res-11-solu on
Tampereen leveydellä ~1 622 m², ei 2 150 m².

## Testit

- [x] Solumäärä päivittyy lenkin sulkeuduttua
- [~] Tulosviesti testattu `awakened`-tapaukselle e2e:ssä. Muut kolme yksikkötesteissä
- [x] Kellon kelaus +10 vrk → varoitus ilmestyy (e2e `decay.spec.ts`)
- [x] Kellon kelaus +16 vrk → solut vapautuvat, HUD putoaa nollaan (e2e)
- [x] 360 px viewport ajetaan ensin

> **HUD kasvoi yli oman sääntönsä.** Aluetilastojen lisääminen vei sen 30,5 %:iin
> ruudun korkeudesta — juuri yli rajan jonka asetin itse. Kaksi korjausta:
>
> 1. Signaali ja `Withdraw` jakavat rivin. 238 px → 206 px.
> 2. Tilastot ovat **yksi ruudukko**, kaksi saraketta puhelimessa ja neljä kun leveyttä
>    on. Kahtena erillisenä rivinä ne maksoivat kartalle kymmenyksen ruudusta pelkän
>    merkkauksen takia.
>
> **HUDin tekstitiheys on kiinteä**, ei `clamp()`-skaalattu. Skaala kasvaa näkymän
> mukana, mikä on oikein leipätekstille ja väärin mittaripaneelille: leveällä ja
> matalalla ikkunalla se paisutti HUDia. Lopputulos 26 % molemmilla näkymillä.

## Ei kuulu tähän tikettiin

Codex of Dominion -tulostaulu (Vaihe 3, vaatii moninpelin). Achievementit (Vaihe 6).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 7 · `files/CLAUDE.md` §Domain model · `MASTERPLAN.md` §2.1

## Korjattu jälkikäteen — 2026-08-28

Kaksi lukukelpoisuusvirhettä, molemmat näkyvissä ensimmäisessä kuvakaappauksessa:

1. **`CONSCIOUSNESSLEY-LINE`.** Neljän sarakkeen taite oli 34 rem, jolloin sarake on
   noin 8 rem ja `CONSCIOUSNESS` on yksi katkeamaton sana sitä leveämpi. Ruudukko ei
   vuotanut yli — teksti vuoti. Taite on nyt 44 rem, ja otsikko katkeaa ennemmin kuin
   peittää naapurinsa.
2. **Nolla luki laatikkona.** Ei tofua: Orbitronin nolla on *viivattu nolla*
   (3 ääriviivaa, kun O:ssa on 2), ja 1 rem koossa viiva sulkee sisuksen. Lukuarvot
   ovat nyt 1,1 rem, ja tyhjä tila piirretään ajatusviivana — rivi nollia sanoo
   uudelle pelaajalle "rikki", ei "et ole vielä aloittanut".

## Budjetti ylittyi ja korjattiin — 2026-08-28

`trail-detail.spec.ts` mittaa että HUD jättää kartalle 70 % ruudusta. Vaiheen 2.5
lisäykset veivät sen **42 %:iin**: pussi omalla rivillään, Vigil omallaan, "This ground"
omallaan. Mitattuna, ei arvattuna — `HUD 299px / 780`.

Korjaus kolmessa osassa:

1. **Pussi siirtyi tilastoruudukkoon** ja korvasi kohdan *Strongest*. Tämä poistaa yhden
   tämän tiketin GREEN-kohdista tietoisesti: vahvin alue on luku jolle ei voi tehdä
   mitään, puu on luku jolla voi vahvistaa solun. Solukohtainen vahvuus näkyy nyt
   `CellPanel`issa, jota ei ollut kun tämä tiketti kirjoitettiin.
2. **Vigil hajosi kahtia:** kytkin meni toimintorivin painikkeeksi ja tila liitettiin
   signaaliriviin. Ne vastaavat samaan kysymykseen — kuinka hyvin peli näkee sinut —
   eikä paneelissa ollut tilaa kysyä sitä kahdesti.
3. **Jalkarivi pinottiin:** signaali omalle riville, painikkeet alle. Vierekkäin
   signaaliteksti puristui kahdelle-kolmelle riville painikkeiden viereen — 84px yhdestä
   lauseesta.

Lopputulos **205px / 780 (26 %)** puhelimessa ja **208px / 720 (29 %)** matalassa
työpöytäikkunassa.

**Neljän sarakkeen taite poistettiin kokonaan.** Se ei mahdu koskaan: paneeli on
katkaistu 30 remiin, joten neljäsosasarake on enintään 6 rem, ja levein *arvo*
("12 · 400 m²", tai kolme resurssilukua) tarvitsee noin yhdeksän. Otsikot eivät olleet
rajoite — luvut olivat. Kaksi saraketta, joka leveydellä.

## Jatko — 2026-08-31

Kaksi saraketta, kolme resurssia. Kehityssuunnitelma tuo **kymmenen** resurssia
(`BRDC-ECON-001`), ja tämän tiketin oma mittaus kertoo, ettei ratkaisu ole kolmas sarake:

> *"levein arvo tarvitsee noin yhdeksän [remiä]. Otsikot eivät olleet rajoite — luvut olivat."*

HUD näyttää siis jatkossa vain sen, mikä **muuttuu tai on loppumassa**; koko lompakko ja
tuotantoennuste asuvat `BRDC-STATS-001`:ssä. Tämä on mittaustulos, ei mieltymys —
360 px ei veny.
