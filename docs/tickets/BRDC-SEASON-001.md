# BRDC-SEASON-001 — A week's competition, tracked day by day

| | |
|---|---|
| **Alue** | `apps/worker/src/` (uusi, `history.ts`in kaava), `packages/core/src/data/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-MODE-003` (pakotettu resetti), `BRDC-HALL-003` (Chronicles —
  sama arkistokonsepti), `BRDC-ATLAS-001`in `history.ts` (sama snapshot-kaava, tiheämpi tahti) |
| **Status** | `[ ]` ei aloitettu — kirjattu 2026-09-23. Infinite: *"ei liikaa tarvi
  puuttua pelimekaiikoihin, voi arvata jos tarvii"* — lupa tulkita yksityiskohtia |

## 🔴 RED

Infinite 2026-09-23, jatkona edelliseen "päivittäiset highscore-taulut" -huomautukseen:
*"siis viikon kilpailu, päivittäinen seuranta.. vanhoista muodostetaan legacy
'historia' data, jota voi vaikka sit myöhemmin playbackata playerillä tms... lähinnä
meille 6 pelaajalle fresh haaste, ja siihen hyvät tervetuliaistoivotukset."*

Tämä ei ole "highscore joka nollautuu keskiyöllä" vaan oma kokonaisuus: **kausi on
viikko, seuranta on päivittäistä sen sisällä.** Kaikki nykyiset taulut (Codex, Route
Ledger, tuleva Chronicles) ovat elinikäisiä kumulatiivisia lukuja — tämä on eri asia:
kuusi tuttua pelaajaa haluavat yhteisen, rajatun, uuden haasteen, jonka etenemistä voi
seurata päivä päivältä viikon ajan.

## Kolme osaa

1. **Kauden alku on nollaraja.** Nykyinen tila ("vanhoista") arkistoituu
   legacy-dataksi — sama ele kuin `BRDC-HALL-003`in Chronicles ja `BRDC-MODE-003`in
   pakotettu resetti, mutta tässä **koko kuuden pelaajan porukalle kerralla**, ei
   yksittäisen pelaajan omana valintana. Todennäköisesti Infiniten oma, käsin
   laukaisema askel (kuten `wrangler deploy`), ei automaattinen
2. **Päivittäinen seuranta kauden sisällä.** Yksi kevyt snapshot/pelaaja/päivä —
   sama mekaaninen kaava kuin Atlasin `maybeSnapshot`/`listSnapshotWeeks`
   (`apps/worker/src/history.ts`), mutta viikon eikä kuukausien tahdilla ja
   pelaajakohtaisilla luvuilla (esim. matka, heksat — samat kuin Route Ledger jo
   laskee) viikon eikä kaupungin tason sijaan
3. **Tervetuliaisviesti kauden alkaessa.** Kuusi tuttua pelaajaa, yksi yhteinen hetki
   — kertaluontoinen "Kausi alkaa" -ruutu tai vastaava kun kausi käynnistyy, ei
   toistuva ilmoitus

## 🟢 Rajattu heti pois (Infiniten oma sana: ei liikaa pelimekaniikkoihin)

- **Ei muutoksia decay/capture/siege-sääntöihin.** Tämä on näyttö/seuranta päälle,
  ei uusi tapa omistaa maata — eri asia kuin `BRDC-CLAIM-017`
- **Playback-toisto ("voi vaikka sit myöhemmin") on nimenomaan myöhemmin**, ei tämän
  tiketin GREEN. Data tallennetaan niin että se olisi mahdollista rakentaa
  (aikaleimoin varustetut päivittäiset snapshotit riittävät), mutta itse
  toistin/viewer on oma, tuleva tiketti
- **Ei arvausta mittareista tässä RED:ssä** — Infinite antoi luvan arvata
  toteutuksessa, joten tarkat mittarit (matka? heksat? molemmat?) päätetään
  toteutushetkellä, ei lyödä lukkoon nyt

## 🔴 Avoin ennen toteutusta

- Onko "kausi" tekninen käsite (esim. Worker-KV-avain jonka Infinite nollaa käsin)
  vai pitääkö sille rakentaa oma hallintanäkymä? Kuudelle tutulle pelaajalle
  käsin-laukaistu riittänee — kysytään vasta jos osoittautuu vaivalloiseksi

## Ei tässä

- Playback/toistin-UI — oma tiketti myöhemmin, ei tässä
- Muutokset elinikäisiin tauluihin (Codex, Route Ledger, Chronicles) — pysyvät
  ennallaan kausien rinnalla
