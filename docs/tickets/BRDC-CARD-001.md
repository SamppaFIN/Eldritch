# BRDC-CARD-001 — HERE-kortti mallin mukaan

| | |
|---|---|
| **Alue** | `features/territory/CellPanel.tsx`, `CellHeader.tsx`, `CellOn.tsx`, `CellWorth.tsx`, `useSelection.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — neljä konkreettista korjausta tehty; visuaalinen uudelleenjärjestely auki |
| **Riippuvuudet** | `BRDC-SEED-004` (tarina, maamerkki, luottamus) — rakenne voidaan tehdä ennen |
| **Lähde** | `Eldritch-Sigil.html` §06 *Seven screens* — 03 · HERE · Infinite 2026-09-16: *"nuo kortit ovat toteutettu vain osiltaan.. Ei tarvitse noudattaa 100%, voit käyttää nykytoteutusta pohjana.. mutta rakennetaan kaikki ruudut mallien mukaiseksi"* |

## 🔴 RED

`BRDC-SIGIL-001`:n läpikäynti (v0.5.88) korjasi kortin hierarkiaa ja kahdentumia, **mutta mallia ei
rakennettu**. Mallin oma selitys:

> *"The cell identifies itself first — its own art, its own name, its own lore. The bonus resource
> gets a banner in its hue instead of a line of grey text. Nine locked rites collapse to one
> castable action plus a count, and the primary verb sits at the thumb."*

## Auditoi nykyinen kortti mallia vasten — tehty 2026-09-16

Mallin oma HTML (`Eldritch-Sigil.html`, "03 · HERE") luettu suoraan lähteestä ja verrattu
`CellPanel`in nykyiseen tuotokseen, rivi riviltä:

| Mallin osa | Peli tänään | Ero |
|---|---|---|
| ◉ YOU ARE STANDING HERE · ✕ | `cell-panel__head`: sama, "Here"-sirulla | ✅ sama sisältö, eri sijainti (sirurivillä, ei omana headerinä) |
| Kuva + nimi + SURVEYED/UNCLAIMED-sirut | Terrain-glyfi + `GROUND_NAME` + "(surveyed)"-proosa + omistus-sirut | 🔶 **korjattu tässä kierroksessa** — proosa korvattu oikealla Surveyed/"?"-sirulla, luottamuksesta luettuna |
| SPECIAL RESOURCE -banneri, oma väri, oma laatikko | `CellOn`in yleinen rivi (glyfi+nimi+kuvaus), värillinen mutta ei laatikko | 🔶 **korjattu 2026-09-16** — Infiniten kenttäraportti kuvakaappauksin: *"karttakortti ei nyt sisällä näitä koristeluita"* |
| Seikkailupisteen nappi näkyy heti | `QuestCellPanel` oli renderöity kortin **viimeisenä**, kaupan/tributin/jokaisen rakennusrivin jälkeen | 🔶 **korjattu 2026-09-16** — Infiniten kenttäraportti: *"jos ruudulla on seikkailu piste, niin se nappi näytetään ihan ensin"* |
| 3 pylvästä: GROUND / NEIGHBOURS / WALKED | `CellWorth`in `<dl>`: Ground / **Yields** / Neighbours / Walked (4) | **Tietoinen poikkeama.** "Yields" on todellinen, eri luku kuin ylläolevan otsikon "yields gold" — sen poistaminen olisi tiedon häviämistä pelkän ulkoasun vuoksi. Jätetty, koska "ei tarvitse noudattaa 100%" |
| LORE · THIS CELL | Ei kortilla vielä — odottaa `BRDC-SEED-004`:n tarinageneraattoria | ⬜ auki, tämän tiketin oma riippuvuus |
| 1 castattava riitti + "N more Rites locked here ›" | `SpellPanel`: molemmat kotiriitit aina omana rivinään, syy näkyvissä (`"Locked — study X"`, `"running"`, mana) | ❌ **ei tehdä.** Pelissä on kaksi kotiriittiä, ei yhdeksän — malli oletti isomman riittivalikoiman. Yhden rivin tiivistäminen "1 more Rite locked here"-tekstiksi **poistaisi** juuri sen syyn miksi se on lukossa (`claude.md` §14: *"errors say what to do, not what failed"*) — huonompi, ei parempi. Malli ei sovi tämän pelin todelliseen riittimäärään |
| AWAKEN THIS GROUND -päänappi peukalon alla | Ei vastaavaa nappia — `BRDC-CLAIM-009` teki valtauksesta askeleen, ei napin painalluksen | ❌ **ei tehdä.** Malli kuvaa nappi-pohjaista valtausta; peli valitsi kävely-pohjaisen mallin tarkoituksella. Väärän napin lisääminen valehtelisi mekaniikasta joka ei ole käytössä |
| Linnoituksen suoja myös naapuriheksalla | `CellWorth` luki vain oman heksan `worksOn`-listaa | 🔶 **korjattu tässä kierroksessa** |

## 🟢 GREEN

- [x] **Auditoi nykyinen kortti mallia vasten** — taulukko yllä
- [x] **Luottamus < 0,5 → "?"-siru** (`BRDC-SEED-004`:n `HexSeed.confidence`, jonka oma
      dokumentaatio osoitti suoraan tänne): uusi `surveyed(cell, terrain)` (`CellHeader.tsx`,
      viety testattavaksi kuten `isSharedGround`). Real map / käsin maalattu = aina varma;
      Worldseed-heksa lukee oman luottamuksensa (0.9 vyöhykkeen sisällä, 0.4 "ei missään
      vyöhykkeessä" — `worldseedTerrain.ts`in oma epäluotettavaksi kutsuma lattia); muualla
      hajautus on arvaus jota mikään ei vahvista. Vanha "(surveyed)/(estimated)"-proosa
      poistettu, siru korvaa sen samassa sirurivissä kuin omistus
- [x] **Linnoituksen suoja myös viereisellä heksalla** (`BRDC-BUILD-012`:n oma jäänyt kohta,
      sanasta sanaan: *"CellPanel saa yhden solun eikä naapureita"*). `useSelection.ts` näkee
      jo koko näkymän solut (`cells`); uusi `fortified(known, h3)`-kutsu (olemassa oleva
      `rules/aura.ts`in sääntö, ei uutta logiikkaa) kulkee `build.fortified`in kautta —
      **ei uutta riviä `MapView.tsx`hen**, koska se on jo 399/400: kenttä liitettiin
      olemassa olevaan `build`-olioon, joka on jo yksi rivi siellä
- [x] Testit: `CellHeader.test.ts` (4 uutta, `surveyed`in kaikki neljä haaraa, oikealla
      rakennetulla siemendatalla). Portti: 1560 testiä, `tsc -b`, `lint:lines`,
      tuotantobuild — kaikki vihreät

**Lisätty 2026-09-16, Infiniten oman kenttäraportin perusteella (kaksi kuvakaappausta:
malli vs. oikea kortti):**

- [x] **Erikoisresurssin oma laatikko.** `CellOn.tsx`in "find"-rivi saa nyt reunan ja
      taustan resurssin omassa värissä (`--box-ink`, `color-mix`), sama rakenne kuin mallin
      SPECIAL RESOURCE -banneri — ei enää pelkkä värillinen teksti tyhjän rivin päällä
- [x] **Seikkailupisteen nappi ensin.** `QuestCellPanel` siirretty `CellHeader`in jälkeen,
      ennen `CellOn`ia — se oli renderöity kortin *viimeisenä*, kaupan/tributin/jokaisen
      rakennusrivin jälkeen. Portti uudelleen: 1574 testiä, `tsc -b`, `lint:lines`,
      tuotantobuild — kaikki vihreät. **Ei todennettu selaimessa käsin** (ei
      selainautomaatiota tässä istunnossa) — devpalvelin pystyssä (`:5173`, HTTP 200)
      Infiniten omaa tarkistusta varten
- [ ] LORE · THIS CELL — odottaa `BRDC-SEED-004`:n tarinageneraattoria
- [ ] 360 px -kuvakaappaus mallin rinnalla — ei kuvakaappaustyökalua tässä istunnossa

## Ei tehdä — malli ei sovi tämän pelin sääntöihin

- **Lukittujen riittien tiivistys "N more Rites"-riviksi.** Pelillä on kaksi kotiriittiä,
  malli oletti yhdeksän. Katso auditin oma rivi
- **"AWAKEN THIS GROUND" -päänappi.** Malli kuvaa nappipohjaista valtausta;
  `BRDC-CLAIM-009` valitsi askel-valtauksen tarkoituksella. Ei väärää nappia väärästä
  mekaniikasta

## Ei tässä

- Tarinan generointi — `BRDC-SEED-003`
