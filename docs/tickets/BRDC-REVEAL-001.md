# BRDC-REVEAL-001 — Heksan paljastus: sumu, kortti ja harvinaisuus

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-AWAKEN-001, BRDC-TERRAIN-002, BRDC-HEX-001 |
| **Status** | `done` — 2026-10-13: rakentui myöhempien tikettien alla (CLAIM-009, REVEAL-002, ART-005, ART-008); tarkistettu |
| **Valmius** | 25 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §4, §6 (P1–P3), §8.1 |

## 🔴 RED

Uusi solu ilmestyy kartalle täytettynä heksana. Se on oikea lopputulos ja täysin
tapahtumaton hetki — eikä pelaaja saa tietää, mitä hän juuri löysi, ennen kuin hän
napauttaa sitä.

`BRDC-AWAKEN-001` teki lenkin sulkeutumisesta tapahtuman. **Yksittäisen heksan
paljastuminen on se hetki, joka toistuu satoja kertoja**, ja se on tällä hetkellä tyhjä.

## 🟢 GREEN

- [x] **Sumu hälvenee**: paljastumaton maa on peitossa, ja peite väistyy solu kerrallaan — sumu (`withFogOfWar`): vain omat solut ja niiden rengas, kävely tuo rajan mukanaan; sää ja Transcendent säätävät renkaita
- [~] **Kortti**: maastotyyppi, nimi, resurssit kuvakkeina, rakennuspaikat — "New ground" -kortti: maaston oma kuva ja nimi (ART-008), harvinaisuus paljastettaessa; resurssit ja rakennuspaikat ovat heksakortissa *Open its card* -napin takana
- [x] **Harvinaisuus** näkyy — tavallinen, harvinainen, legendaarinen — `Rarity`-komponentti, neljä astetta
- [x] Harvinaisuus **ei ole pelkkä väri**: `claude.md` §14 kieltää värin ainoana
      tiedonkantajana. Reunus, teksti ja pyhä geometria kantavat sen myös — asteen sana (`GRADE`) ja lause (`TIER`) värin rinnalla
- [x] Kortti **ei keskeytä kävelyä**: se sulkeutuu itsestään, ja monta paljastusta
      peräkkäin **niputetaan yhdeksi** — kymmenen korttia korttelin varrella on este,
      ei palkinto — **muutettu päätöksellä 2026-09-30:** kortit eivät sulkeudu itsestään vaan odottavat pinona ("N finds waiting" / *Close all*); toiston aikana ne odottavat napin takana
- [x] Ääni on **opt-in ja oletuksena vaiti** (`BRDC-REGRESSION-000` #7) — paljastus ei soi; ainoa ääni on valtauksen kilahdus (sääntö 6, REGRESSION-000 #7)
- [x] `prefers-reduced-motion` pysäyttää animaation, ei sisältöä — `tokens.css`: jokainen keyframe nollataan
- [x] Peittosumun renderöinti testattu 5 000 solulla, kuten `BRDC-CLAIM-006` — `claim.spec.ts` piirtää 5 000 heksaa sumuineen (aikabudjetti on PERF-alaa)

## Toteutus — paljastus on deterministinen, ei arvottu

Suunnitelman §8.1 esittää:

```js
calculateRarity() {
  const roll = Math.random();   // ← tämä ei voi jäädä
  if (roll < 0.01) return 'legendary';
```

**`Math.random()` rikkoo pelin.** Kolme seurausta, joista jokainen yksinään riittää:

1. Kaksi pelaajaa samalla kadulla näkisivät **eri maailman**. `world.json` yhdistäisi
   kaksi ristiriitaista totuutta samasta solusta
2. Sivun lataus uudelleen arpoisi paljastukset uudestaan
3. Vaiheen 3 golden fixture -testit (`claude.md` §16) eivät voi koskaan mennä läpi:
   SQL ja TypeScript eivät voi arpoa samaa lukua

Sisältö on **hash H3-indeksistä**, täsmälleen kuten `terrainOf` jo tekee. Sama solu
antaa saman tuloksen aina, kaikille, ilman verkkoa. Prosentit (1 % ihme, 5 % mysteeri)
säilyvät sellaisenaan — ne ovat kynnyksiä hashin yli, eivät noppia.

Se on myös parempi peli: löytö on **paikassa**, ei onnessa. Kaverille voi sanoa
"käy katsomassa sitä kulmaa", ja siellä on se mitä lupasit.

- [x] `revealOf(h3)` on puhdas ja deterministinen — `rules/reveal.ts`, FNV-1a-hash
      `reveal:${h3}`:sta (sama kuvio kuin `terrainOf`), ei `Math.random()`:ia. Testattu
      tuhannella toistolla + kutsujärjestyksestä riippumattomuudella
- [x] Jakauma testattu ~7500 oikealla H3-indeksillä Tampereelta: `legendary` ~1 %
      (0,3–2,5 % raja), `rare` ~5 % (3–8 %), jokainen taso ±4 % osuudestaan
      (`RARITY_SHARE`)

## Toteutettu 2026-09-01 (commit 1: deterministinen ydin)

`rules/reveal.ts` (puhdas): `Rarity` (`common`/`uncommon`/`rare`/`legendary`),
`revealOf(h3)` — kynnykset hashin yli (`0.01` legendary, `0.06` rare, `0.25` uncommon),
`RARITY_SHARE` jakauman lukemiseen ja testiin. Barrel export. `reveal.test.ts` (8).
**644 vihreää.**

Jäljellä: peittosumu (karttataso, testattu 5000 solulla), paljastuskortti
(maasto+nimi+resurssit+harvinaisuus, väri ei ainoa kantaja, itsestään sulkeutuva,
niputettu), `Cell`-kytkentä (`revealedAt` on jo HEX-001:stä).

## Ei tässä

- Ihmeiden sisältö ja vaikutukset → `BRDC-WONDER-001`
- Mysteerien tarinat → `BRDC-EVENT-001`
- Lovecraft-grafiikka korttiin → `BRDC-ART-001`. Tämä tekee kortin rakenteen

## Vahvistettu — Infinite 2026-08-31

> *"lopulta palvelimen kautta kaikki saavat samat resurssit samaan paikkaan, mutta nyt
> peli arpoo uuden resurssin aina kun joku avaa heksan ekaa kertaa"*

**Palvelinta ei tarvita siihen, ja "nyt" on jo väärä kuvaus tästä pelistä.**
`terrainOf(h3)` on deterministinen FNV-1a-hash H3-indeksistä (`rules/terrain.ts`).
Sama solu antaa saman maaston jokaiselle pelaajalle, jokaisella laitteella, ilman
verkkoa, tänään. Arvonta on **kehityssuunnitelman §8.1:n `Math.random()`**, ei nykyisen
pelin käytös — ja juuri siksi sitä ei oteta käyttöön.

Eli: se lopputila, jota odotettiin palvelimelta, saadaan poistamalla arvonta
suunnitelmasta. Ei lisäämällä mitään.

## Mitattu ongelma, joka on tärkeämpi kuin arvonta

Ajettu tässä repossa 2026-08-31, `terrainOf` oikeilla H3-indekseillä Tampereen
keskustan ympäriltä:

| Säde | Ala | Jakauma |
|---|---|---|
| 6 | 0,21 km² | **tasanko 98,4 %**, vesi 1,6 % |
| 20 | 2,05 km² | tasanko 82,2 %, vesi 13,6 %, metsä 2,7 %, tori 1,4 % |
| 60 | 17,81 km² | tasanko 68,8 %, metsä 16,2 %, vesi 8,0 %, tori 7,0 % |

Tavoitejakauma reunahäivytyksen jälkeen on tasanko 68,3 %, metsä 15,1 %, vesi 9,4 %,
tori 7,2 %. **Säteellä 60 hash osuu maaliin lähes täydellisesti.** Tilastollisesti se
on siis kunnossa.

Mutta pelaaja ei kävele 17,81 km²:ä. Hän kävelee sen 0,21 km²:n, joka oli 98,4 %
tasankoa — koska klusterointi tapahtuu res 9:llä ja **koko kävelymatkan päässä oleva
naapurusto ratkeaa yhdestä tai kolmesta hash-heitosta.**

Tämä on sama juurisyy kuin `BRDC-WARD-001`:n *"no lake within 750 m"* -löydöksessä,
nyt mitattuna. Se ei ole determinismin vika vaan **väärän datan** vika, ja korjaus on
`BRDC-TERRAIN-002`: oikea maasto vektoritiilistä. Oikeassa naapurustossa on puisto,
oja, kauppa ja kallio; hashissa on yksi heitto.

**Determinismi säilyy silti pakollisena** — vektoritiilet ovat samat kaikille, ja
`source: 'tiles' | 'hash'` kertoo kumpaa vastausta katsotaan.
